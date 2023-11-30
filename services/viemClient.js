import { polygon } from 'viem/chains'
import { createPublicClient, createWalletClient, http } from 'viem'
import { forkClient, localFork  } from './localForkClient.js'
export { keccak256 } from 'viem'


const polygonClient = createPublicClient({
  chain: polygon,
  transport: http()
})

export const walletClient = createWalletClient({
  chain: (process.env.NODE_ENV === 'development') ? localFork : polygon,
  transport: http()
})


export const viemClient = (process.env.NODE_ENV === 'development') ? forkClient : polygonClient

