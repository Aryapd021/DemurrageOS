import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { Decimal } from '@prisma/client/runtime/library';
import { createMoney, multiplyMoney, roundMoney, moneyToNumber } from '../../common/money';

export interface ChargeCalculationInput {
  containerId: string;
  dischargeDate: Date;
  deliveryMode: string;
  tariff: any;
  events: any[];
}

export interface ChargeCalculationResult {
  chargeType: string;
  amount: number;
  currency: string;
  freeDaysRemaining: number;
  daysOverdue: number;
  currentExposure: number;
  projectedExposure: number;
  calculationVersion: string;
  calculationInputs: any;
  tariffVersion: number;
}

export class TariffEngine {
  async getTariffForDate(date: Date) {
    return prisma.tariff.findFirst({
      where: {
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async getTariffById(id: string) {
    return prisma.tariff.findUnique({
      where: { id },
    });
  }
}

export class FreeTimeEngine {
  /**
   * Calculate free time based on delivery mode
   * DPD_DIRECT: free days from discharge
   * DPD_CFS: free days from discharge (carrier clock)
   * CFS: free days from CFS gate-in
   * DPD_CFS with fallback: combines both clocks
   */
  calculateFreeTime(
    dischargeDate: Date,
    deliveryMode: string,
    freeDays: number,
    events: any[]
  ): { freeDaysRemaining: number; baseDate: Date; clockType: string } {
    const now = new Date();

    if (deliveryMode === 'DPD_DIRECT') {
      const freeTimeEnd = new Date(dischargeDate);
      freeTimeEnd.setDate(freeTimeEnd.getDate() + freeDays);

      const daysElapsed = Math.floor((now.getTime() - dischargeDate.getTime()) / (24 * 60 * 60 * 1000));
      const freeDaysRemaining = Math.max(0, freeDays - daysElapsed);

      return {
        freeDaysRemaining,
        baseDate: dischargeDate,
        clockType: 'CARRIER',
      };
    }

    if (deliveryMode === 'CFS') {
      const cfsGateInEvent = events.find((e) => e.eventType === 'CFS_GATE_IN');
      const baseDate = cfsGateInEvent ? new Date(cfsGateInEvent.eventTimestamp) : dischargeDate;

      const freeTimeEnd = new Date(baseDate);
      freeTimeEnd.setDate(freeTimeEnd.getDate() + freeDays);

      const daysElapsed = Math.floor((now.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
      const freeDaysRemaining = Math.max(0, freeDays - daysElapsed);

      return {
        freeDaysRemaining,
        baseDate,
        clockType: 'CFS',
      };
    }

    if (deliveryMode === 'DPD_CFS') {
      const fallbackEvent = events.find((e) => e.eventType === 'DPD_TO_CFS_FALLBACK');

      if (!fallbackEvent) {
        // No fallback yet, use DPD logic
        const daysElapsed = Math.floor((now.getTime() - dischargeDate.getTime()) / (24 * 60 * 60 * 1000));
        const freeDaysRemaining = Math.max(0, freeDays - daysElapsed);

        return {
          freeDaysRemaining,
          baseDate: dischargeDate,
          clockType: 'CARRIER',
        };
      }

      // Fallback occurred, use CFS gate-in date
      const cfsGateInEvent = events.find((e) => e.eventType === 'CFS_GATE_IN');
      const cfsDate = cfsGateInEvent ? new Date(cfsGateInEvent.eventTimestamp) : new Date(fallbackEvent.eventTimestamp);

      const daysElapsed = Math.floor((now.getTime() - cfsDate.getTime()) / (24 * 60 * 60 * 1000));
      const freeDaysRemaining = Math.max(0, freeDays - daysElapsed);

      return {
        freeDaysRemaining,
        baseDate: cfsDate,
        clockType: 'CFS_AFTER_FALLBACK',
      };
    }

    throw new Error(`Unknown delivery mode: ${deliveryMode}`);
  }
}

export class ChargeCalculationService {
  private tariffEngine = new TariffEngine();
  private freeTimeEngine = new FreeTimeEngine();

  async calculateCharges(
    container: any,
    tariff: any,
    events: any[]
  ): Promise<ChargeCalculationResult[]> {
    const now = new Date();

    // Calculate free time
    const freeTime = this.freeTimeEngine.calculateFreeTime(
      new Date(container.dischargeDate),
      container.deliveryMode,
      tariff.freeDays,
      events
    );

    // Calculate days overdue
    const baseDate = freeTime.baseDate;
    const freeTimeEnd = new Date(baseDate);
    freeTimeEnd.setDate(freeTimeEnd.getDate() + tariff.freeDays);

    const daysOverdue = Math.max(0, Math.floor((now.getTime() - freeTimeEnd.getTime()) / (24 * 60 * 60 * 1000)));

    const results: ChargeCalculationResult[] = [];

    // Demurrage charge
    if (daysOverdue > 0) {
      const demurrageAmount = moneyToNumber(
        roundMoney(
          multiplyMoney(createMoney(tariff.demurrageRate.toNumber(), container.currency), daysOverdue),
          'HALF_UP'
        )
      );

      results.push({
        chargeType: 'DEMURRAGE',
        amount: demurrageAmount,
        currency: container.currency || 'INR',
        freeDaysRemaining: freeTime.freeDaysRemaining,
        daysOverdue,
        currentExposure: demurrageAmount,
        projectedExposure: demurrageAmount,
        calculationVersion: '1.0.0',
        calculationInputs: {
          deliveryMode: container.deliveryMode,
          baseDate,
          freeTimeEnd,
          daysOverdue,
          tariffVersion: tariff.version,
        },
        tariffVersion: tariff.version,
      });
    }

    // CFS Ground rent charge (if CFS)
    if ((container.deliveryMode === 'CFS' || container.deliveryMode === 'DPD_CFS') && container.cfsId) {
      const cfsGateInEvent = events.find((e) => e.eventType === 'CFS_GATE_IN');
      if (cfsGateInEvent) {
        const cfsDate = new Date(cfsGateInEvent.eventTimestamp);
        const cfsGateOutEvent = events.find((e) => e.eventType === 'CFS_GATE_OUT');

        if (!cfsGateOutEvent) {
          // Container still in CFS, calculate ground rent
          const dayInCfs = Math.floor((now.getTime() - cfsDate.getTime()) / (24 * 60 * 60 * 1000));
          const groundRentAmount = moneyToNumber(
            roundMoney(
              multiplyMoney(
                createMoney(tariff.groundRentRate?.toNumber() || 0, container.currency),
                Math.max(1, dayInCfs)
              ),
              'HALF_UP'
            )
          );

          results.push({
            chargeType: 'GROUND_RENT',
            amount: groundRentAmount,
            currency: container.currency || 'INR',
            freeDaysRemaining: freeTime.freeDaysRemaining,
            daysOverdue: 0,
            currentExposure: groundRentAmount,
            projectedExposure: groundRentAmount,
            calculationVersion: '1.0.0',
            calculationInputs: {
              cfsBaseDate: cfsDate,
              daysInCfs: dayInCfs,
              tariffVersion: tariff.version,
            },
            tariffVersion: tariff.version,
          });
        }
      }
    }

    logger.info(
      {
        containerId: container.id,
        deliveryMode: container.deliveryMode,
        charges: results.length,
        freeDaysRemaining: freeTime.freeDaysRemaining,
        daysOverdue,
      },
      'Charges calculated'
    );

    return results;
  }

  async recalculateForContainer(containerId: string) {
    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: {
        events: { orderBy: { eventTimestamp: 'asc' } },
      },
    });

    if (!container) {
      throw new Error('Container not found');
    }

    const tariff = await this.tariffEngine.getTariffForDate(new Date(container.dischargeDate));
    if (!tariff) {
      throw new Error('No applicable tariff found');
    }

    const charges = await this.calculateCharges(container, tariff, container.events);

    // Delete old charges and create new ones
    await prisma.charge.deleteMany({
      where: { containerId },
    });

    for (const charge of charges) {
      await prisma.charge.create({
        data: {
          containerId,
          tariffId: tariff.id,
          ...charge,
        },
      });
    }

    return charges;
  }
}

export class ExposureService {
  async calculateExposureForContainer(containerId: string) {
    const charges = await prisma.charge.findMany({
      where: { containerId },
    });

    const currentExposure = charges.reduce((sum: number, c: any) => sum + moneyToNumber(c.amount), 0);

    // Projected exposure is current + potential future charges
    // For now, simplified to current exposure
    const projectedExposure = currentExposure;

    return {
      currentExposure,
      projectedExposure,
      chargeCount: charges.length,
    };
  }

  async calculateExposureForClient(clientId: string) {
    const containers = await prisma.container.findMany({
      where: { clientId },
    });

    let totalExposure = 0;
    let atRiskContainers = 0;

    for (const container of containers) {
      const exposure = await this.calculateExposureForContainer(container.id);
      totalExposure += exposure.currentExposure;

      if (exposure.currentExposure > 0) {
        atRiskContainers++;
      }
    }

    return {
      totalExposure,
      atRiskContainers,
      containerCount: containers.length,
    };
  }
}
