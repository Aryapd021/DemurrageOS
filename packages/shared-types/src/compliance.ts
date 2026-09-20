import { z } from 'zod';

export enum ComplianceSignalType {
  DOC_COMPLETENESS = 'DOC_COMPLETENESS',
  HS_CODE_NOVELTY = 'HS_CODE_NOVELTY',
  AEO_ACP_STATUS = 'AEO_ACP_STATUS',
  VALUATION_CONSISTENCY = 'VALUATION_CONSISTENCY'
}

export enum SignalSource {
  MANUAL = 'MANUAL',
  DERIVED = 'DERIVED'
}

export const ComplianceSignalTypeSchema = z.nativeEnum(ComplianceSignalType);
export const SignalSourceSchema = z.nativeEnum(SignalSource);

export const ComplianceSignalSchema = z.object({
  id: z.string().uuid(),
  containerId: z.string().uuid(),
  signalType: ComplianceSignalTypeSchema,
  score: z.number().int().min(0).max(100),
  source: SignalSourceSchema,
  metadata: z.record(z.any()).optional().nullable(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()).optional()
});

export type ComplianceSignalDto = z.infer<typeof ComplianceSignalSchema>;

export const CreateManualSignalSchema = z.object({
  signalType: ComplianceSignalTypeSchema,
  score: z.number().int().min(0).max(100),
  reason: z.string().min(3).max(500),
  metadata: z.record(z.any()).optional()
});

export type CreateManualSignalDto = z.infer<typeof CreateManualSignalSchema>;

export interface ComplianceScorecard {
  overallScore: number;
  signals: {
    signalType: ComplianceSignalType;
    score: number;
    source: SignalSource;
    description: string;
    lastUpdated: string;
    metadata?: Record<string, any> | null;
  }[];
}
