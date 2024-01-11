import getLogger from 'pino'
import { account } from '../config.js'
import { encodeFunctionData } from 'viem'
import { viemClient } from '../services/viemClient.js'
import gasBrokerABI from '../resources/gasBrokerABI.json' assert { type: 'json' }
import gasProviderHelperAbi from '../resources/gasProviderHelperAbi.json' assert { type: 'json' }

import {
  PROFIT_FACTOR,
  USDC_ADDRESS,
  UNISWAP_USDC_WMATIC_POOL_ADDRESS,
  GAS_PROVIDER_HELPER_ADDRESS,
  GAS_LIMIT
} from '../config.js' 

async function evaluate(logger, valueToSend, swapArgs) {
  const valueParam = valueToSend + valueToSend / 3n
  logger.info(`Value param: ${valueParam}`)

  const swapCalldata = encodeFunctionData({
    abi: gasBrokerABI,
    functionName: 'swap',
    args: swapArgs
  })

  const contractCallParams = {
    address: GAS_PROVIDER_HELPER_ADDRESS,
    abi: gasProviderHelperAbi,
    functionName: 'swapWithFlashloan', 
    account,
    args: [
      UNISWAP_USDC_WMATIC_POOL_ADDRESS,
      USDC_ADDRESS,
      valueParam,
      swapCalldata
    ],
    gas: GAS_LIMIT
  }


  const { request, result } = await viemClient.simulateContract(contractCallParams)
  logger.info('Order is valid')

  const gasRequired = await viemClient.estimateContractGas(contractCallParams)
  logger.info(`Gas estimation: ${gasRequired}`)
  return {
    gasRequired,
    transaction: request,
    balanceAfter: result
  }

}

async function handler(req) {
  if (!req.useFlashLoan) {
    return;
  }
  throw new Error('Flash loan is not implemented')

  const logger = getLogger({ msgPrefix: `[validate][withFlashLoan][${req.permitHash.slice(0,10)}] ` })

  try {
    const { transaction, gasRequired, balanceAfter } = await evaluate(logger, req.valueToSend, req.swapArgs)
    const transactionCostInWei = gasRequired * req.gasPrice
    const profitInWei = balanceAfter - req.gasProviderBalance
    req.transaction = transaction
    logger.info(`WEI price for transaction: ${transactionCostInWei}`)
    logger.info(`WEI returned after transaction: ${profitInWei}`)
    if (profitInWei < transactionCostInWei * BigInt(PROFIT_FACTOR)) {
      logger.info('Order is not profitable and will be skipped')
      throw new Error('Not profitable')
    }
    const profitInUsd = Number((profitInWei - transactionCostInWei) / 10n**13n) * req.maticPrice / 100000
    logger.info(`Estimated profit: $${profitInUsd}`)
  } catch (error) {
    logger.error(error)
    throw new Error('invalid order')
  }


}

export default handler
