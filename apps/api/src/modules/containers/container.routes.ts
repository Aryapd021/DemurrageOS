import { Router } from 'express';
import { ContainerController } from './container.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', ContainerController.listContainers);
router.get('/:id', ContainerController.getContainer);
router.post('/:id/fallback-cfs', ContainerController.fallbackToCfs);

export const containerRouter = router;
