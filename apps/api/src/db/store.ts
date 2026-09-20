import type {
  OrganizationDTO,
  ClientDTO,
  ContainerDTO,
  ContainerEventDTO,
  ChargeBreakdownDTO,
  ComplianceSignalDTO,
  TaskDTO,
  DeliveryMode,
  ContainerStatus,
  EventType,
  ChargeType,
  RiskAssessmentDTO
} from '../../../../packages/shared-types/src/index.ts';

export interface DBTariff {
  id: string;
  carrierName?: string;
  cfsName?: string;
  chargeType: ChargeType;
  containerSize: string;
  dayFrom: number;
  dayTo: number | null;
  ratePerDay: number;
  currency: string;
}

export interface DBDocument {
  id: string;
  containerId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
  stagedExtraction?: {
    id: string;
    documentId: string;
    extractedFields: Record<string, any>;
    confidenceScore: number;
    humanConfirmed: boolean;
    createdAt: string;
  };
}

export interface DBAuditLog {
  id: string;
  organizationId: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  payload: any;
  timestamp: string;
}

class InMemoryDataStore {
  public organizations: Map<string, OrganizationDTO> = new Map();
  public clients: Map<string, ClientDTO> = new Map();
  public containers: Map<string, ContainerDTO> = new Map();
  public events: Map<string, ContainerEventDTO[]> = new Map(); // containerId -> events
  public tariffs: DBTariff[] = [];
  public tasks: Map<string, TaskDTO> = new Map();
  public documents: Map<string, DBDocument> = new Map();
  public auditLogs: DBAuditLog[] = [];

  constructor() {
    this.initDefaultTariffs();
  }

  private initDefaultTariffs() {
    // Carrier tariffs (demurrage after 5 free days)
    this.tariffs.push({
      id: 'tariff-carrier-demurrage-t1',
      carrierName: 'MAERSK',
      chargeType: 'DEMURRAGE',
      containerSize: '40',
      dayFrom: 1, // days 1 to 5 overdue
      dayTo: 5,
      ratePerDay: 3500,
      currency: 'INR'
    });
    this.tariffs.push({
      id: 'tariff-carrier-demurrage-t2',
      carrierName: 'MAERSK',
      chargeType: 'DEMURRAGE',
      containerSize: '40',
      dayFrom: 6,
      dayTo: null,
      ratePerDay: 7000,
      currency: 'INR'
    });

    // CFS ground rent tariffs (after 3 free days)
    this.tariffs.push({
      id: 'tariff-cfs-groundrent-t1',
      cfsName: 'GATEWAY_DISTRIPARKS',
      chargeType: 'GROUND_RENT',
      containerSize: '40',
      dayFrom: 1, // days 1 to 3 overdue
      dayTo: 3,
      ratePerDay: 2200,
      currency: 'INR'
    });
    this.tariffs.push({
      id: 'tariff-cfs-groundrent-t2',
      cfsName: 'GATEWAY_DISTRIPARKS',
      chargeType: 'GROUND_RENT',
      containerSize: '40',
      dayFrom: 4,
      dayTo: null,
      ratePerDay: 4800,
      currency: 'INR'
    });

    // Shifting charge audit target
    this.tariffs.push({
      id: 'tariff-shifting-charge',
      chargeType: 'SHIFTING_CHARGE',
      containerSize: '40',
      dayFrom: 1,
      dayTo: 1,
      ratePerDay: 4500,
      currency: 'INR'
    });
  }

  public getContainersByScope(orgId: string, clientIds?: string[]): ContainerDTO[] {
    const list: ContainerDTO[] = [];
    for (const container of this.containers.values()) {
      if (container.organizationId !== orgId) continue;
      if (clientIds && clientIds.length > 0 && !clientIds.includes(container.clientId)) continue;
      
      // enrich with latest events and tasks
      const c = { ...container };
      c.events = this.events.get(container.id) || [];
      c.tasks = Array.from(this.tasks.values()).filter(t => t.containerId === container.id);
      list.push(c);
    }
    return list;
  }

  public getContainerById(id: string): ContainerDTO | undefined {
    const container = this.containers.get(id);
    if (!container) return undefined;
    const c = { ...container };
    c.events = this.events.get(container.id) || [];
    c.tasks = Array.from(this.tasks.values()).filter(t => t.containerId === container.id);
    return c;
  }

  public addEvent(event: ContainerEventDTO): void {
    const list = this.events.get(event.containerId) || [];
    list.push(event);
    // Sort by timestamp
    list.sort((a, b) => new Date(a.eventTimestamp).getTime() - new Date(b.eventTimestamp).getTime());
    this.events.set(event.containerId, list);
  }

  public getEvents(containerId: string): ContainerEventDTO[] {
    return this.events.get(containerId) || [];
  }

  public recordAudit(log: Omit<DBAuditLog, 'id' | 'timestamp'>): void {
    this.auditLogs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...log
    });
  }

  public reset(): void {
    this.organizations.clear();
    this.clients.clear();
    this.containers.clear();
    this.events.clear();
    this.tasks.clear();
    this.documents.clear();
    this.auditLogs = [];
    this.initDefaultTariffs();
  }
}

export const dbStore = new InMemoryDataStore();
