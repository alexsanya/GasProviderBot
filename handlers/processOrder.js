import getLogger from 'pino'
import { viemClient, walletClient } from '../services/viemClient.js'
import { account } from '../config.js'

async function handler(req) {
  const logger = getLogger({ msgPrefix: `[executor][${req.permitHash.slice(0,10)}] ` })
  logger.info('Executing transaction...')
  try {
    const hash = await walletClient.writeContract(req.transaction)
    logger.info(`Transaction hash: ${hash}`)
    const balance = await viemClient.getBalance({ 
      address: account.address
    })
    logger.info(`Gas provider balance: ${balance}`)
  } catch (error) {
    logger.error('Transaction failed', error)
    logger.error(error)
  }


  next();
}

export default handler
