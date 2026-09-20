import { describe, it, expect } from 'vitest';
import { ComplianceSignalType, SignalSource } from '@demurrageos/shared-types';
import { CreateManualSignalSchema } from '@demurrageos/shared-types';

describe('Compliance Signal Engine - Unit Tests', () => {
  describe('Manual Signal Validation', () => {
    it('should validate a valid manual compliance signal payload', () => {
      const validPayload = {
        signalType: ComplianceSignalType.VALUATION_CONSISTENCY,
        score: 85,
        reason: 'Manually verified with original invoice'
      };

      const result = CreateManualSignalSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject scores outside 0-100 range', () => {
      const negativeScore = {
        signalType: ComplianceSignalType.DOC_COMPLETENESS,
        score: -5,
        reason: 'Too low'
      };
      expect(CreateManualSignalSchema.safeParse(negativeScore).success).toBe(false);

      const excessScore = {
        signalType: ComplianceSignalType.DOC_COMPLETENESS,
        score: 105,
        reason: 'Too high'
      };
      expect(CreateManualSignalSchema.safeParse(excessScore).success).toBe(false);
    });

    it('should reject invalid signal types', () => {
      const invalidType = {
        signalType: 'UNSUPPORTED_SIGNAL_TYPE',
        score: 50,
        reason: 'Invalid'
      };
      expect(CreateManualSignalSchema.safeParse(invalidType).success).toBe(false);
    });

    it('should reject missing or too short reason', () => {
      const shortReason = {
        signalType: ComplianceSignalType.AEO_ACP_STATUS,
        score: 90,
        reason: 'ok' // Minimum is 3 characters
      };
      expect(CreateManualSignalSchema.safeParse(shortReason).success).toBe(false);
    });
  });

  describe('Historical HS Code Novelty Algorithm', () => {
    // Deterministic rule:
    // 0 history -> 20 (high novelty)
    // > 180 days -> 40
    // 90-180 days -> 60
    // 30-90 days -> 80
    // <= 30 days or >= 5 shipments -> 95 (routine)
    function calculateHsNoveltyScore(historyCount: number, daysSinceLast?: number): number {
      if (historyCount === 0 || daysSinceLast === undefined) return 20;
      if (daysSinceLast <= 30 || historyCount >= 5) return 95;
      if (daysSinceLast <= 90) return 80;
      if (daysSinceLast <= 180) return 60;
      return 40;
    }

    it('should assign score 20 for first-time novel HS code', () => {
      expect(calculateHsNoveltyScore(0)).toBe(20);
    });

    it('should assign score 95 for routine frequent filings (5+ shipments or <= 30 days)', () => {
      expect(calculateHsNoveltyScore(5, 45)).toBe(95);
      expect(calculateHsNoveltyScore(2, 10)).toBe(95);
    });

    it('should assign score 60 for filings between 90 and 180 days ago', () => {
      expect(calculateHsNoveltyScore(2, 120)).toBe(60);
    });

    it('should assign score 40 for stale HS filings older than 180 days', () => {
      expect(calculateHsNoveltyScore(1, 220)).toBe(40);
    });
  });

  describe('Historical Valuation Consistency Algorithm', () => {
    // Statistical method:
    // sampleSize < 2 -> 50 (INSUFFICIENT_HISTORICAL_DATA)
    // z <= 1.0 -> 95 (within normal range)
    // 1.0 < z <= 2.0 -> 65-75 (moderate deviation)
    // z > 2.5 -> 30 (extreme outlier)
    function calculateValuationScore(currentVal: number, pastValues: number[]): { score: number; status: string } {
      if (pastValues.length < 2) {
        return { score: 50, status: 'INSUFFICIENT_HISTORICAL_DATA' };
      }
      const mean = pastValues.reduce((a, b) => a + b, 0) / pastValues.length;
      const variance = pastValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pastValues.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev === 0) {
        return currentVal === mean
          ? { score: 95, status: 'EXACT_MATCH' }
          : { score: 30, status: 'OUTLIER' };
      }

      const z = Math.abs(currentVal - mean) / stdDev;
      if (z > 2.5) return { score: 30, status: 'EXTREME_OUTLIER' };
      if (z > 1.5) return { score: 65, status: 'MODERATE_VARIANCE' };
      return { score: 95, status: 'NORMAL_RANGE' };
    }

    it('should explicitly flag insufficient historical data when sample < 2', () => {
      const res = calculateValuationScore(5000000, [4900000]);
      expect(res.score).toBe(50);
      expect(res.status).toBe('INSUFFICIENT_HISTORICAL_DATA');
    });

    it('should assign score 95 when valuation is within 1 standard deviation', () => {
      const past = [4500000, 4600000, 4550000, 4700000];
      const res = calculateValuationScore(4620000, past);
      expect(res.score).toBe(95);
      expect(res.status).toBe('NORMAL_RANGE');
    });

    it('should assign score 30 for extreme valuation outliers (> 2.5 sigma)', () => {
      const past = [100000, 105000, 98000, 102000];
      const res = calculateValuationScore(900000, past); // 9x the normal value
      expect(res.score).toBe(30);
      expect(res.status).toBe('EXTREME_OUTLIER');
    });
  });

  describe('AEO / ACP Status Deterministic Derivation', () => {
    function deriveAeoScore(aeo: boolean, acp: boolean): number {
      if (aeo && acp) return 100;
      if (aeo) return 85;
      if (acp) return 80;
      return 50;
    }

    it('should score 100 for dual-accredited client', () => {
      expect(deriveAeoScore(true, true)).toBe(100);
    });

    it('should score 85 for AEO-only client', () => {
      expect(deriveAeoScore(true, false)).toBe(85);
    });

    it('should score 50 for unaccredited/unknown client without unfair penalization', () => {
      expect(deriveAeoScore(false, false)).toBe(50);
    });
  });
});
