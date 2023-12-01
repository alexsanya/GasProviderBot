import getLogger from 'pino'
import { viemClient } from '../services/viemClient.js'
import { getTokenBalance, sendSurplusToColdWallet } from '../services/chainUtils.js'
import { account, USDC_ADDRESS, USDC_TRESHOLD, USDC_DECIMALS_RATIO, GAS_TRESHOLD } from '../config.js'

async function handler(_, res) {
  const logger = getLogger({ msgPrefix: `[swapBack] ` })

  const tokenBalance = await getTokenBalance(USDC_ADDRESS, account.address)
  logger.info(`Token balance is: ${tokenBalance}`)

  if (tokenBalance > USDC_TRESHOLD * USDC_DECIMALS_RATIO) {
    await swapTokensToGas()
  }

  const gasBalance = await viemClient.getBalance({ 
    address: account.address
  })

  logger.info(`Gas balance is: ${gasBalance}`)

  if (gasBalance > GAS_TRESHOLD) {
    const hash = await sendSurplusToColdWallet(gasBalance)
    logger.info(`Gas surplas been sent to cold wallet. Tx id: ${hash}`)
  }

  res.send(200)
}

export default handler
