import { zkSync } from 'viem/chains'
import { createPublicClient, createWalletClient, http } from 'viem'
import { forkClient } from './localForkClient.js'
export { keccak256 } from 'viem'


const zkSyncClient = createPublicClient({
  chain: zkSync,
  transport: http()
})

export const walletClient = createWalletClient({
  chain: zkSync,
  transport: http()
})


export const viemClient = (process.env.NODE_ENV === 'development') ? forkClient : zkSyncClient

