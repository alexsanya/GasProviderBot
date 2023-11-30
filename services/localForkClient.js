import { createPublicClient, defineChain, http } from 'viem'
export { keccak256 } from 'viem'

export const localFork = defineChain({
  id: 137,
  name: 'Local',
  network: 'local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545']
    }
  }
})

export const forkClient = createPublicClient({
  chain: localFork,
  transport: http()
})


