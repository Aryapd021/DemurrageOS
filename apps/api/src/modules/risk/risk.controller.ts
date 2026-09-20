import { Request, Response, NextFunction } from 'express';
import { RiskService } from './risk.service.js';

export class RiskController {
  public static async getContainerRisk(req: Request, res: Response, next: NextFunction) {
    try {
      const containerId = String(req.params.containerId);
      const user = req.user!;
      const assessment = await RiskService.calculateContainerRisk(user, containerId);
      res.json({ data: assessment });
    } catch (err) {
      next(err);
    }
  }
}
