import getLogger from 'pino'
import restify from 'restify'
import createLogger from 'restify-pino-logger'
import validateOrder from './middlewares/validateOrder.js'
import processOrder from './handlers/processOrder.js'
import { PORT } from './config.js'

const server = restify.createServer({name: 'swap_bot'})
const pino = createLogger()
const logger = getLogger()

function run() {

  server.use(pino)
  server.use(restify.plugins.bodyParser())
  server.post('/order', validateOrder, processOrder);

  server.listen(PORT, function() {
    logger.info('%s listening at %s', server.name, server.url);
  });
}

run()
