import { Router } from 'express';
import { TaskController } from './task.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', TaskController.createTask);
router.get('/container/:containerId', TaskController.getContainerTasks);
router.post('/:id/revoke', TaskController.revokeTask);

export const taskRouter = router;
