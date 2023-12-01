import { parseAbi } from 'viem'
import {
  account,
  COLD_WALLET_ADDRESS,
  OPERATIONAL_BALANCE
} from '../config.js'
import { viemClient, walletClient } from './viemClient.js'

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

export async function sendSurplusToColdWallet(gasBalance) {
  const hash = await walletClient.sendTransaction({ 
    account,
    to: COLD_WALLET_ADDRESS,
    value: gasBalance - OPERATIONAL_BALANCE
  })

  return hash
}

export async function swapTokensToGas() {
  //const { request } = await viemClient.simulateContract({
  //  address: GAS_PROVIDER_HELPER_ADDRESS,
  //  abi: gasProviderHelperAbi,
  //  functionName: 'swapBack',
  //})
  //await walletClient.writeContract(request)
}
