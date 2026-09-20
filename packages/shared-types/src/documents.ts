import { z } from 'zod';

export enum DocumentType {
  BILL_OF_LADING = 'BILL_OF_LADING',
  DELIVERY_ORDER = 'DELIVERY_ORDER',
  BILL_OF_ENTRY = 'BILL_OF_ENTRY',
  CFS_GATE_PASS = 'CFS_GATE_PASS',
  CARRIER_DD_INVOICE = 'CARRIER_DD_INVOICE'
}

export enum ExtractionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum ReviewStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACCEPTED = 'ACCEPTED',
  CORRECTED = 'CORRECTED',
  REJECTED = 'REJECTED'
}

export const DocumentTypeSchema = z.nativeEnum(DocumentType);
export const ExtractionStatusSchema = z.nativeEnum(ExtractionStatus);
export const ReviewStatusSchema = z.nativeEnum(ReviewStatus);

export const FieldProvenanceSchema = z.object({
  value: z.any(),
  confidence: z.number().min(0).max(1),
  source: z.string()
});

export type FieldProvenance = z.infer<typeof FieldProvenanceSchema>;

export const DocumentExtractionResponseSchema = z.object({
  documentId: z.string(),
  extractedFields: z.record(z.any()),
  confidence: z.number().min(0).max(1),
  flaggedForReview: z.boolean(),
  fieldLevelConfidence: z.record(FieldProvenanceSchema),
  extractionVersion: z.string(),
  modelVersion: z.string()
});

export type DocumentExtractionResponse = z.infer<typeof DocumentExtractionResponseSchema>;

export const ReviewDocumentDtoSchema = z.object({
  action: z.enum(['ACCEPT', 'CORRECT', 'REJECT']),
  acceptedFields: z.record(z.any()).optional(),
  notes: z.string().optional()
});

export type ReviewDocumentDto = z.infer<typeof ReviewDocumentDtoSchema>;

export interface DocumentSummaryDto {
  id: string;
  organizationId: string;
  clientId: string;
  containerId?: string | null;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  extractionStatus: ExtractionStatus;
  overallConfidence?: number | null;
  flaggedForReview: boolean;
  reviewStatus: ReviewStatus;
  reviewerId?: string | null;
  originalExtractedFields?: Record<string, any> | null;
  acceptedFields?: Record<string, any> | null;
  fieldLevelConfidence?: Record<string, FieldProvenance> | null;
  createdAt: string;
  updatedAt: string;
}
