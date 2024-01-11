import { z } from 'zod'
import getLogger from 'pino'
import { account } from '../config.js'
import { viemClient, keccak256 } from '../services/viemClient.js'
import { getEthAmount } from '../services/chainUtils.js'

import {
  NETWORK_ID,
  MIN_DEADLINE,
  ACCOUNT_ADDRESS_REGEX,
  SIGNATURE_REGEX
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

async function handler(req) {

  const response = schema.safeParse(req.body);
  if (!response.success) {
    throw new Error('invalid order')
  }
  req.order = response.data

  const { value, reward, token, permitSignature } = response.data
  const permitHash = keccak256(permitSignature)
  req.permitHash = permitHash
  const logger = getLogger({ msgPrefix: `[preValidation][${permitHash.slice(0,10)}] ` })
  logger.info(response.data)
  logger.info('Order format is correct')

  const tokenAmount = value - reward
  if (tokenAmount < 0 ) {
    logger.error('Reward exceeds value')
    throw new Error('invalid order')
  }

  const gasProviderBalance = await viemClient.getBalance({ 
    address: account.address
  })

  req.gasProviderBalance = gasProviderBalance

  const valueToSend = await getEthAmount(tokenAmount, token)
  req.valueToSend = valueToSend
  logger.info(`Account balance is ${gasProviderBalance}`)
  logger.info(`Estimated anount of wei required for swap: ${valueToSend}`)

  if (valueToSend > (gasProviderBalance + gasProviderBalance / 2n) ) {
    req.useFlashLoan = true
    logger.info('Flashloan is required')
  } else {
    req.useFlashLoan = false
    logger.info('Can swap without flashloan')
  }
}

export default handler
