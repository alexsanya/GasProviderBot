import getLogger from 'pino'
import {
  CHAINLINK_MATIC_USD_FEED
} from '../config.js' 
import { viemClient } from '../services/viemClient.js'
import aggregatorV3InterfaceAbi from '../resources/aggregatorV3InterfaceAbi.json' assert { type: 'json' }

export function splitSignature(signatureHex) {
  const rawSig = signatureHex.split('x')[1]
  return [
    `0x${rawSig.slice(-2)}`,
    `0x${rawSig.slice(0,64)}`, 
    `0x${rawSig.slice(64,-2)}`
  ]
}

async function getMaticPrice() {
  const [_, price] = await viemClient.readContract({
    address: CHAINLINK_MATIC_USD_FEED,
    abi: aggregatorV3InterfaceAbi,
    functionName: 'latestRoundData',
  })
  return Number(price / 10n**4n) / 10**4
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
    getMaticPrice(),
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
