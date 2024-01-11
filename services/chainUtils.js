import { parseAbi } from 'viem'
import {
  account,
  COLD_WALLET_ADDRESS,
  GAS_BROKER_ADDRESS,
  OPERATIONAL_BALANCE,
  GAS_PROVIDER_HELPER_ADDRESS,
  USDC_ADDRESS,
  CHAINLINK_MATIC_USD_FEED
} from '../config.js'
import { viemClient, walletClient } from './viemClient.js'
import gasBrokerABI from '../resources/gasBrokerABI.json' assert { type: 'json' }
import gasProviderHelperAbi from '../resources/gasProviderHelperAbi.json' assert { type: 'json' }
import aggregatorV3InterfaceAbi from '../resources/aggregatorV3InterfaceAbi.json' assert { type: 'json' }

const erc20abi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)'
])

export async function getTokenBalance(token, account) {
  const balance = await viemClient.readContract({
    address: token,
    abi: erc20abi,
    functionName: 'balanceOf',
    args: [
      account
    ]
  })

  return balance
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

export async function swapTokensToGas() {
  throw new Error('Not implemented')
}
