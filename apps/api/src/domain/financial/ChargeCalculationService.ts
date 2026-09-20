import type {
  ContainerDTO,
  ContainerEventDTO,
  ChargeBreakdownDTO,
  DeliveryMode
} from '../../../../packages/shared-types/src/index.ts';
import { dbStore, type DBTariff } from '../../db/store.ts';
import { logger } from '../../config/logger.ts';

export interface CalculationInput {
  container: ContainerDTO;
  events: ContainerEventDTO[];
  asOfDate?: Date;
}

export class ChargeCalculationService {
  public calculate(input: CalculationInput): ChargeBreakdownDTO {
    const { container, events } = input;
    const asOf = input.asOfDate || new Date();

    const notes: string[] = [];
    let carrierDemurrage = 0;
    let carrierDetention = 0;
    let portStorage = 0;
    let cfsGroundRent = 0;
    let shiftingCharges = 0;

    let freeDaysRemainingCarrier = container.freeDaysGrantedCarrier || 5;
    let freeDaysRemainingCfs = container.freeDaysGrantedCfs || 3;
    let carrierDaysOverdue = 0;
    let cfsDaysOverdue = 0;

    const fallbackEvent = events.find(e => e.eventType === 'DPD_TO_CFS_FALLBACK');
    const cfsGateInEvent = events.find(e => e.eventType === 'CFS_GATE_IN');
    const dischargeEvent = events.find(e => e.eventType === 'DISCHARGE');

    const effectiveMode: DeliveryMode = fallbackEvent ? 'DPD_CFS' : container.deliveryMode;
    const isTwoClockActive = effectiveMode === 'CFS' || (effectiveMode === 'DPD_CFS' && !!fallbackEvent);

    // 1. CARRIER DEMURRAGE CLOCK (Starts from Discharge)
    const dischargeTime = dischargeEvent 
      ? new Date(dischargeEvent.eventTimestamp).getTime() 
      : (container.dischargedAt ? new Date(container.dischargedAt).getTime() : asOf.getTime());

    const daysSinceDischarge = Math.max(0, Math.floor((asOf.getTime() - dischargeTime) / (1000 * 60 * 60 * 24)));
    
    if (daysSinceDischarge <= (container.freeDaysGrantedCarrier || 5)) {
      freeDaysRemainingCarrier = (container.freeDaysGrantedCarrier || 5) - daysSinceDischarge;
      carrierDaysOverdue = 0;
    } else {
      freeDaysRemainingCarrier = 0;
      carrierDaysOverdue = daysSinceDischarge - (container.freeDaysGrantedCarrier || 5);
      
      const tier1Days = Math.min(5, carrierDaysOverdue);
      const tier2Days = Math.max(0, carrierDaysOverdue - 5);
      carrierDemurrage = (tier1Days * 3500) + (tier2Days * 7000);
      notes.push(`Carrier demurrage accrued for ${carrierDaysOverdue} days overdue (${tier1Days} days @ ₹3,500, ${tier2Days} days @ ₹7,000).`);
    }

    // 2. CFS GROUND RENT CLOCK (Starts from CFS_GATE_IN)
    if (isTwoClockActive && (cfsGateInEvent || container.cfsGateInAt)) {
      const cfsInTime = cfsGateInEvent 
        ? new Date(cfsGateInEvent.eventTimestamp).getTime() 
        : (container.cfsGateInAt ? new Date(container.cfsGateInAt).getTime() : asOf.getTime());

      const daysSinceCfsIn = Math.max(0, Math.floor((asOf.getTime() - cfsInTime) / (1000 * 60 * 60 * 24)));
      
      if (daysSinceCfsIn <= (container.freeDaysGrantedCfs || 3)) {
        freeDaysRemainingCfs = (container.freeDaysGrantedCfs || 3) - daysSinceCfsIn;
        cfsDaysOverdue = 0;
      } else {
        freeDaysRemainingCfs = 0;
        cfsDaysOverdue = daysSinceCfsIn - (container.freeDaysGrantedCfs || 3);

        const cfsTier1 = Math.min(3, cfsDaysOverdue);
        const cfsTier2 = Math.max(0, cfsDaysOverdue - 3);
        cfsGroundRent = (cfsTier1 * 2200) + (cfsTier2 * 4800);
        notes.push(`CFS ground rent accrued for ${cfsDaysOverdue} days overdue at ${container.cfsName || 'CFS'} (${cfsTier1} days @ ₹2,200, ${cfsTier2} days @ ₹4,800).`);
      }
    }

    // 3. SHIFTING CHARGES (Audit target when DPD fallback occurred)
    if (fallbackEvent) {
      shiftingCharges = 4500;
      notes.push('Terminal shifting charge of ₹4,500 applied due to DPD_TO_CFS_FALLBACK (Audit Target).');
    }

    const currentExposure = carrierDemurrage + carrierDetention + portStorage + cfsGroundRent + shiftingCharges;
    
    // Projected exposure in 3 days
    const projectedCarrierDays = carrierDaysOverdue + (freeDaysRemainingCarrier > 0 ? Math.max(0, 3 - freeDaysRemainingCarrier) : 3);
    const projTier1 = Math.min(5, projectedCarrierDays);
    const projTier2 = Math.max(0, projectedCarrierDays - 5);
    const projCarrier = (projTier1 * 3500) + (projTier2 * 7000);

    let projCfs = cfsGroundRent;
    if (isTwoClockActive) {
      const projectedCfsDays = cfsDaysOverdue + (freeDaysRemainingCfs > 0 ? Math.max(0, 3 - freeDaysRemainingCfs) : 3);
      const projCfsT1 = Math.min(3, projectedCfsDays);
      const projCfsT2 = Math.max(0, projectedCfsDays - 3);
      projCfs = (projCfsT1 * 2200) + (projCfsT2 * 4800);
    }
    const projectedExposure = projCarrier + carrierDetention + portStorage + projCfs + shiftingCharges;

    const result: ChargeBreakdownDTO = {
      containerId: container.id,
      deliveryMode: effectiveMode,
      currency: 'INR',
      carrierDemurrage,
      carrierDetention,
      portStorage,
      cfsGroundRent,
      shiftingCharges,
      currentExposure,
      projectedExposure,
      freeDaysRemainingCarrier,
      freeDaysRemainingCfs,
      carrierDaysOverdue,
      cfsDaysOverdue,
      isTwoClockActive,
      notes
    };

    // Platform plan §6 requirement: Log full input and output at INFO level!
    logger.info({
      module: 'ChargeCalculationService',
      input: {
        containerId: container.id,
        containerNumber: container.containerNumber,
        deliveryMode: container.deliveryMode,
        effectiveMode,
        eventsCount: events.length,
        asOfDate: asOf.toISOString(),
        daysSinceDischarge,
        hasFallback: !!fallbackEvent
      },
      output: result
    }, `Financial calculation completed for container ${container.containerNumber}`);

    return result;
  }
}

export const chargeCalculationService = new ChargeCalculationService();
