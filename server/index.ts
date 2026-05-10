import app from './src/app';
import { env } from './src/config/env';
import { logger } from './src/utils/logger';

// Import worker so it starts listening to the queue
import './src/queues/ingestion.worker';

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
  logger.info(`Worker listening for PDF ingestion jobs`);
});