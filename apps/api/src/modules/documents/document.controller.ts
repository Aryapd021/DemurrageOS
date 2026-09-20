import { Request, Response, NextFunction } from 'express';
import { DocumentService } from './document.service.js';
import { DocumentType } from '@prisma/client';
import { ReviewDocumentDtoSchema } from '@demurrageos/shared-types';
import { ValidationError } from '../../common/errors/app-error.js';

export class DocumentController {
  public static async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('No document file uploaded');
      }

      const user = req.user!;
      const clientId = req.body.clientId;
      const containerId = req.body.containerId;
      const documentType = req.body.documentType as DocumentType;

      if (!clientId) {
        throw new ValidationError('clientId is required for document upload');
      }
      if (!documentType || !Object.values(DocumentType).includes(documentType)) {
        throw new ValidationError(`Invalid documentType: ${documentType}`);
      }

      const doc = await DocumentService.uploadDocument(user, req.file, {
        clientId,
        containerId,
        documentType
      });

      res.status(201).json({ data: doc });
    } catch (err) {
      next(err);
    }
  }

  public static async getDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const doc = await DocumentService.getDocument(user, id);
      res.json({ data: doc });
    } catch (err) {
      next(err);
    }
  }

  public static async getContainerDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const containerId = String(req.params.containerId);
      const docs = await DocumentService.getContainerDocuments(user, containerId);
      res.json({ data: docs });
    } catch (err) {
      next(err);
    }
  }

  public static async reviewDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const id = String(req.params.id);

      const parsed = ReviewDocumentDtoSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid review payload', parsed.error.format());
      }

      const updated = await DocumentService.reviewDocument(user, id, parsed.data);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
}
