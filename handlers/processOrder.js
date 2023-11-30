import getLogger from 'pino'

function handler(req, res, next) {
  const logger = getLogger({ msgPrefix: `[executor][${req.permitHash.slice(0,10)}] ` })
  logger.info('Executing transaction...')

  res.send(200, req.args)

  next();
}

export default handler
