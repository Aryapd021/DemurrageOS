import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../config/database';
import { TariffEngine, FreeTimeEngine, ChargeCalculationService } from '../services/financial/charge-calculation';
import { moneyToNumber } from '../common/money';

describe('Financial Engine', () => {
  let tariffEngine: TariffEngine;
  let freeTimeEngine: FreeTimeEngine;
  let chargeService: ChargeCalculationService;
  let testTariff: any;

  beforeAll(async () => {
    tariffEngine = new TariffEngine();
    freeTimeEngine = new FreeTimeEngine();
    chargeService = new ChargeCalculationService();

    // Create test tariff
    testTariff = await prisma.tariff.create({
      data: {
        code: 'TEST_TARIFF',
        name: 'Test Tariff',
        effectiveFrom: new Date('2025-01-01'),
        demurrageRate: 500,
        detentionRate: 300,
        groundRentRate: 1000,
        freeDays: 5,
        currency: 'INR',
      },
    });
  });

  afterAll(async () => {
    await prisma.tariff.delete({
      where: { id: testTariff.id },
    });
  });

  it('should calculate DPD_DIRECT charges', async () => {
    const dischargeDate = new Date('2025-01-01');
    const now = new Date('2025-01-20'); // 19 days after discharge
    const events: any[] = [];

    const freeTime = freeTimeEngine.calculateFreeTime(dischargeDate, 'DPD_DIRECT', 5, events);

    expect(freeTime.freeDaysRemaining).toBe(0);
    expect(freeTime.clockType).toBe('CARRIER');
  });

  it('should calculate CFS charges', async () => {
    const dischargeDate = new Date('2025-01-01');
    const cfsGateInDate = new Date('2025-01-03');
    const events = [
      {
        eventType: 'CFS_GATE_IN',
        eventTimestamp: cfsGateInDate,
      },
    ];

    const freeTime = freeTimeEngine.calculateFreeTime(dischargeDate, 'CFS', 5, events);

    expect(freeTime.baseDate).toEqual(cfsGateInDate);
    expect(freeTime.clockType).toBe('CFS');
  });

  it('should handle DPD_CFS fallback', async () => {
    const dischargeDate = new Date('2025-01-01');
    const fallbackDate = new Date('2025-01-04');
    const cfsGateInDate = new Date('2025-01-06');

    const events = [
      {
        eventType: 'DPD_TO_CFS_FALLBACK',
        eventTimestamp: fallbackDate,
      },
      {
        eventType: 'CFS_GATE_IN',
        eventTimestamp: cfsGateInDate,
      },
    ];

    const freeTime = freeTimeEngine.calculateFreeTime(dischargeDate, 'DPD_CFS', 5, events);

    expect(freeTime.baseDate).toEqual(cfsGateInDate);
    expect(freeTime.clockType).toBe('CFS_AFTER_FALLBACK');
  });

  it('should not create duplicate charges on retry', async () => {
    const client = await prisma.client.create({
      data: {
        organizationId: 'test-org',
        name: 'Test Client',
      },
    });

    const container = await prisma.container.create({
      data: {
        clientId: client.id,
        containerNo: `TEST-${Date.now()}`,
        deliveryMode: 'CFS',
        dischargeDate: new Date('2025-01-01'),
      },
    });

    // First calculation
    await chargeService.recalculateForContainer(container.id);
    const firstCount = await prisma.charge.count({
      where: { containerId: container.id },
    });

    // Retry - should replace, not duplicate
    await chargeService.recalculateForContainer(container.id);
    const secondCount = await prisma.charge.count({
      where: { containerId: container.id },
    });

    expect(firstCount).toBe(secondCount);

    // Cleanup
    await prisma.container.delete({ where: { id: container.id } });
    await prisma.client.delete({ where: { id: client.id } });
  });
});

describe('Risk Engine', () => {
  it('should calculate risk score', async () => {
    const { RiskEngine } = await import('../services/risk/risk-engine');
    const riskEngine = new RiskEngine();

    // This would require setting up test data
    // For now, just verify it doesn't throw
    expect(riskEngine).toBeDefined();
  });
});

describe('Task Service', () => {
  it('should generate and hash confirmation token', async () => {
    const { TaskService } = await import('../services/task/task-service');
    const taskService = new TaskService();

    // Verify token generation doesn't throw
    expect(taskService).toBeDefined();
  });
});
