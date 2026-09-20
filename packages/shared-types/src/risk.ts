import { z } from 'zod';
import { ComplianceSignalType } from './compliance.js';

export enum RiskSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum RiskCategory {
  DEADLINE = 'DEADLINE',
  COMPLIANCE = 'COMPLIANCE',
  OPERATIONAL = 'OPERATIONAL',
  FINANCIAL = 'FINANCIAL'
}

export interface RiskReason {
  category: RiskCategory;
  signalType?: ComplianceSignalType;
  contribution: number; // contribution to risk score, e.g. 25
  explanation: string;
}

export interface PredictiveRiskAdvisory {
  status: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predictedFallback: boolean;
  fallbackProbability: number;
  preventableExposureInr?: number | null;
  explanation: string;
}

export interface StructuredRiskAssessment {
  containerId: string;
  riskScore: number; // 0 - 100 (Authoritative Deterministic Score)
  severity: RiskSeverity;
  reasons: RiskReason[];
  recommendedActions: string[];
  calculatedAt: string;
  advisory?: PredictiveRiskAdvisory;
}

export const PredictiveRiskAdvisorySchema = z.object({
  status: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  predictedFallback: z.boolean(),
  fallbackProbability: z.number().min(0).max(1),
  preventableExposureInr: z.number().nullable().optional(),
  explanation: z.string()
});

export const StructuredRiskAssessmentSchema = z.object({
  containerId: z.string().uuid(),
  riskScore: z.number().int().min(0).max(100),
  severity: z.nativeEnum(RiskSeverity),
  reasons: z.array(
    z.object({
      category: z.nativeEnum(RiskCategory),
      signalType: z.nativeEnum(ComplianceSignalType).optional(),
      contribution: z.number(),
      explanation: z.string()
    })
  ),
  recommendedActions: z.array(z.string()),
  calculatedAt: z.string(),
  advisory: PredictiveRiskAdvisorySchema.optional()
});
