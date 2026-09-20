import { z } from 'zod';

export enum TaskType {
  PICKUP = 'PICKUP',
  DOCUMENT_VERIFICATION = 'DOCUMENT_VERIFICATION',
  CUSTOMS_CLEARANCE = 'CUSTOMS_CLEARANCE',
  GATE_PASS_GENERATION = 'GATE_PASS_GENERATION'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum AssigneeType {
  INTERNAL_USER = 'INTERNAL_USER',
  EXTERNAL_CONTACT = 'EXTERNAL_CONTACT'
}

export const TaskTypeSchema = z.nativeEnum(TaskType);
export const TaskStatusSchema = z.nativeEnum(TaskStatus);
export const AssigneeTypeSchema = z.nativeEnum(AssigneeType);

export const CreateTaskSchema = z.object({
  containerId: z.string().uuid(),
  title: z.string().min(3).max(120),
  description: z.string().optional(),
  taskType: TaskTypeSchema.default(TaskType.PICKUP),
  assigneeType: AssigneeTypeSchema.default(AssigneeType.INTERNAL_USER),
  assignedUserId: z.string().uuid().optional(),
  externalContactName: z.string().min(2).max(100).optional(),
  externalContactPhone: z.string().optional(),
  externalContactEmail: z.string().email().optional(),
  pickupLocation: z.string().optional(),
  scheduledDate: z.string().optional()
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;

// Minimal, non-sensitive summary for external unauthenticated party
export interface ExternalTaskPublicSummary {
  taskId: string;
  title: string;
  containerNumber: string;
  pickupLocation?: string | null;
  scheduledDate?: string | null;
  confirmedAt?: string | null;
  isExpired: boolean;
  isRevoked: boolean;
  alreadyConfirmed: boolean;
}

export interface ConfirmExternalTaskResponse {
  success: boolean;
  confirmedAt: string;
  message: string;
}
