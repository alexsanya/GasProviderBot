import { encodeAbiParameters } from 'viem'
import {
  account,
  COLD_WALLET_ADDRESS,
  MAX_UINT256,
  ZERO_ADDRESS,
  OPERATIONAL_BALANCE,
  SYNC_SWAP_CLASSIC_POOL_FACTORY,
  WETH_ADDRESS,
  USDT_ADDRESS,
  ROUTER_ADDRESS,
  CHAINLINK_MATIC_USD_FEED
} from '../config.js'
import { viemClient, walletClient } from './viemClient.js'

import erc20abi from '../resources/erc20.json' assert { type: 'json' }
import routerAbi from '../resources/router.json' assert { type: 'json' }
import classicPoolFactoryAbi from '../resources/classicPoolFactory.json' assert { type: 'json' }
import aggregatorV3InterfaceAbi from '../resources/aggregatorV3InterfaceAbi.json' assert { type: 'json' }

export async function getTokenBalance(token, address) {
  const balance = await viemClient.readContract({
    address: token,
    abi: erc20abi,
    functionName: 'balanceOf',
    args: [
      address
    ]
  })

  return balance
}

async function getAllowance(token, owner, spender) {
  const value = await viemClient.readContract({
    address: token,
    abi: erc20abi,
    functionName: 'allowance',
    args: [
      owner,
      spender
    ]
  })

  return value
}

export async function getEthPrice() {
  const [_, price] = await viemClient.readContract({
    address: CHAINLINK_MATIC_USD_FEED,
    abi: aggregatorV3InterfaceAbi,
    functionName: 'latestRoundData',
  })
  return Number(price / 10n**4n) / 10**4
}

export async function getEthAmount(value, token) {
  const ethPrice = await getEthPrice()

  return BigInt(Math.round(value * 10**12 / ethPrice))
}

export async function sendSurplusToColdWallet(gasBalance) {
  const hash = await walletClient.sendTransaction({ 
    account,
    to: COLD_WALLET_ADDRESS,
    value: gasBalance - OPERATIONAL_BALANCE
  })

  return hash
}

async function getPoolAddress() {
  const poolAddress = await viemClient.readContract({
    address: SYNC_SWAP_CLASSIC_POOL_FACTORY,
    abi: classicPoolFactoryAbi,
    functionName: 'getPool',
    args: [
      WETH_ADDRESS,
      USDT_ADDRESS
    ]
  })

  console.log('Pool address: ', poolAddress)   // Checks whether the pool exists.

  // Checks whether the pool exists.
  if (poolAddress === ZERO_ADDRESS) {
      throw Error('Pool not exists');
  }

  return poolAddress;
}

export async function swapTokensToGas() {
  const poolAddress = await getPoolAddress();

  const withdrawMode = 1; // 1 or 2 to withdraw to user's wallet

  const swapData = encodeAbiParameters(
    [
      { type: 'address'},
      { type: 'address' },
      { type: 'uint8' }
    ],
    [USDT_ADDRESS, account.address, withdrawMode]
  )

  // We have only 1 step.
  const steps = [{
      pool: poolAddress,
      data: swapData,
      callback: ZERO_ADDRESS, // we don't have a callback
      callbackData: '0x',
  }];

  console.log('Address: ', account.address);
  const balanceBefore = await getTokenBalance(USDT_ADDRESS, account.address);
  console.log('USDT balance before: ', balanceBefore.toString());

  // We have only 1 path.
  const paths = [{
      steps: steps,
      tokenIn: USDT_ADDRESS,
      amountIn: balanceBefore,
  }];

  // approve USDT spending for router
  // let`s assume router has unlimited approval

  const allowance = await getAllowance(USDT_ADDRESS, account.address, ROUTER_ADDRESS);
  console.log(`Allowance is: ${allowance}`);
  if (allowance < MAX_UINT256) {
    const { request } = await viemClient.simulateContract({
      address: USDT_ADDRESS,
      abi: erc20abi,
      functionName: 'approve',
      account,
      args: [
        ROUTER_ADDRESS,
        MAX_UINT256
      ]
    })
    const hash = await walletClient.writeContract(request);
    console.log(`Approve succeed. Transaction: ${hash}`);
  } else {
    console.log('Skip approval');
  }

  const ethBalanceBefore = await viemClient.getBalance({ address: account.address });

  const { request } = await viemClient.simulateContract({
    address: ROUTER_ADDRESS,
    abi: routerAbi,
    functionName: 'swap',
    account,
    args: [
      paths,
      0,
      BigInt(Math.floor(Date.now() / 1000)) + 1800n 
    ]
  });
  const hash = await walletClient.writeContract(request);
  console.log(`Swap succeed. Transaction: ${hash}`);

  const balanceAfter = await getTokenBalance(USDT_ADDRESS, account.address);
  console.log('USDT balance after: ', balanceAfter.toString());
  console.log('WETH balance after: ', await getTokenBalance(WETH_ADDRESS, account.address));
  const ethBalanceAfter = await viemClient.getBalance({ address: account.address });
  console.log('ETH ballance diff: ', ethBalanceAfter - ethBalanceBefore);
}

