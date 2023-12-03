import getLogger from 'pino'
import restify from 'restify'
import createLogger from 'restify-pino-logger'
import evaluateOrderSize from './middlewares/evaluateOrderSize.js'
import getPricesData from './middlewares/getPricesData.js'
import validateWithoutFlashloan from './middlewares/validateWithoutFlashloan.js'
import validateWithFlashloan from './middlewares/validateWithFlashloan.js'
import processOrder from './handlers/processOrder.js'
import swapBack from './handlers/swapBack.js'
import { PORT } from './config.js'

const server = restify.createServer({name: 'swap_bot'})
const pino = createLogger()
const logger = getLogger()

function run() {

  server.use(pino)
  server.use(restify.plugins.bodyParser())
  server.post(
    '/order',
    evaluateOrderSize,
    getPricesData,
    validateWithFlashloan,
    validateWithoutFlashloan,
    processOrder
  );
  server.post('/swap_back', swapBack);

  server.listen(PORT, function() {
    logger.info('%s listening at %s', server.name, server.url);
  });
}

run()
