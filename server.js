import { createServer } from 'http';
import app, { port } from './app.js';
import connectDB from './src/utils/db.util.js';
import scheduleCronJobs from './src/utils/cron.util.js';
import logger from './src/utils/logger.util.js';
import { backfillCaseNumbers } from './src/utils/backfillCaseNumbers.util.js';

const httpServer = createServer(app);

const start = async () => {
  await connectDB();
  scheduleCronJobs();
  await backfillCaseNumbers();
  httpServer.listen(port, () => {
    logger.info(`Immigration API running on http://localhost:${port}`);
  });
};

start();
