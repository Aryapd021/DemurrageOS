import { Router } from 'express';
import { ComplianceController } from './compliance.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/:containerId/compliance-signals', ComplianceController.getSignals);
router.post('/:containerId/compliance-signals', ComplianceController.setManualSignal);
router.post('/:containerId/compliance-signals/recalculate', ComplianceController.recalculateSignals);

export const complianceRouter = router;
