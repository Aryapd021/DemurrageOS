import pino from 'pino';
import { env } from './env';

const pinoLogger = pino({
  level: env.LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: env.NODE_ENV === 'development',
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

export const logger = pinoLogger;
