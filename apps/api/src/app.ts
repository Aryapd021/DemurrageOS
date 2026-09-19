import express, { Express } from 'express';
import { env } from './config/env';
import { logger } from './config/logger';
import { requestIdMiddleware, loggerMiddleware, errorHandler } from './middleware/request-context';

import indexRoutes from './routes/index';
import clientRoutes from './routes/clients';
import containerRoutes from './routes/containers';
import chargeRoutes from './routes/charges';
import taskRoutes from './routes/tasks';
import riskRoutes from './routes/risk';
import masterRoutes from './routes/masters';
import alertRoutes from './routes/alerts';
import importRoutes from './routes/imports';
import documentRoutes from './routes/documents';
import analyticsRoutes from './routes/analytics';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(requestIdMiddleware);
  app.use(loggerMiddleware);

  // CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Health checks
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/ready', async (req, res) => {
    try {
      // Check database
      const { prisma } = await import('./config/database');
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready' });
    } catch (error) {
      res.status(503).json({ status: 'not ready', reason: 'database connection failed' });
    }
  });

  // Routes
  app.use(indexRoutes);
  app.use(clientRoutes);
  app.use(containerRoutes);
  app.use(chargeRoutes);
  app.use(taskRoutes);
  app.use(riskRoutes);
  app.use(masterRoutes);
  app.use(alertRoutes);
  app.use(importRoutes);
  app.use(documentRoutes);
  app.use(analyticsRoutes);

  // Error handling
  app.use(errorHandler);

  return app;
}

export async function startServer() {
  const app = createApp();
  const port = parseInt(env.PORT) || 3000;

  const server = app.listen(port, () => {
    logger.info({ port }, 'API server started');
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(async () => {
      const { prisma } = await import('./config/database');
      await prisma.$disconnect();
      logger.info('Server shut down');
      process.exit(0);
    });
  });

  return server;
}
