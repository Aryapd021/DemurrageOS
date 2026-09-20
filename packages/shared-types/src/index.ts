export type DeliveryMode = 'DPD_DIRECT' | 'DPD_CFS' | 'CFS';

export type ContainerStatus =
  | 'IN_TRANSIT'
  | 'DISCHARGED'
  | 'CUSTOMS_CLEARED'
  | 'CFS_STORED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EMPTY_RETURNED';

export type EventType =
  | 'VESSEL_ARRIVED'
  | 'DISCHARGE'
  | 'CUSTOMS_OUT_OF_CHARGE'
  | 'DELIVERY_ORDER_ISSUED'
  | 'GATE_OUT_PORT'
  | 'CFS_GATE_IN'
  | 'CFS_GATE_OUT'
  | 'DPD_TO_CFS_FALLBACK'
  | 'DELIVERY_ORDER_REISSUED'
  | 'CONTAINER_RETURNED';

export type ChargeType =
  | 'DEMURRAGE'
  | 'DETENTION'
  | 'STORAGE'
  | 'GROUND_RENT'
  | 'SHIFTING_CHARGE';

export type ComplianceSignalType =
  | 'DOC_COMPLETENESS'
  | 'HS_CODE_NOVELTY'
  | 'AEO_ACP_STATUS'
  | 'VALUATION_CONSISTENCY';

export type RiskUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

export type TaskType =
  | 'CUSTOMS_FILING'
  | 'DUTY_PAYMENT'
  | 'DELIVERY_ORDER_COLLECTION'
  | 'TRUCKER_PICKUP'
  | 'CFS_GATE_PASS'
  | 'EMPTY_RETURN';

export interface ClientScope {
  organizationId: string;
  clientId?: string;
  visibleClientIds?: string[];
}

export interface OrganizationDTO {
  id: string;
  name: string;
  chaLicenseNumber: string;
  createdAt: string;
}

export interface ClientDTO {
  id: string;
  organizationId: string;
  name: string;
  iecCode: string;
  isAeoAcp: boolean;
  defaultDeliveryMode: DeliveryMode;
  createdAt: string;
}

export interface ContainerEventDTO {
  id: string;
  containerId: string;
  eventType: EventType;
  eventTimestamp: string;
  location: string;
  source: 'CARRIER_EDI' | 'PORT_SYSTEM' | 'CFS_SYSTEM' | 'CSV_IMPORT' | 'MANUAL';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ChargeBreakdownDTO {
  containerId: string;
  deliveryMode: DeliveryMode;
  currency: string;
  carrierDemurrage: number;
  carrierDetention: number;
  portStorage: number;
  cfsGroundRent: number;
  shiftingCharges: number;
  currentExposure: number;
  projectedExposure: number;
  freeDaysRemainingCarrier: number;
  freeDaysRemainingCfs: number;
  carrierDaysOverdue: number;
  cfsDaysOverdue: number;
  isTwoClockActive: boolean;
  notes: string[];
}

export interface RiskFactorDTO {
  factor: string;
  impact: number;
  explanation: string;
}

export interface RiskAssessmentDTO {
  score: number; // 0 to 100
  urgency: RiskUrgency;
  reasons: string[];
  factors: RiskFactorDTO[];
  calculatedAt: string;
}

export interface ComplianceSignalDTO {
  id: string;
  containerId: string;
  signalType: ComplianceSignalType;
  status: 'PASS' | 'WARNING' | 'FAIL';
  scoreImpact: number;
  details: string;
  evaluatedAt: string;
}

export interface TaskDTO {
  id: string;
  containerId: string;
  containerNumber: string;
  clientName: string;
  taskType: TaskType;
  title: string;
  status: TaskStatus;
  assigneeType: 'INTERNAL' | 'EXTERNAL_TRUCKER' | 'EXTERNAL_CUSTOMS_BROKER';
  assigneeName: string;
  assigneeContact?: string;
  confirmationToken?: string;
  tokenExpiresAt?: string;
  confirmedAt?: string;
  createdAt: string;
}

export interface ContainerDTO {
  id: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  containerNumber: string;
  sizeType: '20GP' | '40GP' | '40HC' | '45HC';
  carrierName: string;
  portOfDischarge: string;
  cfsName?: string;
  deliveryMode: DeliveryMode;
  status: ContainerStatus;
  dischargedAt?: string;
  cfsGateInAt?: string;
  freeDaysGrantedCarrier: number;
  freeDaysGrantedCfs: number;
  chargeBreakdown?: ChargeBreakdownDTO;
  riskAssessment?: RiskAssessmentDTO;
  events?: ContainerEventDTO[];
  tasks?: TaskDTO[];
  complianceSignals?: ComplianceSignalDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface IngestionPreviewRow {
  rowNumber: number;
  containerNumber: string;
  clientIdentifier: string;
  resolvedClientId?: string;
  deliveryMode: DeliveryMode;
  carrierName: string;
  portOfDischarge: string;
  sizeType: string;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export interface IngestionStagingReportDTO {
  batchId: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  rows: IngestionPreviewRow[];
}

export interface ExternalTaskConfirmationResponse {
  success: boolean;
  message: string;
  task: {
    id: string;
    containerNumber: string;
    taskType: TaskType;
    status: TaskStatus;
    confirmedAt: string;
  };
}
