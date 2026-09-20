import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ChargeCalculationService } from '../src/domain/financial/ChargeCalculationService.ts';
import type { ContainerDTO, ContainerEventDTO } from '../../../packages/shared-types/src/index.ts';

describe('ChargeCalculationService Financial Engine Tests', () => {
  const service = new ChargeCalculationService();
  const now = new Date();
  const DAY_MS = 24 * 60 * 60 * 1000;

  it('calculates DPD_DIRECT with 0 demurrage when within 5 free days', () => {
    const discharged2DaysAgo = new Date(now.getTime() - 2 * DAY_MS).toISOString();
    const container: ContainerDTO = {
      id: 'cnt-direct-1',
      organizationId: 'org-test',
      clientId: 'client-test',
      clientName: 'Tata Motors',
      containerNumber: 'TEST1234567',
      sizeType: '40HC',
      carrierName: 'MAERSK',
      portOfDischarge: 'INNSA',
      deliveryMode: 'DPD_DIRECT',
      status: 'DISCHARGED',
      dischargedAt: discharged2DaysAgo,
      freeDaysGrantedCarrier: 5,
      freeDaysGrantedCfs: 0,
      createdAt: discharged2DaysAgo,
      updatedAt: discharged2DaysAgo
    };

    const events: ContainerEventDTO[] = [{
      id: 'e1',
      containerId: container.id,
      eventType: 'DISCHARGE',
      eventTimestamp: discharged2DaysAgo,
      location: 'Port Terminal',
      source: 'PORT_SYSTEM',
      createdAt: discharged2DaysAgo
    }];

    const result = service.calculate({ container, events, asOfDate: now });
    assert.strictEqual(result.carrierDemurrage, 0);
    assert.strictEqual(result.freeDaysRemainingCarrier, 3);
    assert.strictEqual(result.carrierDaysOverdue, 0);
    assert.strictEqual(result.currentExposure, 0);
    assert.strictEqual(result.isTwoClockActive, false);
  });

  it('calculates DPD_DIRECT with tiered carrier demurrage when 3 days overdue (8 days since discharge)', () => {
    const discharged8DaysAgo = new Date(now.getTime() - 8 * DAY_MS).toISOString();
    const container: ContainerDTO = {
      id: 'cnt-direct-2',
      organizationId: 'org-test',
      clientId: 'client-test',
      clientName: 'Tata Motors',
      containerNumber: 'TEST7654321',
      sizeType: '40HC',
      carrierName: 'MAERSK',
      portOfDischarge: 'INNSA',
      deliveryMode: 'DPD_DIRECT',
      status: 'DISCHARGED',
      dischargedAt: discharged8DaysAgo,
      freeDaysGrantedCarrier: 5,
      freeDaysGrantedCfs: 0,
      createdAt: discharged8DaysAgo,
      updatedAt: discharged8DaysAgo
    };

    const events: ContainerEventDTO[] = [{
      id: 'e1',
      containerId: container.id,
      eventType: 'DISCHARGE',
      eventTimestamp: discharged8DaysAgo,
      location: 'Port Terminal',
      source: 'PORT_SYSTEM',
      createdAt: discharged8DaysAgo
    }];

    const result = service.calculate({ container, events, asOfDate: now });
    // 8 - 5 = 3 days overdue. 3 * 3500 = 10,500 INR
    assert.strictEqual(result.carrierDaysOverdue, 3);
    assert.strictEqual(result.carrierDemurrage, 10500);
    assert.strictEqual(result.cfsGroundRent, 0);
    assert.strictEqual(result.currentExposure, 10500);
    assert.strictEqual(result.isTwoClockActive, false);
  });

  it('calculates TWO-CLOCK MODEL for DPD_CFS fallback: carrier clock continues + CFS clock starts + shifting charge', () => {
    const discharged9DaysAgo = new Date(now.getTime() - 9 * DAY_MS).toISOString();
    const fallback5DaysAgo = new Date(now.getTime() - 5 * DAY_MS).toISOString();
    const cfsIn5DaysAgo = new Date(now.getTime() - 5 * DAY_MS).toISOString();

    const container: ContainerDTO = {
      id: 'cnt-fallback-1',
      organizationId: 'org-test',
      clientId: 'client-test',
      clientName: 'Tata Motors',
      containerNumber: 'MSKU7890123',
      sizeType: '40HC',
      carrierName: 'MAERSK',
      portOfDischarge: 'INNSA',
      cfsName: 'Gateway Distriparks CFS',
      deliveryMode: 'DPD_CFS',
      status: 'CFS_STORED',
      dischargedAt: discharged9DaysAgo,
      cfsGateInAt: cfsIn5DaysAgo,
      freeDaysGrantedCarrier: 5,
      freeDaysGrantedCfs: 3,
      createdAt: discharged9DaysAgo,
      updatedAt: discharged9DaysAgo
    };

    const events: ContainerEventDTO[] = [
      {
        id: 'e1',
        containerId: container.id,
        eventType: 'DISCHARGE',
        eventTimestamp: discharged9DaysAgo,
        location: 'Port Terminal',
        source: 'PORT_SYSTEM',
        createdAt: discharged9DaysAgo
      },
      {
        id: 'e2',
        containerId: container.id,
        eventType: 'DPD_TO_CFS_FALLBACK',
        eventTimestamp: fallback5DaysAgo,
        location: 'Port Gate',
        source: 'PORT_SYSTEM',
        createdAt: fallback5DaysAgo
      },
      {
        id: 'e3',
        containerId: container.id,
        eventType: 'CFS_GATE_IN',
        eventTimestamp: cfsIn5DaysAgo,
        location: 'Gateway Distriparks CFS',
        source: 'CFS_SYSTEM',
        createdAt: cfsIn5DaysAgo
      }
    ];

    const result = service.calculate({ container, events, asOfDate: now });
    
    // Clock 1 (Carrier): 9 days since discharge. 9 - 5 = 4 days overdue. 4 * 3500 = 14,000 INR
    assert.strictEqual(result.carrierDaysOverdue, 4);
    assert.strictEqual(result.carrierDemurrage, 14000);

    // Clock 2 (CFS Ground Rent): 5 days since CFS_GATE_IN. 5 - 3 = 2 days overdue. 2 * 2200 = 4,400 INR
    assert.strictEqual(result.cfsDaysOverdue, 2);
    assert.strictEqual(result.cfsGroundRent, 4400);

    // Shifting charge: 4,500 INR
    assert.strictEqual(result.shiftingCharges, 4500);

    // Total Exposure = 14,000 + 4,400 + 4,500 = 22,900 INR
    assert.strictEqual(result.currentExposure, 22900);
    assert.strictEqual(result.isTwoClockActive, true);
  });
});
