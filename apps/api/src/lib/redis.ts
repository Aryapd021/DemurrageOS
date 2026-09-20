import { Redis } from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../common/logging/logger.js';

let redisInstance: Redis | null = null;
let isRedisConnected = false;

export function getRedisClient(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  try {
    redisInstance = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 5) {
          logger.warn(`Redis connection retry limit reached. Operating in degraded async mode.`);
          return null;
        }
        return Math.min(times * 500, 2000);
      }
    });

    redisInstance.on('connect', () => {
      isRedisConnected = true;
      logger.info('Redis connected successfully');
    });

    redisInstance.on('error', (err) => {
      isRedisConnected = false;
      logger.warn(`Redis connection error: ${err.message}. Synchronous APIs remain unaffected.`);
    });

    return redisInstance;
  } catch (err: any) {
    logger.warn(`Failed to initialize Redis client: ${err.message}. Async jobs degraded.`);
    return null;
  }
}

export function isRedisAvailable(): boolean {
  return isRedisConnected;
}
