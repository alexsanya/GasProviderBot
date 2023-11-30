import { polygon } from 'viem/chains'
import { createPublicClient, http } from 'viem'
export { keccak256 } from 'viem'

export const viemClient = createPublicClient({
  chain: polygon,
  transport: http()
})
