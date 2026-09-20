import { Router } from 'express';
import { KnowledgeController } from './knowledge.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/query', KnowledgeController.queryKnowledge);

export const knowledgeRouter = router;
