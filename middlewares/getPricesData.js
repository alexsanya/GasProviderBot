import getLogger from 'pino'
import { getEthPrice } from '../services/chainUtils.js'
import { viemClient } from '../services/viemClient.js'

export function splitSignature(signatureHex) {
  const rawSig = signatureHex.split('x')[1]
  return [
    `0x${rawSig.slice(-2)}`,
    `0x${rawSig.slice(0,64)}`, 
    `0x${rawSig.slice(64,-2)}`
  ]
}

async function handler(req) {
  const { signer, token, value, deadline, reward, permitSignature, rewardSignature } = req.order
  const [permitV, permitR, permitS] = splitSignature(permitSignature)
  const [rewardV, rewardR, rewardS] = splitSignature(rewardSignature)

  const swapArgs = [
    signer,
    token,
    value,
    deadline,
    reward,
    permitV,
    permitR,
    permitS,
    rewardV,
    rewardR,
    rewardS
  ]

  const [maticPrice, gasPrice] = await Promise.all([
    getEthPrice(),
    viemClient.getGasPrice() 
  ])

  const logger = getLogger({ msgPrefix: `[getPriceData][${req.permitHash.slice(0,10)}] ` })

  logger.info(`Matic price: ${maticPrice}`)
  logger.info(`Gas price: ${gasPrice}`)

  req.swapArgs = swapArgs
  req.maticPrice = maticPrice
  req.gasPrice = gasPrice
}

export default handler
