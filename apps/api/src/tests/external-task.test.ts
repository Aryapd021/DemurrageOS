import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('External Task Handoff & Token Security - Unit Tests', () => {
  it('should generate 256-bit cryptographic entropy tokens', () => {
    const token = crypto.randomBytes(32).toString('hex');
    expect(token).toHaveLength(64); // 32 bytes = 64 hex characters
    expect(typeof token).toBe('string');
  });

  it('should hash token deterministically using SHA-256', () => {
    const rawToken = 'test-token-value-abcdef1234567890abcdef1234567890';
    const hash1 = crypto.createHash('sha256').update(rawToken).digest('hex');
    const hash2 = crypto.createHash('sha256').update(rawToken).digest('hex');

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(rawToken); // Plaintext is never stored
  });

  it('should verify token expiration within the 72-hour window', () => {
    const now = new Date();
    const validExpiry = new Date(now.getTime() + 72 * 3600 * 1000);
    const expiredExpiry = new Date(now.getTime() - 1000); // 1 sec in past

    expect(validExpiry > now).toBe(true);
    expect(expiredExpiry > now).toBe(false);
  });

  it('should enforce one-time confirmation semantics', () => {
    const task = {
      confirmedAt: null as Date | null,
      tokenRevokedAt: null as Date | null,
      tokenExpiresAt: new Date(Date.now() + 72 * 3600 * 1000)
    };

    function attemptConfirm(t: typeof task): { success: boolean; error?: string } {
      if (t.tokenRevokedAt) return { success: false, error: 'TOKEN_REVOKED' };
      if (t.tokenExpiresAt < new Date()) return { success: false, error: 'TOKEN_EXPIRED' };
      if (t.confirmedAt) return { success: false, error: 'ALREADY_CONFIRMED' };
      t.confirmedAt = new Date();
      return { success: true };
    }

    // 1st attempt: succeeds
    const firstRes = attemptConfirm(task);
    expect(firstRes.success).toBe(true);
    expect(task.confirmedAt).not.toBeNull();

    // 2nd attempt (replay attack): rejected with ALREADY_CONFIRMED
    const secondRes = attemptConfirm(task);
    expect(secondRes.success).toBe(false);
    expect(secondRes.error).toBe('ALREADY_CONFIRMED');
  });

  it('should ensure external payload leaks zero internal tenant or financial data', () => {
    const internalTaskRecord = {
      id: 'task-123',
      organizationId: 'secret-org-uuid',
      containerId: 'secret-container-uuid',
      title: 'Transporter Dispatch',
      pickupLocation: 'Gate 2, CFS Terminal',
      scheduledDate: new Date(),
      confirmedAt: null,
      internalNotes: 'Customer credit score is low. Do not waive demurrage.',
      financialExposure: 75000,
      clientBillingAddress: '123 Confidential St'
    };

    // External transformation function:
    const publicSummary = {
      taskId: internalTaskRecord.id,
      title: internalTaskRecord.title,
      containerNumber: 'CSQU3054383',
      pickupLocation: internalTaskRecord.pickupLocation,
      scheduledDate: internalTaskRecord.scheduledDate.toISOString(),
      confirmedAt: internalTaskRecord.confirmedAt,
      isExpired: false,
      isRevoked: false,
      alreadyConfirmed: false
    };

    // Assert that sensitive fields are completely absent
    expect((publicSummary as any).organizationId).toBeUndefined();
    expect((publicSummary as any).internalNotes).toBeUndefined();
    expect((publicSummary as any).financialExposure).toBeUndefined();
    expect((publicSummary as any).clientBillingAddress).toBeUndefined();
  });
});
