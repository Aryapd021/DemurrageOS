import express from 'express';
import cors from 'cors';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { containerRouter } from './modules/containers/container.routes.js';
import { complianceRouter } from './modules/compliance/compliance.routes.js';
import { riskRouter } from './modules/risk/risk.routes.js';
import { documentRouter } from './modules/documents/document.routes.js';
import { taskRouter } from './modules/tasks/task.routes.js';
import { externalTaskRouter } from './modules/external/external-task.routes.js';
import { knowledgeRouter } from './modules/knowledge/knowledge.routes.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestIdMiddleware);

  // Healthcheck
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString()
    });
  });

  // Authoritative API routes
  app.use('/api/v1/containers', containerRouter);
  app.use('/api/v1/containers', complianceRouter);
  app.use('/api/v1/containers', riskRouter);
  app.use('/api/v1/documents', documentRouter);
  app.use('/api/v1/tasks', taskRouter);
  app.use('/api/v1/knowledge', knowledgeRouter);

  // External unauthenticated routes (Task confirmation for truckers/contacts)
  app.use('/api/v1/external', externalTaskRouter);

  // Standardized Error Handler (must be last)
  app.use(errorMiddleware);

  return app;
}
