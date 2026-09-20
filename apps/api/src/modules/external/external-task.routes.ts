import { Router } from 'express';
import { ExternalTaskController } from './external-task.controller.js';

const router = Router();

// Unauthenticated endpoints for external contact confirmation
router.get('/task-confirmations/:token', ExternalTaskController.getTaskSummary);
router.post('/task-confirmations/:token/confirm', ExternalTaskController.confirmTask);

export const externalTaskRouter = router;
