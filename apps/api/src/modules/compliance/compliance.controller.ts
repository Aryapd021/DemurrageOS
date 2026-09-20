import { Request, Response, NextFunction } from 'express';
import { ComplianceService } from './compliance.service.js';
import { CreateManualSignalSchema } from '@demurrageos/shared-types';
import { ValidationError } from '../../common/errors/app-error.js';
import { RiskService } from '../risk/risk.service.js';

export class ComplianceController {
  public static async getSignals(req: Request, res: Response, next: NextFunction) {
    try {
      const containerId = String(req.params.containerId);
      const user = req.user!;
      const signals = await ComplianceService.getSignals(user, containerId);
      res.json({ data: signals });
    } catch (err) {
      next(err);
    }
  }

  public static async setManualSignal(req: Request, res: Response, next: NextFunction) {
    try {
      const containerId = String(req.params.containerId);
      const user = req.user!;

      const parsed = CreateManualSignalSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid manual compliance signal payload', parsed.error.format());
      }

      const signal = await ComplianceService.setManualSignal(user, containerId, parsed.data);
      
      // Recalculate deterministic risk score
      const updatedRisk = await RiskService.calculateContainerRisk(user, containerId);

      res.status(200).json({
        data: signal,
        riskAssessment: updatedRisk
      });
    } catch (err) {
      next(err);
    }
  }

  public static async recalculateSignals(req: Request, res: Response, next: NextFunction) {
    try {
      const containerId = String(req.params.containerId);
      const user = req.user!;

      // Validate access first
      await ComplianceService.getSignals(user, containerId);
      await ComplianceService.recalculateAllDerivedSignals(containerId);
      const updatedSignals = await ComplianceService.getSignals(user, containerId);
      const updatedRisk = await RiskService.calculateContainerRisk(user, containerId);

      res.status(200).json({
        data: updatedSignals,
        riskAssessment: updatedRisk
      });
    } catch (err) {
      next(err);
    }
  }
}
