import { Queue } from 'bullmq';
import { getRedisClient } from '../lib/redis.js';
import { logger } from '../common/logging/logger.js';

let documentExtractionQueue: Queue | null = null;
let taskNotificationQueue: Queue | null = null;

export function getDocumentExtractionQueue(): Queue | null {
  if (documentExtractionQueue) return documentExtractionQueue;

  const redis = getRedisClient();
  if (!redis) {
    logger.warn('Redis not available. Extraction queue disabled; falling back to direct execution.');
    return null;
  }

  try {
    documentExtractionQueue = new Queue('process-document-extraction', {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    });
    return documentExtractionQueue;
  } catch (err: any) {
    logger.warn(`Failed to initialize extraction queue: ${err.message}`);
    return null;
  }
}

export function getTaskNotificationQueue(): Queue | null {
  if (taskNotificationQueue) return taskNotificationQueue;

  const redis = getRedisClient();
  if (!redis) {
    logger.warn('Redis not available. Task notification queue disabled; falling back to direct execution.');
    return null;
  }

  try {
    taskNotificationQueue = new Queue('send-task-confirmation', {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1500
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    });
    return taskNotificationQueue;
  } catch (err: any) {
    logger.warn(`Failed to initialize task notification queue: ${err.message}`);
    return null;
  }
}
