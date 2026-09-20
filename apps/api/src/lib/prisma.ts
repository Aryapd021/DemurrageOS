import { PrismaClient } from '@prisma/client';
import { logger } from '../common/logging/logger.js';

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient({
      log: ['warn', 'error']
    });
  }
  prisma = global.__db__;
}

export { prisma };
