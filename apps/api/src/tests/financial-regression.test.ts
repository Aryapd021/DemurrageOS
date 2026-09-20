import { describe, it, expect } from 'vitest';
import { ChargeEngine } from '../modules/charges/charge.engine.js';
import { Container, Tariff, ChargeType, DeliveryMode, ContainerStatus } from '@prisma/client';

describe('Financial Safety & Two-Clock Demurrage Engine - Regression Tests', () => {
  const carrierTariffs: Tariff[] = [
    { id: 't-1', organizationId: 'org-1', carrier: 'MAERSK', cfsId: null, chargeType: ChargeType.DEMURRAGE, slabDaysStart: 1, slabDaysEnd: 3, ratePerDay20: 0, ratePerDay40: 0, currency: 'INR', effectiveFrom: new Date() },
    { id: 't-2', organizationId: 'org-1', carrier: 'MAERSK', cfsId: null, chargeType: ChargeType.DEMURRAGE, slabDaysStart: 4, slabDaysEnd: 7, ratePerDay20: 2500, ratePerDay40: 5000, currency: 'INR', effectiveFrom: new Date() },
    { id: 't-3', organizationId: 'org-1', carrier: 'MAERSK', cfsId: null, chargeType: ChargeType.DEMURRAGE, slabDaysStart: 8, slabDaysEnd: 999, ratePerDay20: 5000, ratePerDay40: 10000, currency: 'INR', effectiveFrom: new Date() },
  ];

  const cfsTariffs: Tariff[] = [
    { id: 't-4', organizationId: 'org-1', carrier: null, cfsId: 'cfs-1', chargeType: ChargeType.CFS_GROUND_RENT, slabDaysStart: 1, slabDaysEnd: 3, ratePerDay20: 0, ratePerDay40: 0, currency: 'INR', effectiveFrom: new Date() },
    { id: 't-5', organizationId: 'org-1', carrier: null, cfsId: 'cfs-1', chargeType: ChargeType.CFS_GROUND_RENT, slabDaysStart: 4, slabDaysEnd: 10, ratePerDay20: 1200, ratePerDay40: 2400, currency: 'INR', effectiveFrom: new Date() },
    { id: 't-6', organizationId: 'org-1', carrier: null, cfsId: 'cfs-1', chargeType: ChargeType.CFS_GROUND_RENT, slabDaysStart: 11, slabDaysEnd: 999, ratePerDay20: 2500, ratePerDay40: 5000, currency: 'INR', effectiveFrom: new Date() },
  ];

  it('DPD_DIRECT: applies ONLY carrier demurrage clock and zero CFS ground rent', () => {
    const dischargeDate = new Date();
    dischargeDate.setDate(dischargeDate.getDate() - 6); // 6 days elapsed

    const container: Container = {
      id: 'c-direct',
      organizationId: 'org-1',
      clientId: 'cl-1',
      containerNumber: 'MSCU1234567',
      containerType: 'DRY',
      size: 40,
      status: ContainerStatus.DISCHARGED,
      deliveryMode: DeliveryMode.DPD_DIRECT,
      cfsId: null,
      carrier: 'MAERSK',
      billOfLading: 'BL-1',
      bookingNumber: null,
      declaredValue: 1000000,
      currency: 'INR',
      hsCode: '8471.30',
      dischargeDate,
      freeTimeExpiresAt: null,
      gateInDate: null, // DPD Direct has no CFS gate in
      gateOutDate: null,
      deliveryOrderDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const charges = ChargeEngine.calculate(container, carrierTariffs, cfsTariffs);

    // Only DEMURRAGE charge should exist
    expect(charges).toHaveLength(1);
    expect(charges[0].chargeType).toBe(ChargeType.DEMURRAGE);
    
    // Day 1-3: 0
    // Day 4-6 (3 days): 3 * 5000 = 15,000
    expect(charges[0].amount).toBe(15000);
  });

  it('DPD_CFS with Fallback: independently computes both Carrier and CFS ground-rent clocks', () => {
    const dischargeDate = new Date();
    dischargeDate.setDate(dischargeDate.getDate() - 10); // 10 days elapsed since vessel discharge

    const cfsGateInDate = new Date();
    cfsGateInDate.setDate(cfsGateInDate.getDate() - 5); // 5 days elapsed since CFS gate-in

    const container: Container = {
      id: 'c-fallback',
      organizationId: 'org-1',
      clientId: 'cl-1',
      containerNumber: 'CSQU3054383',
      containerType: 'DRY',
      size: 40,
      status: ContainerStatus.DISCHARGED,
      deliveryMode: DeliveryMode.CFS, // Fallback mode
      cfsId: 'cfs-1',
      carrier: 'MAERSK',
      billOfLading: 'BL-2',
      bookingNumber: null,
      declaredValue: 2000000,
      currency: 'INR',
      hsCode: '8471.30',
      dischargeDate,
      freeTimeExpiresAt: null,
      gateInDate: cfsGateInDate,
      gateOutDate: null,
      deliveryOrderDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const charges = ChargeEngine.calculate(container, carrierTariffs, cfsTariffs);

    // Both clocks must be present
    expect(charges).toHaveLength(2);

    // Clock 1: Carrier Demurrage for 10 days on 40ft
    // Days 1-3: 0
    // Days 4-7 (4 days): 4 * 5000 = 20,000
    // Days 8-10 (3 days): 3 * 10000 = 30,000
    // Total Carrier = 50,000
    const carrierCharge = charges.find(c => c.chargeType === ChargeType.DEMURRAGE);
    expect(carrierCharge?.amount).toBe(50000);

    // Clock 2: CFS Ground Rent for 5 days on 40ft
    // Days 1-3: 0
    // Days 4-5 (2 days): 2 * 2400 = 4,800
    // Total CFS = 4,800
    const cfsCharge = charges.find(c => c.chargeType === ChargeType.CFS_GROUND_RENT);
    expect(cfsCharge?.amount).toBe(4800);
  });
});
