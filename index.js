import getLogger from 'pino'
import restify from 'restify'
import createLogger from 'restify-pino-logger'
import evaluateOrderSize from './middlewares/evaluateOrderSize.js'
import getPricesData from './middlewares/getPricesData.js'
import validateWithoutFlashloan from './middlewares/validateWithoutFlashLoan.js'
import validateWithFlashloan from './middlewares/validateWithFlashLoan.js'
import processOrder from './handlers/processOrder.js'
import swapBack from './handlers/swapBack.js'
import { io } from 'socket.io-client'
import { PORT, BROADCAST_SERVER_URL } from './config.js'

const server = restify.createServer({name: 'swap_bot'})
const pino = createLogger()
const logger = getLogger()

async function processPipeline(entity, stages) {
  const req = {
    body: entity
  }
  
  for (let i=0; i < stages.length; i++) {
    await stages[i](req)
  }
}

function run() {

  const socket = io(BROADCAST_SERVER_URL, {
    reconnectionDelayMax: 10000,
  });

  socket.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      logger.info('Server has disconnected, reconnecting...')
      socket.connect();
    }
  });

  socket.on("connect_error", (error) => {
    logger.error('Socket connection error', error)
  });

  socket.on("connect", () => {
    logger.info('Connected to broadcast server')
  });


  socket.on("order", async (data) => {
    logger.info('New order recieved')
    logger.info(data)
    await processPipeline(data, [
      evaluateOrderSize,
      getPricesData,
      validateWithFlashloan,
      validateWithoutFlashloan,
      processOrder
    ])
  })


  server.use(pino)
  server.use(restify.plugins.bodyParser())
  server.post('/swap_back', swapBack);

}

run()
