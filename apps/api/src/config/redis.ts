import { Redis } from 'redis';
import { env } from './env';
import { logger } from './logger';

let redis: Redis | null = null;

export async function getRedis(): Promise<Redis> {
  if (redis) {
    return redis;
  }

  redis = new Redis({
    url: env.REDIS_URL,
  });

  redis.on('connect', () => {
    logger.info('Redis connected');
  });

  redis.on('error', (err) => {
    logger.error(err, 'Redis error');
  });

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
