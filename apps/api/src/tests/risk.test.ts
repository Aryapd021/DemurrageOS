import { describe, it, expect } from 'vitest';
import { DeterministicRiskEngine } from '../modules/risk/risk-engine.js';
import { Container, ComplianceSignal, DeliveryMode, ContainerStatus, ComplianceSignalType, SignalSource } from '@prisma/client';
import { RiskCategory, RiskSeverity } from '@demurrageos/shared-types';

describe('Deterministic Risk Engine - Unit Tests', () => {
  const dummyContainer: Container = {
    id: 'cntr-test-1',
    organizationId: 'org-1',
    clientId: 'client-1',
    containerNumber: 'CSQU3054383',
    containerType: 'DRY',
    size: 40,
    status: ContainerStatus.DISCHARGED,
    deliveryMode: DeliveryMode.DPD_CFS,
    cfsId: 'cfs-1',
    carrier: 'MAERSK',
    billOfLading: 'MEDU192837465',
    bookingNumber: 'BK-123',
    declaredValue: 4500000,
    currency: 'INR',
    hsCode: '8471.30',
    dischargeDate: new Date(),
    freeTimeExpiresAt: new Date(Date.now() + 14 * 3600 * 1000), // 14 hours remaining
    gateInDate: null,
    gateOutDate: null,
    deliveryOrderDate: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('should increase risk when free time expires in under 24 hours', () => {
    const signals: ComplianceSignal[] = [];
    const assessment = DeterministicRiskEngine.evaluate(dummyContainer, signals);

    // Free time in 14 hours adds 35 pts + 15 base + 10 DPD_CFS = 60
    expect(assessment.riskScore).toBeGreaterThanOrEqual(50);
    expect(assessment.severity).toBe(RiskSeverity.HIGH);

    const deadlineReason = assessment.reasons.find(r => r.category === RiskCategory.DEADLINE);
    expect(deadlineReason).toBeDefined();
    expect(deadlineReason?.contribution).toBe(35);
    expect(deadlineReason?.explanation).toContain('14 hours');
  });

  it('should incorporate compliance penalties when signal score is under 50', () => {
    const signals: ComplianceSignal[] = [
      {
        id: 'sig-1',
        containerId: dummyContainer.id,
        signalType: ComplianceSignalType.DOC_COMPLETENESS,
        score: 30, // Low compliance: penalty of (50-30)*0.4 = 8 pts
        source: SignalSource.DERIVED,
        reason: 'Missing Delivery Order and Bill of Entry',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const assessment = DeterministicRiskEngine.evaluate(dummyContainer, signals);
    const complianceReason = assessment.reasons.find(r => r.category === RiskCategory.COMPLIANCE && r.signalType === ComplianceSignalType.DOC_COMPLETENESS);
    
    expect(complianceReason).toBeDefined();
    expect(complianceReason?.contribution).toBe(8);
    expect(complianceReason?.explanation).toContain('Missing Delivery Order');
  });

  it('should generate structured operational recommendations based on active risk reasons', () => {
    const signals: ComplianceSignal[] = [
      {
        id: 'sig-1',
        containerId: dummyContainer.id,
        signalType: ComplianceSignalType.DOC_COMPLETENESS,
        score: 20,
        source: SignalSource.DERIVED,
        reason: 'Missing critical documents',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const assessment = DeterministicRiskEngine.evaluate(dummyContainer, signals);
    expect(assessment.recommendedActions.length).toBeGreaterThan(0);
    expect(assessment.recommendedActions).toContain('Dispatch trucker immediately before the 24-hour free-time deadline.');
    expect(assessment.recommendedActions).toContain('Upload and review missing customs/shipping documents.');
  });

  it('should guarantee final risk score is clamped between 0 and 100', () => {
    // Overdue by 10 days, customs hold, and all signals 0
    const severeContainer: Container = {
      ...dummyContainer,
      freeTimeExpiresAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      status: ContainerStatus.CUSTOMS_HOLD
    };

    const zeroSignals: ComplianceSignal[] = [
      {
        id: 'sig-1',
        containerId: dummyContainer.id,
        signalType: ComplianceSignalType.DOC_COMPLETENESS,
        score: 0,
        source: SignalSource.DERIVED,
        reason: 'No docs',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const assessment = DeterministicRiskEngine.evaluate(severeContainer, zeroSignals);
    expect(assessment.riskScore).toBeLessThanOrEqual(100);
    expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
    expect(assessment.severity).toBe(RiskSeverity.CRITICAL);
  });
});
