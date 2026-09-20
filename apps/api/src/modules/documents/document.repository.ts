import { prisma } from '../../lib/prisma.js';
import { DocumentType, ExtractionStatus, ReviewStatus } from '@prisma/client';

export class DocumentRepository {
  public static async createDocument(data: {
    organizationId: string;
    clientId: string;
    containerId?: string | null;
    documentType: DocumentType;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileUrl: string;
  }) {
    return prisma.document.create({
      data: {
        ...data,
        extractionStatus: ExtractionStatus.PENDING,
        reviewStatus: ReviewStatus.PENDING_REVIEW,
        flaggedForReview: true
      }
    });
  }

  public static async findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: {
        client: true,
        container: true,
        provenanceRecords: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  public static async findByContainerId(containerId: string) {
    return prisma.document.findMany({
      where: { containerId },
      orderBy: { createdAt: 'desc' },
      include: {
        provenanceRecords: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  public static async updateExtractionResults(
    id: string,
    data: {
      extractionStatus: ExtractionStatus;
      overallConfidence?: number;
      flaggedForReview: boolean;
      originalExtractedFields?: any;
      fieldLevelConfidence?: any;
    }
  ) {
    return prisma.document.update({
      where: { id },
      data
    });
  }

  public static async recordProvenance(data: {
    documentId: string;
    extractionVersion: string;
    modelVersion: string;
    overallConfidence: number;
    fieldLevelConfidence?: any;
    reviewStatus: ReviewStatus;
    reviewerId?: string | null;
    originalFields?: any;
    acceptedFields?: any;
    correctedFields?: any;
  }) {
    return prisma.documentExtractionProvenance.create({
      data
    });
  }

  public static async updateReviewDecision(
    id: string,
    data: {
      reviewStatus: ReviewStatus;
      reviewerId: string;
      acceptedFields?: any;
    }
  ) {
    return prisma.document.update({
      where: { id },
      data
    });
  }

  public static async applyAuthoritativeContainerFields(containerId: string, fields: Record<string, any>) {
    const updateData: any = {};
    if (fields.containerNumber) updateData.containerNumber = fields.containerNumber;
    if (fields.billOfLading) updateData.billOfLading = fields.billOfLading;
    if (fields.carrier) updateData.carrier = fields.carrier;
    if (fields.hsCode) updateData.hsCode = fields.hsCode;
    if (fields.declaredValue) updateData.declaredValue = Number(fields.declaredValue);
    if (fields.currency) updateData.currency = fields.currency;

    if (Object.keys(updateData).length === 0) return null;

    return prisma.container.update({
      where: { id: containerId },
      data: updateData
    });
  }
}
