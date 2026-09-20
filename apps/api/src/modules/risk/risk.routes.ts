import { Router } from 'express';
import { RiskController } from './risk.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/:containerId/risk', RiskController.getContainerRisk);

export const riskRouter = router;
