/**
 * DemurrageOS — Shared Types & Domain Interfaces
 * Conforms to OpenAPI specs and architecture guidelines.
 */

// ── Auth ─────────────────────────────────────────────────────────
export type UserRole = "OWNER" | "ADMIN" | "OPERATOR" | "VIEWER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orgId: string;
  orgName: string;
  emailVerified: boolean;
  image?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  expiresAt: string; // ISO string
}
// ─────────────────────────────────────────────────────────────────

export type DeliveryMode = 'DPD_DIRECT' | 'DPD_CFS' | 'CFS';

export type ContainerStatus = 'ON_TRACK' | 'WARNING' | 'CRITICAL' | 'RESOLVED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ChargeType = 
  | 'DEMURRAGE' 
  | 'DETENTION' 
  | 'STORAGE' 
  | 'GROUND_RENT' 
  | 'SHIFTING_CHARGE';

export type EventType =
  | 'CONTAINER_DISCHARGED'
  | 'CUSTOMS_EXAM_ORDERED'
  | 'CUSTOMS_OUT_OF_CHARGE'
  | 'DELIVERY_ORDER_ISSUED'
  | 'DELIVERY_ORDER_REISSUED'
  | 'DPD_TO_CFS_FALLBACK'
  | 'CFS_GATE_IN'
  | 'CFS_GATE_OUT'
  | 'CONTAINER_PICKUP_SCHEDULED'
  | 'CONTAINER_GATE_OUT';

export interface Organization {
  id: string;
  name: string;
  code: string;
  role: 'CHA';
}

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  aeoStatus: 'NONE' | 'AEO_T1' | 'AEO_T2' | 'AEO_T3' | 'ACP';
  email: string;
  phone?: string;
  activeContainersCount: number;
  criticalRiskCount: number;
  totalExposureINR: number;
}

export interface ContainerEvent {
  id: string;
  containerId: string;
  eventType: EventType;
  timestamp: string; // ISO 8601
  location: string;
  source: 'CARRIER_EDI' | 'PORT_SYSTEM' | 'CSV_IMPORT' | 'MANUAL_ENTRY' | 'EXTERNAL_CONFIRMATION';
  description: string;
  metadata?: Record<string, unknown>;
}

export interface ChargeBreakdownItem {
  type: ChargeType;
  label: string;
  amount: number;
  currency: 'INR' | 'USD';
  clockBasis: string;
  daysBilled: number;
  dailyRate: number;
  isAuditTarget?: boolean;
}

export interface ClockStatus {
  basis: string;
  startDate: string;
  freeDaysTotal: number;
  freeDaysRemaining: number;
  daysOverdue: number;
  isActive: boolean;
  expiryDate: string;
}

export interface TwoClockDetails {
  carrierClock: ClockStatus;
  cfsClock?: ClockStatus;
  hasFallback: boolean;
}

export interface RiskExplainability {
  level: RiskLevel;
  totalScore: number; // 0 - 100
  urgencyScore: number;
  customsScore: number;
  pickupScore: number;
  financialScore: number;
  uncertaintyScore: number;
  reasons: string[];
  recommendedActions: string[];
}

export interface ComplianceSignal {
  id: string;
  containerId: string;
  signalType: 'DOC_COMPLETENESS' | 'HS_CODE_NOVELTY' | 'AEO_ACP_STATUS' | 'VALUATION_CONSISTENCY';
  title: string;
  score: number; // impact on risk
  description: string;
  severity: 'INFO' | 'WARNING' | 'ALERT';
}

export type TaskStatus = 'OPEN' | 'ASSIGNED' | 'CONFIRMED' | 'OVERDUE' | 'COMPLETED';
export type TaskAssigneeType = 'INTERNAL' | 'EXTERNAL';

export interface Task {
  id: string;
  containerId: string;
  containerNumber: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeType: TaskAssigneeType;
  assigneeName?: string;
  assigneeContact?: string; // Phone or email
  externalToken?: string;
  tokenExpiry?: string;
  confirmedAt?: string;
  dueDate: string;
  createdAt: string;
}

export interface DocumentExtractedField {
  label: string;
  value: string | number | boolean;
  confidence: number; // 0.0 to 1.0
  flaggedForReview: boolean;
}

export interface DocumentRecord {
  id: string;
  containerId: string;
  documentType: 'BILL_OF_LADING' | 'DELIVERY_ORDER' | 'BILL_OF_ENTRY' | 'CFS_GATE_PASS' | 'INVOICE';
  filename: string;
  uploadDate: string;
  fileSize: number;
  status: 'PENDING' | 'EXTRACTED' | 'REVIEWED' | 'REJECTED';
  extractedFields: Record<string, DocumentExtractedField>;
}

export interface Container {
  id: string;
  containerNumber: string;
  clientId: string;
  clientName: string;
  organizationId: string;
  blNumber: string;
  shippingLine: string;
  vesselName: string;
  voyageNumber: string;
  portOfDischarge: string;
  currentLocation: string;
  deliveryMode: DeliveryMode;
  status: ContainerStatus;
  dischargedAt: string;
  twoClocks: TwoClockDetails;
  currentExposureINR: number;
  projectedExposureINR: number;
  charges: ChargeBreakdownItem[];
  risk: RiskExplainability;
  complianceSignals: ComplianceSignal[];
  events: ContainerEvent[];
  openTasksCount: number;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalContainers: number;
  atRiskContainers: number;
  criticalExposureINR: number;
  totalExposureINR: number;
  preventableExposureINR: number;
  activeClientsCount: number;
  recentTasks: Task[];
  urgentAlerts: {
    id: string;
    containerId: string;
    containerNumber: string;
    clientName: string;
    type: 'FREE_TIME_EXPIRING' | 'DPD_FALLBACK' | 'CUSTOMS_QUERY' | 'TASK_OVERDUE';
    message: string;
    severity: 'WARNING' | 'CRITICAL';
    timestamp: string;
  }[];
}

export interface CsvImportStagingRow {
  rowNumber: number;
  containerNumber: string;
  blNumber: string;
  clientId: string;
  clientName?: string;
  shippingLine: string;
  deliveryMode: DeliveryMode;
  portOfDischarge: string;
  dischargedAt: string;
  status: 'VALID' | 'WARNING' | 'ERROR';
  validationMessages: string[];
}

export interface ExternalTaskConfirmationPayload {
  token: string;
  scheduledPickupTime: string;
  transporterName: string;
  driverPhone: string;
  vehicleNumber: string;
  notes?: string;
}
