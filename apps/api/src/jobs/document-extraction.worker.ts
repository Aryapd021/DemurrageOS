import { DocumentRepository } from '../modules/documents/document.repository.js';
import { ExtractionStatus, ReviewStatus } from '@prisma/client';
import { config } from '../config/index.js';
import { logger } from '../common/logging/logger.js';
import { AuditService } from '../modules/audit/audit.service.js';

export interface DocumentExtractionJobData {
  documentId: string;
  fileUrl: string;
  documentType: string;
  extractionVersion?: string;
}

export class DocumentExtractionProcessor {
  public static async process(data: DocumentExtractionJobData): Promise<void> {
    const { documentId, fileUrl, documentType } = data;
    const extractionVersion = data.extractionVersion || '1.0.0';

    logger.info(`Starting document extraction for ${documentId} (${documentType})`, { documentId });

    const doc = await DocumentRepository.findById(documentId);
    if (!doc) {
      logger.error(`Document ${documentId} not found for extraction`, null, { documentId });
      return;
    }

    try {
      await DocumentRepository.updateExtractionResults(documentId, {
        extractionStatus: ExtractionStatus.PROCESSING,
        flaggedForReview: true
      });

      // Call advisory Python AI service
      const aiResponse = await fetch(`${config.aiServiceUrl}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          fileUrl,
          documentType
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!aiResponse.ok) {
        throw new Error(`AI service returned HTTP ${aiResponse.status}`);
      }

      const result: any = await aiResponse.json();

      // Stage AI suggestion in PostgreSQL
      await DocumentRepository.updateExtractionResults(documentId, {
        extractionStatus: ExtractionStatus.COMPLETED,
        overallConfidence: result.confidence,
        flaggedForReview: result.flaggedForReview,
        originalExtractedFields: result.extractedFields,
        fieldLevelConfidence: result.fieldLevelConfidence
      });

      // Record immutable provenance
      await DocumentRepository.recordProvenance({
        documentId,
        extractionVersion,
        modelVersion: result.modelVersion || 'deepseek-ocr-v1',
        overallConfidence: result.confidence,
        fieldLevelConfidence: result.fieldLevelConfidence,
        reviewStatus: ReviewStatus.PENDING_REVIEW,
        originalFields: result.extractedFields
      });

      await AuditService.log({
        organizationId: doc.organizationId,
        actorType: 'SYSTEM',
        action: 'DOCUMENT_EXTRACTION_COMPLETED',
        targetType: 'DOCUMENT',
        targetId: documentId,
        metadata: {
          confidence: result.confidence,
          flaggedForReview: result.flaggedForReview
        }
      });

      logger.info(`Document extraction completed and staged for ${documentId}`, {
        documentId,
        confidence: result.confidence,
        flagged: result.flaggedForReview
      });
    } catch (err: any) {
      logger.warn(`Document extraction failed for ${documentId}: ${err.message}. System continues safely.`, { documentId });

      await DocumentRepository.updateExtractionResults(documentId, {
        extractionStatus: ExtractionStatus.FAILED,
        flaggedForReview: true
      });

      await AuditService.log({
        organizationId: doc.organizationId,
        actorType: 'SYSTEM',
        action: 'DOCUMENT_EXTRACTION_FAILED',
        targetType: 'DOCUMENT',
        targetId: documentId,
        metadata: { error: err.message }
      });
    }
  }
}
