import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './common/logging/logger.js';
import { getRedisClient } from './lib/redis.js';

const app = createApp();

// Attempt non-blocking Redis connection
getRedisClient();

app.listen(config.port, () => {
  logger.info(`DemurrageOS Authoritative API listening on port ${config.port} (${config.env})`);
  logger.info(`AI Service configured at: ${config.aiServiceUrl}`);
});
