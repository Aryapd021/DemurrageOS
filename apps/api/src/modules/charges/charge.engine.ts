import { Container, Tariff, ChargeType, DeliveryMode } from '@prisma/client';

export interface CalculatedCharge {
  chargeType: ChargeType;
  amount: number;
  currency: string;
  daysCalculated: number;
  breakdown: Array<{
    slabStart: number;
    slabEnd: number;
    daysInSlab: number;
    ratePerDay: number;
    subtotal: number;
  }>;
}

export class ChargeEngine {
  /**
   * Deterministic Two-Clock Demurrage & Ground Rent Calculation
   * Clock 1: Carrier Demurrage (from dischargeDate until gateOutDate or today)
   * Clock 2: CFS Ground Rent (from gateInDate at CFS until gateOutDate or today)
   */
  public static calculate(
    container: Container,
    carrierTariffs: Tariff[],
    cfsTariffs: Tariff[],
    asOfDate: Date = new Date()
  ): CalculatedCharge[] {
    const results: CalculatedCharge[] = [];

    // 1. CARRIER DEMURRAGE CLOCK
    if (container.dischargeDate && carrierTariffs.length > 0) {
      const start = new Date(container.dischargeDate).getTime();
      const end = container.gateOutDate ? new Date(container.gateOutDate).getTime() : asOfDate.getTime();
      const totalElapsedDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));

      const charge = this.calculateSlabs(
        totalElapsedDays,
        container.size,
        carrierTariffs.filter(t => t.chargeType === ChargeType.DEMURRAGE)
      );
      if (charge) {
        results.push(charge);
      }
    }

    // 2. CFS GROUND RENT CLOCK (Only for CFS or DPD_CFS modes with gateInDate)
    if (container.deliveryMode !== DeliveryMode.DPD_DIRECT && container.gateInDate && cfsTariffs.length > 0) {
      const start = new Date(container.gateInDate).getTime();
      const end = container.gateOutDate ? new Date(container.gateOutDate).getTime() : asOfDate.getTime();
      const totalCfsDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));

      const charge = this.calculateSlabs(
        totalCfsDays,
        container.size,
        cfsTariffs.filter(t => t.chargeType === ChargeType.CFS_GROUND_RENT)
      );
      if (charge) {
        results.push(charge);
      }
    }

    return results;
  }

  private static calculateSlabs(
    totalDays: number,
    containerSize: number,
    tariffs: Tariff[]
  ): CalculatedCharge | null {
    if (tariffs.length === 0) return null;

    const sorted = [...tariffs].sort((a, b) => a.slabDaysStart - b.slabDaysStart);
    const chargeType = sorted[0].chargeType;
    const currency = sorted[0].currency;

    let totalAmount = 0;
    const breakdown = [];

    for (const tariff of sorted) {
      if (totalDays < tariff.slabDaysStart) {
        continue;
      }

      const slabMax = tariff.slabDaysEnd;
      const daysApplicable = Math.min(totalDays, slabMax) - tariff.slabDaysStart + 1;
      const daysInSlab = Math.max(0, daysApplicable);

      if (daysInSlab > 0) {
        const rate = containerSize === 40 ? tariff.ratePerDay40 : tariff.ratePerDay20;
        const subtotal = daysInSlab * rate;
        totalAmount += subtotal;

        breakdown.push({
          slabStart: tariff.slabDaysStart,
          slabEnd: tariff.slabDaysEnd,
          daysInSlab,
          ratePerDay: rate,
          subtotal
        });
      }
    }

    return {
      chargeType,
      amount: totalAmount,
      currency,
      daysCalculated: totalDays,
      breakdown
    };
  }
}
