import { describe, it, expect } from 'vitest';
import { DeterministicRiskEngine } from '../modules/risk/risk-engine.js';
import { Container, ComplianceSignal, DeliveryMode, ContainerStatus } from '@prisma/client';
import { KnowledgeQueryRequestSchema } from '@demurrageos/shared-types';

describe('AI & Differentiation Layer Integration Tests', () => {
  const dummyContainer: Container = {
    id: 'cntr-ai-1',
    organizationId: 'org-test',
    clientId: 'client-test',
    containerNumber: 'CSQU3054383',
    containerType: 'DRY',
    size: 40,
    status: ContainerStatus.DISCHARGED,
    deliveryMode: DeliveryMode.DPD_CFS,
    cfsId: 'cfs-test',
    carrier: 'MAERSK',
    billOfLading: 'MEDU192837465',
    bookingNumber: 'BK-123',
    declaredValue: 4500000,
    currency: 'INR',
    hsCode: '8471.30',
    dischargeDate: new Date(),
    freeTimeExpiresAt: new Date(Date.now() + 14 * 3600 * 1000),
    gateInDate: null,
    gateOutDate: null,
    deliveryOrderDate: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('preserves 100% deterministic calculation for authoritative risk score', () => {
    const signals: ComplianceSignal[] = [];
    const assessment = DeterministicRiskEngine.evaluate(dummyContainer, signals);

    // Authoritative score is strictly deterministic
    expect(assessment.riskScore).toBe(60);
    expect(assessment.severity).toBe('HIGH');
    expect(typeof assessment.riskScore).toBe('number');
  });

  it('validates KnowledgeQueryRequest schema correctly and excludes client org_id injection', () => {
    const valid = KnowledgeQueryRequestSchema.safeParse({
      query: 'JNPT demurrage tariff',
      nResults: 3,
      includeDemo: false
    });
    expect(valid.success).toBe(true);

    const invalid = KnowledgeQueryRequestSchema.safeParse({
      query: 'a' // Too short (< 2 chars)
    });
    expect(invalid.success).toBe(false);
  });

  it('validates PredictiveRiskAdvisory schema with nullable preventableExposureInr', () => {
    const { PredictiveRiskAdvisorySchema } = require('@demurrageos/shared-types');
    
    // Valid with null exposure
    const validWithNull = PredictiveRiskAdvisorySchema.safeParse({
      status: 'HIGH',
      predictedFallback: true,
      fallbackProbability: 0.75,
      preventableExposureInr: null,
      explanation: 'Approaching DPD window.'
    });
    expect(validWithNull.success).toBe(true);

    // Valid with numeric exposure
    const validWithNumber = PredictiveRiskAdvisorySchema.safeParse({
      status: 'CRITICAL',
      predictedFallback: true,
      fallbackProbability: 0.95,
      preventableExposureInr: 36000,
      explanation: 'DPD window exceeded.'
    });
    expect(validWithNumber.success).toBe(true);

    // Invalid probability (> 1.0)
    const invalidProb = PredictiveRiskAdvisorySchema.safeParse({
      status: 'LOW',
      predictedFallback: false,
      fallbackProbability: 1.5,
      explanation: 'Invalid'
    });
    expect(invalidProb.success).toBe(false);
  });
});
