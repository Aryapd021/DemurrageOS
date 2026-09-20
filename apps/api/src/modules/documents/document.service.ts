import { DocumentRepository } from './document.repository.js';
import { AuthenticatedUser } from '../../middleware/auth.middleware.js';
import { assertClientScope, assertOrganizationScope } from '../../middleware/scope.middleware.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../../common/errors/app-error.js';
import { DocumentType, ReviewStatus } from '@prisma/client';
import { ReviewDocumentDto } from '@demurrageos/shared-types';
import { getDocumentExtractionQueue } from '../../jobs/queues.js';
import { DocumentExtractionProcessor } from '../../jobs/document-extraction.worker.js';
import { ComplianceService } from '../compliance/compliance.service.js';
import { RiskService } from '../risk/risk.service.js';
import { AuditService } from '../audit/audit.service.js';
import { prisma } from '../../lib/prisma.js';

export class DocumentService {
  public static async uploadDocument(
    user: AuthenticatedUser,
    file: Express.Multer.File,
    data: {
      clientId: string;
      containerId?: string;
      documentType: DocumentType;
    }
  ) {
    assertClientScope(user, data.clientId);

    if (data.containerId) {
      const container = await prisma.container.findUnique({
        where: { id: data.containerId }
      });
      if (!container) {
        throw new NotFoundError(`Container ${data.containerId} not found`);
      }
      assertOrganizationScope(user, container.organizationId);
      assertClientScope(user, container.clientId);
    }

    const doc = await DocumentRepository.createDocument({
      organizationId: user.organizationId,
      clientId: data.clientId,
      containerId: data.containerId,
      documentType: data.documentType,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileUrl: file.path
    });

    await AuditService.log({
      organizationId: user.organizationId,
      actorId: user.id,
      actorType: 'USER',
      action: 'UPLOAD_DOCUMENT',
      targetType: 'DOCUMENT',
      targetId: doc.id,
      metadata: {
        documentType: data.documentType,
        fileName: file.originalname,
        fileSize: file.size
      }
    });

    // Enqueue BullMQ extraction job
    const queue = getDocumentExtractionQueue();
    if (queue) {
      const jobId = `extract-${doc.id}-1.0.0`;
      await queue.add(
        'extract',
        {
          documentId: doc.id,
          fileUrl: file.path,
          documentType: data.documentType,
          extractionVersion: '1.0.0'
        },
        { jobId }
      );
    } else {
      // Async fallback execution
      setImmediate(() => {
        DocumentExtractionProcessor.process({
          documentId: doc.id,
          fileUrl: file.path,
          documentType: data.documentType,
          extractionVersion: '1.0.0'
        }).catch(() => {});
      });
    }

    return doc;
  }

  public static async getDocument(user: AuthenticatedUser, documentId: string) {
    const doc = await DocumentRepository.findById(documentId);
    if (!doc) {
      throw new NotFoundError(`Document ${documentId} not found`);
    }

    assertOrganizationScope(user, doc.organizationId);
    assertClientScope(user, doc.clientId);

    return doc;
  }

  public static async getContainerDocuments(user: AuthenticatedUser, containerId: string) {
    const container = await prisma.container.findUnique({
      where: { id: containerId }
    });
    if (!container) {
      throw new NotFoundError(`Container ${containerId} not found`);
    }

    assertOrganizationScope(user, container.organizationId);
    assertClientScope(user, container.clientId);

    return DocumentRepository.findByContainerId(containerId);
  }

  public static async reviewDocument(
    user: AuthenticatedUser,
    documentId: string,
    dto: ReviewDocumentDto
  ) {
    const doc = await DocumentRepository.findById(documentId);
    if (!doc) {
      throw new NotFoundError(`Document ${documentId} not found`);
    }

    assertOrganizationScope(user, doc.organizationId);
    assertClientScope(user, doc.clientId);

    const action = dto.action;
    let newStatus: ReviewStatus = ReviewStatus.PENDING_REVIEW;
    let acceptedFields = dto.acceptedFields || (doc.originalExtractedFields as Record<string, any>) || {};

    if (action === 'ACCEPT') {
      newStatus = ReviewStatus.ACCEPTED;
    } else if (action === 'CORRECT') {
      newStatus = ReviewStatus.CORRECTED;
    } else if (action === 'REJECT') {
      newStatus = ReviewStatus.REJECTED;
      acceptedFields = {};
    }

    const updatedDoc = await DocumentRepository.updateReviewDecision(documentId, {
      reviewStatus: newStatus,
      reviewerId: user.id,
      acceptedFields
    });

    // Record human correction in provenance
    await DocumentRepository.recordProvenance({
      documentId,
      extractionVersion: '1.0.0',
      modelVersion: 'human_review',
      overallConfidence: 1.0,
      reviewStatus: newStatus,
      reviewerId: user.id,
      originalFields: doc.originalExtractedFields,
      acceptedFields,
      correctedFields: action === 'CORRECT' ? dto.acceptedFields : undefined
    });

    // If accepted or corrected, update authoritative container fields
    if ((newStatus === ReviewStatus.ACCEPTED || newStatus === ReviewStatus.CORRECTED) && doc.containerId) {
      await DocumentRepository.applyAuthoritativeContainerFields(doc.containerId, acceptedFields);
      
      // Recalculate document completeness compliance signal & risk
      await ComplianceService.deriveDocumentCompleteness(doc.containerId);
      await RiskService.calculateContainerRisk(user, doc.containerId);
    }

    await AuditService.log({
      organizationId: doc.organizationId,
      actorId: user.id,
      actorType: 'USER',
      action: `DOCUMENT_${action}`,
      targetType: 'DOCUMENT',
      targetId: documentId,
      metadata: {
        reviewStatus: newStatus,
        corrected: action === 'CORRECT'
      }
    });

    return updatedDoc;
  }
}
