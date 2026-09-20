import { Request, Response, NextFunction } from 'express';
import { ContainerService } from './container.service.js';
import { ValidationError } from '../../common/errors/app-error.js';

export class ContainerController {
  public static async listContainers(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const containers = await ContainerService.listContainers(user);
      res.json({ data: containers });
    } catch (err) {
      next(err);
    }
  }

  public static async getContainer(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const container = await ContainerService.getContainer(user, id);
      res.json({ data: container });
    } catch (err) {
      next(err);
    }
  }

  public static async fallbackToCfs(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const { cfsId, reason } = req.body;

      if (!cfsId) {
        throw new ValidationError('cfsId is required for CFS fallback');
      }

      const updated = await ContainerService.fallbackDpdToCfs(user, id, cfsId, reason);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
}
