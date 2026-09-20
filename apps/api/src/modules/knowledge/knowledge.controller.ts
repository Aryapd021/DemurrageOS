import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/index.js';
import { ValidationError, AppError, UnauthorizedError } from '../../common/errors/app-error.js';
import { KnowledgeQueryRequestSchema } from '@demurrageos/shared-types';

export class KnowledgeController {
  public static async queryKnowledge(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const parseResult = KnowledgeQueryRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message || 'Invalid search query');
      }

      const { query, nResults, includeDemo } = parseResult.data;
      const orgId = req.user.organizationId;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.internalServiceKey) {
        headers['Authorization'] = `Bearer ${config.internalServiceKey}`;
      }

      const aiResponse = await fetch(`${config.aiServiceUrl}/api/ai/knowledge/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          org_id: orgId,
          n_results: nResults || 3,
          include_demo: includeDemo || false
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (!aiResponse.ok) {
        throw new AppError(`Knowledge intelligence service returned HTTP ${aiResponse.status}`, aiResponse.status);
      }

      const data: any = await aiResponse.json();

      res.json({
        data: data.results || []
      });
    } catch (err) {
      next(err);
    }
  }
}
