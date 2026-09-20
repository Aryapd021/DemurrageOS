import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://demurrage:demurrage_secret@localhost:5432/demurrageos?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-minimum-32-chars-for-hmac-sha256',
  uploadDir: process.env.DOCUMENT_STORAGE_PATH || path.join(process.cwd(), 'uploads'),
  notificationProvider: process.env.NOTIFICATION_PROVIDER || 'console',
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY || '',
  dpdPickupWindowHours: parseInt(process.env.DPD_PICKUP_WINDOW_HOURS || '48', 10)
};
