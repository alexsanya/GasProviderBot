import getLogger from 'pino'
import { account } from '../config.js'
import { viemClient } from '../services/viemClient.js'
import gasBrokerABI from '../resources/gasBrokerABI.json' assert { type: 'json' }

import {
  GAS_LIMIT,
  PROFIT_FACTOR,
  GAS_BROKER_ADDRESS,
} from '../config.js' 


async function handler(req, res) {
  async function simulate(valueParam) {
     const result = await viemClient.simulateContract({
      address: GAS_BROKER_ADDRESS,
      abi: gasBrokerABI,
      functionName: 'swap', 
      account,
      args: req.swapArgs,
      value: valueParam,
      gas: GAS_LIMIT
    })

    return result.request
  }

  async function estimateGas(valueParam) {

    return viemClient.estimateContractGas({
        address: GAS_BROKER_ADDRESS,
        abi: gasBrokerABI,
        functionName: 'swap', 
        account,
        value: valueParam,
        args: req.swapArgs
      })
  }

  async function evaluate(logger) {
    const valueParam = req.valueToSend + req.valueToSend / 3n
    logger.info(`Value param: ${valueParam}`)

    req.transaction = await simulate(valueParam)
    logger.info('Order is valid')

    const gasRequired = await estimateGas(valueParam)
    logger.info(`Gas estimation: ${gasRequired}`)
    return req.gasPrice * gasRequired

  }

  if (req.useFlashLoan) {
    return;
  }
  const logger = getLogger({ msgPrefix: `[validate][noFlashLoan][${req.permitHash.slice(0,10)}] ` })

  try {
    const maticRequired = await evaluate(logger)
    logger.info(`MATIC price estimation: ${maticRequired}`)
    logger.info(`req.maticPrice: ${req.maticPrice}`)
    const usdCost = Number(maticRequired / 10n**13n) * req.maticPrice / 100000
    const { reward } = req.order
    logger.info(`Comission: $${reward / 10**6} Transaction cost: $${usdCost} Profit: $${reward / 10**6 - usdCost}`)
    if (usdCost * PROFIT_FACTOR > reward / 10**6) {
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
