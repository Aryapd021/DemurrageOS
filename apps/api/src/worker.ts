import { logger } from '../config/logger';
import { initializeQueues, startWorkers, closeQueues } from './queues';

async function startWorkerProcess() {
  try {
    logger.info('Starting worker process...');

    await initializeQueues();
    await startWorkers();

    logger.info('Worker process started successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to start worker process');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down worker');
  await closeQueues();
  process.exit(0);
});

startWorkerProcess();
