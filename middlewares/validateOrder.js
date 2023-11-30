import { z } from 'zod'
import getLogger from 'pino'
import { viemClient, keccak256 } from '../services/viemClient.js'
import gasBrokerABI from '../resources/gasBrokerABI.json' assert { type: 'json' }
import aggregatorV3InterfaceAbi from '../resources/aggregatorV3InterfaceABI.json' assert { type: 'json' }

import {
  NETWORK_ID,
  MIN_DEADLINE,
  PROFIT_FACTOR,
  ACCOUNT_ADDRESS_REGEX,
  SIGNATURE_REGEX,
  GAS_BROKER_ADDRESS,
  GAS_PROVIDER_ADDRESS,
  CHAINLINK_MATIC_USD_FEED
} from '../config.js' 


const schema = z.object({
  signer: z.string().regex(ACCOUNT_ADDRESS_REGEX),
  networkId: z.number().lte(NETWORK_ID).gte(NETWORK_ID),
  token: z.string().regex(ACCOUNT_ADDRESS_REGEX),
  value: z.number().min(0),
  deadline: z.number().min(MIN_DEADLINE),
  reward: z.number().min(0),
  permitSignature: z.string().regex(SIGNATURE_REGEX),
  rewardSignature: z.string().regex(SIGNATURE_REGEX)
})

export function splitSignature(signatureHex) {
  const rawSig = signatureHex.split('x')[1]
  return [
    `0x${rawSig.slice(-2)}`,
    `0x${rawSig.slice(0,64)}`, 
    `0x${rawSig.slice(64,-2)}`
  ]
}

function simulate(args, valueParam) {
  return viemClient.simulateContract({
    address: GAS_BROKER_ADDRESS,
    abi: gasBrokerABI,
    functionName: 'swap', 
    account: GAS_PROVIDER_ADDRESS,
    args,
    value: valueParam
  })
}

async function estimateGas(args, valueParam) {

  return viemClient.estimateContractGas({
      address: GAS_BROKER_ADDRESS,
      abi: gasBrokerABI,
      functionName: 'swap', 
      account: GAS_PROVIDER_ADDRESS,
      value: valueParam,
      args
    })
}

async function getMaticPrice() {
  const [_, price] = await viemClient.readContract({
    address: CHAINLINK_MATIC_USD_FEED,
    abi: aggregatorV3InterfaceAbi,
    functionName: 'latestRoundData',
  })
  return Number(price / 10n**4n) / 10**4
}

async function handler(req, res) {

  const response = schema.safeParse(req.body);
  if (!response.success) {
    res.send(400, response.error.errors)
    throw new Error('invalid order')
  }

  const { signer, token, value, deadline, reward, permitSignature, rewardSignature } = response.data
  const [permitV, permitR, permitS] = splitSignature(permitSignature)
  const [rewardV, rewardR, rewardS] = splitSignature(rewardSignature)

  const permitHash = keccak256(permitSignature)
  const logger = getLogger({ msgPrefix: `[validator][${permitHash.slice(0,10)}] ` })
  logger.info('Order passed validation')
  logger.info(response.data)

  const args = [
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

  const gasProviderBalance = await viemClient.getBalance({ 
    address: GAS_PROVIDER_ADDRESS
  })

  logger.info(`Gas provider balance: ${gasProviderBalance}`)
  
  const maticPrice = await getMaticPrice()
  logger.info(`Matic price: ${maticPrice}`)

  const valueParam = BigInt(Math.round((value - reward) / maticPrice * 1.5)) * 10n**12n

  logger.info(`Value param: ${valueParam}`)


  try {
    await simulate(args, valueParam)
    req.args = args
    req.permitHash = permitHash
    logger.info('Order is valid')

    const gasRequired = await estimateGas(args, valueParam)
    logger.info(`Gas estimation: ${gasRequired}`)
    const gasPrice = await viemClient.getGasPrice() 
    const maticRequired = gasPrice * gasRequired
    logger.info(`MATIC price estimation: ${maticRequired}`)
    const usdCost = Number(maticRequired / 10n**15n) * maticPrice / 1000
    logger.info(`Comission: $${reward / 10**6} Transaction cost: $${usdCost} Profit: $${reward / 10**6 - usdCost}`)

    if (usdCost * PROFIT_FACTOR > reward) {
      logger.info('Order is not profitable and will be skipped')
      throw new Error('Not profitable')
    }


  } catch (error) {
    logger.error(error)
    res.send(400, error)
    throw new Error('invalid order')
  }


}

export default handler
