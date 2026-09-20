import { createClient } from 'redis';
import { env } from './env';
import { logger } from './logger';

let redis: ReturnType<typeof createClient> | null = null;

export async function getRedis() {
  if (redis) {
    return redis;
  }

  redis = createClient({
    url: env.REDIS_URL,
  });

  redis.on('connect', () => {
    logger.info('Redis connected');
  });

  redis.on('error', (err: Error) => {
    logger.error(err, 'Redis error');
  });

  await redis.connect();
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
