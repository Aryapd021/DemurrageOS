import type { ContainerEventDTO, EventType } from '../../../../packages/shared-types/src/index.ts';

export interface RawCarrierEvent {
  trackingNumber: string;
  code: string;
  time: string;
  port: string;
  carrier: string;
  notes?: string;
}

export interface RawPortEDIEvent {
  containerId: string;
  terminalCode: string;
  movementCode: 'DISCH' | 'GATEOUT' | 'GATEIN';
  timestamp: string;
}

export interface IntegrationAdapter<T> {
  normalize(raw: T, containerId: string): ContainerEventDTO;
}

export class CarrierIntegrationAdapter implements IntegrationAdapter<RawCarrierEvent> {
  normalize(raw: RawCarrierEvent, containerId: string): ContainerEventDTO {
    let eventType: EventType = 'DISCHARGE';
    const code = raw.code.toUpperCase();

    if (code.includes('DISCH') || code.includes('UNLOAD')) {
      eventType = 'DISCHARGE';
    } else if (code.includes('GATE') && code.includes('OUT')) {
      eventType = 'GATE_OUT_PORT';
    } else if (code.includes('RETURN') || code.includes('EMPTY')) {
      eventType = 'CONTAINER_RETURNED';
    } else if (code.includes('ARRIV')) {
      eventType = 'VESSEL_ARRIVED';
    }

    return {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      containerId,
      eventType,
      eventTimestamp: raw.time,
      location: raw.port,
      source: 'CARRIER_EDI',
      metadata: { rawCarrier: raw.carrier, rawCode: raw.code, notes: raw.notes },
      createdAt: new Date().toISOString()
    };
  }
}

export class PortEDIAdapter implements IntegrationAdapter<RawPortEDIEvent> {
  normalize(raw: RawPortEDIEvent, containerId: string): ContainerEventDTO {
    let eventType: EventType = 'DISCHARGE';
    if (raw.movementCode === 'GATEOUT') eventType = 'GATE_OUT_PORT';
    if (raw.movementCode === 'GATEIN') eventType = 'CFS_GATE_IN';

    return {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      containerId,
      eventType,
      eventTimestamp: raw.timestamp,
      location: raw.terminalCode,
      source: 'PORT_SYSTEM',
      metadata: { terminal: raw.terminalCode },
      createdAt: new Date().toISOString()
    };
  }
}

export const carrierAdapter = new CarrierIntegrationAdapter();
export const portEdiAdapter = new PortEDIAdapter();
