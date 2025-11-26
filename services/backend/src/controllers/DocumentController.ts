import { Request, Response, NextFunction } from 'express';
import { PrismaClient, DocumentType } from '@prisma/client';
import { DocumentStorageService } from '../services/DocumentStorageService';
import { DocumentSharingService } from '../services/DocumentSharingService';
import { DocumentAnnotationService } from '../services/DocumentAnnotationService';
import { DocumentWorkflowService } from '../services/DocumentWorkflowService';
import OCRService from '../services/OCRService';
import { logger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const documentStorageService = new DocumentStorageService(prisma);
const documentSharingService = new DocumentSharingService(prisma);
const documentAnnotationService = new DocumentAnnotationService(prisma);
const documentWorkflowService = new DocumentWorkflowService(prisma);

export class DocumentController {
  /**
   * @swagger
   * /api/documents/upload:
   *   post:
   *     summary: Dokument hochladen
   *     tags: [Document Processing]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *               documentType:
   *                 type: string
   *                 enum: [RENTAL_CONTRACT, UTILITY_BILL, WARNING_LETTER, OTHER]
   *               caseId:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       201:
   *         description: Dokument erfolgreich hochgeladen
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Document'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/AuthenticationError'
   */
  static async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      const { documentType, caseId } = req.body;

      if (!documentType || !Object.values(DocumentType).includes(documentType)) {
        throw new ValidationError('Invalid document type');
      }

      const result = await documentStorageService.uploadDocument(
        userId,
        req.file,
        documentType as DocumentType,
        caseId
      );

      logger.info('Document uploaded successfully', {
        userId,
        documentId: result.documentId
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/documents:
   *   get:
   *     summary: Benutzerdokumente abrufen
   *     tags: [Document Processing]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dokumente erfolgreich abgerufen
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Document'
   *       401:
   *         $ref: '#/components/responses/AuthenticationError'
   */
  static async getUserDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const documents = await documentStorageService.getUserDocuments(userId);

      res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/documents/search:
   *   get:
   *     summary: Dokumente suchen
   *     tags: [Document Processing]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: query
   *         schema:
   *           type: string
   *         description: Suchbegriff
   *       - in: query
   *         name: documentType
   *         schema:
   *           type: string
   *           enum: [RENTAL_CONTRACT, UTILITY_BILL, WARNING_LETTER, OTHER]
   *         description: Dokumenttyp
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Startdatum
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Enddatum
   *       - in: query
   *         name: minRiskLevel
   *         schema:
   *           type: integer
   *           minimum: 0
   *           maximum: 10
   *         description: Minimale Risikostufe
   *       - in: query
   *         name: maxRiskLevel
   *         schema:
   *           type: integer
   *           minimum: 0
   *           maximum: 10
   *         description: Maximale Risikostufe
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [uploadedAt, originalName, documentType]
   *         description: Sortierfeld
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *         description: Sortierreihenfolge
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Seitennummer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Anzahl der Ergebnisse pro Seite
   *     responses:
   *       200:
   *         description: Dokumente erfolgreich gefunden
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Document'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     totalCount:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *       401:
   *         $ref: '#/components/responses/AuthenticationError'
   */
  static async searchDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const {
        query,
        documentType,
        startDate,
        endDate,
        minRiskLevel,
        maxRiskLevel,
        sortBy = 'uploadedAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      // Build where conditions
      const where: any = {
        userId,
        isCurrent: true // Only get current versions
      };

      // Add search query condition
      if (query) {
        where.OR = [
          { originalName: { contains: query, mode: 'insensitive' } },
          { metadata: { path: '$.textContent', string_contains: query } }
        ];
      }

      // Add document type filter
      if (documentType) {
        where.documentType = documentType;
      }

      // Add date range filter
      if (startDate || endDate) {
        where.uploadedAt = {};
        if (startDate) {
          where.uploadedAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.uploadedAt.lte = new Date(endDate as string);
        }
      }

      // Add risk level filter
      if (minRiskLevel || maxRiskLevel) {
        where.analysis = {};
        if (minRiskLevel) {
          where.analysis.riskLevel = { gte: minRiskLevel };
        }
        if (maxRiskLevel) {
          where.analysis.riskLevel = { ...where.analysis.riskLevel, lte: maxRiskLevel };
        }
      }

      // Build orderBy clause
      const orderBy: any = {};
      orderBy[sortBy as string] = sortOrder;

      // Get documents with pagination
      const documents = await prisma.document.findMany({
        where,
        orderBy,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          analysis: true
        }
      });

      // Get total count for pagination
      const totalCount = await prisma.document.count({ where });

      res.json({
        success: true,
        data: documents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/documents/{documentId}:
   *   get:
   *     summary: Einzelnes Dokument abrufen
   *     tags: [Document Processing]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: documentId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Dokument-ID
   *     responses:
   *       200:
   *         description: Dokument erfolgreich abgerufen
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Document'
   *       401:
   *         $ref: '#/components/responses/AuthenticationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   */
  static async getDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;

      const document = await documentStorageService.getDocument(documentId, userId);

      if (!document) {
        throw new ValidationError('Document not found');
      }

      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document versions
   */
  static async getDocumentVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;

      const versions = await documentStorageService.getDocumentVersions(documentId, userId);

      res.json({
        success: true,
        data: versions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload a new version of a document
   */
  static async uploadDocumentVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;
      const { documentType } = req.body;
      const file = req.file;

      if (!file) {
        throw new ValidationError('No file uploaded');
      }

      if (!documentType) {
        throw new ValidationError('Document type is required');
      }

      // Verify the parent document exists and belongs to the user
      const parentDocument = await documentStorageService.getCurrentDocument(documentId, userId);
      if (!parentDocument) {
        throw new ValidationError('Parent document not found or access denied');
      }

      const result = await documentStorageService.uploadDocument(
        userId,
        file,
        documentType as any,
        undefined, // caseId
        documentId // parentId
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/documents/{documentId}/download:
   *   get:
   *     summary: Dokument herunterladen
   *     tags: [Document Processing]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: documentId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Dokument-ID
   *     responses:
   *       200:
   *         description: Dokument erfolgreich heruntergeladen
   *         content:
   *           application/pdf:
   *             schema:
   *               type: string
   *               format: binary
   *           image/*:
   *             schema:
   *               type: string
   *               format: binary
   *       401:
   *         $ref: '#/components/responses/AuthenticationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   */
  static async downloadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;

      const { stream, filename, mimeType } = await documentStorageService.downloadDocument(
        documentId,
        userId
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/documents/{documentId}:
   *   delete:
   *     summary: Dokument löschen
   *     tags: [Document Processing]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: documentId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Dokument-ID
   *     responses:
   *       200:
   *         description: Dokument erfolgreich gelöscht
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Document deleted successfully"
   *       401:
   *         $ref: '#/components/responses/AuthenticationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   */
  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;

      await documentStorageService.deleteDocument(documentId, userId);

      logger.info('Document deleted', { userId, documentId });

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const stats = await documentStorageService.getUserStorageStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract text from document using OCR
   */
  static async extractText(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;

      // Get document from storage
      const { stream, mimeType } = await documentStorageService.downloadDocument(
        documentId,
        userId
      );

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Extract text based on mime type
      let ocrResult;
      if (mimeType === 'application/pdf') {
        ocrResult = await OCRService.extractTextFromPDF(buffer);
      } else if (mimeType.startsWith('image/')) {
        ocrResult = await OCRService.extractTextFromImage(buffer);
      } else {
        throw new ValidationError('Unsupported document type for OCR');
      }

      logger.info('Text extracted from document', {
        userId,
        documentId,
        confidence: ocrResult.confidence,
        textLength: ocrResult.text.length
      });

      res.json({
        success: true,
        data: ocrResult
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze rental contract document
   */
  static async analyzeRentalContract(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;

      // Get document from storage
      const { stream, mimeType } = await documentStorageService.downloadDocument(
        documentId,
        userId
      );

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Extract text
      let ocrResult;
      if (mimeType === 'application/pdf') {
        ocrResult = await OCRService.extractTextFromPDF(buffer);
      } else if (mimeType.startsWith('image/')) {
        ocrResult = await OCRService.extractTextFromImage(buffer);
      } else {
        throw new ValidationError('Unsupported document type');
      }

      // Preprocess text
      const preprocessed = OCRService.preprocessGermanLegalText(ocrResult.text);

      // Extract structured data
      const extractedData = OCRService.extractRentalContractData(ocrResult.text);

      logger.info('Rental contract analyzed', {
        userId,
        documentId,
        fieldsExtracted: Object.keys(extractedData).length
      });

      res.json({
        success: true,
        data: {
          ocrConfidence: ocrResult.confidence,
          extractedData,
          preprocessed: {
            paragraphCount: preprocessed.paragraphs.length,
            sentenceCount: preprocessed.sentences.length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze utility bill document
   */
  static async analyzeUtilityBill(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;

      // Get document from storage
      const { stream, mimeType } = await documentStorageService.downloadDocument(
        documentId,
        userId
      );

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Extract text
      let ocrResult;
      if (mimeType === 'application/pdf') {
        ocrResult = await OCRService.extractTextFromPDF(buffer);
      } else if (mimeType.startsWith('image/')) {
        ocrResult = await OCRService.extractTextFromImage(buffer);
      } else {
        throw new ValidationError('Unsupported document type');
      }

      // Extract utility bill data
      const extractedData = OCRService.extractUtilityBillData(ocrResult.text);

      logger.info('Utility bill analyzed', {
        userId,
        documentId,
        fieldsExtracted: Object.keys(extractedData).length
      });

      res.json({
        success: true,
        data: {
          ocrConfidence: ocrResult.confidence,
          extractedData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze warning letter document
   */
  static async analyzeWarningLetter(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;

      // Get document from storage
      const { stream, mimeType } = await documentStorageService.downloadDocument(
        documentId,
        userId
      );

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Extract text
      let ocrResult;
      if (mimeType === 'application/pdf') {
        ocrResult = await OCRService.extractTextFromPDF(buffer);
      } else if (mimeType.startsWith('image/')) {
        ocrResult = await OCRService.extractTextFromImage(buffer);
      } else {
        throw new ValidationError('Unsupported document type');
      }

      // Extract warning letter data
      const extractedData = OCRService.extractWarningLetterData(ocrResult.text);

      logger.info('Warning letter analyzed', {
        userId,
        documentId,
        containsThreats: extractedData.containsTerminationThreat || extractedData.containsLegalThreat
      });

      res.json({
        success: true,
        data: {
          ocrConfidence: ocrResult.confidence,
          extractedData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Share a document
   */
  static async shareDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;
      const { sharedWithEmail, permission, expiresAt } = req.body;

      if (!sharedWithEmail) {
        throw new ValidationError('Shared user email is required');
      }

      const share = await documentSharingService.shareDocument(
        documentId,
        userId,
        sharedWithEmail,
        permission || 'READ',
        expiresAt ? new Date(expiresAt) : undefined
      );

      res.json({
        success: true,
        data: share
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document shares
   */
  static async getDocumentShares(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;

      const shares = await documentSharingService.getDocumentShares(documentId, userId);

      res.json({
        success: true,
        data: shares
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get shared documents
   */
  static async getSharedDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const shares = await documentSharingService.getSharedDocuments(userId);

      res.json({
        success: true,
        data: shares
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a share
   */
  static async updateShare(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { shareId } = req.params;
      const { permission, expiresAt } = req.body;

      const share = await documentSharingService.updateShare(
        shareId,
        userId,
        permission,
        expiresAt ? new Date(expiresAt) : undefined
      );

      res.json({
        success: true,
        data: share
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove a share
   */
  static async removeShare(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { shareId } = req.params;

      await documentSharingService.removeShare(shareId, userId);

      res.json({
        success: true,
        message: 'Share removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a document annotation
   */
  static async createAnnotation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;
      const { text, type, parentId, page, positionX, positionY } = req.body;

      if (!text) {
        throw new ValidationError('Annotation text is required');
      }

      const annotation = await documentAnnotationService.createAnnotation(
        documentId,
        userId,
        text,
        type,
        parentId,
        page,
        positionX,
        positionY
      );

      res.json({
        success: true,
        data: annotation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document annotations
   */
  static async getDocumentAnnotations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;
      const { includeReplies } = req.query;

      const annotations = await documentAnnotationService.getDocumentAnnotations(
        documentId,
        includeReplies !== 'false'
      );

      res.json({
        success: true,
        data: annotations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a document annotation
   */
  static async updateAnnotation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { annotationId } = req.params;
      const { text, resolved } = req.body;

      const annotation = await documentAnnotationService.updateAnnotation(
        annotationId,
        userId,
        text,
        resolved
      );

      res.json({
        success: true,
        data: annotation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a document annotation
   */
  static async deleteAnnotation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { annotationId } = req.params;

      await documentAnnotationService.deleteAnnotation(annotationId, userId);

      res.json({
        success: true,
        message: 'Annotation deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve a document annotation
   */
  static async resolveAnnotation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { annotationId } = req.params;

      const annotation = await documentAnnotationService.resolveAnnotation(annotationId, userId);

      res.json({
        success: true,
        data: annotation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transition document status
   */
  static async transitionDocumentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;
      const { action, comment } = req.body;

      if (!action) {
        throw new ValidationError('Action is required');
      }

      const updatedDocument = await documentWorkflowService.transitionDocumentStatus(
        documentId,
        userId,
        action,
        comment
      );

      res.json({
        success: true,
        data: updatedDocument
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document workflow history
   */
  static async getDocumentWorkflowHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { documentId } = req.params;

      // Verify the user has access to the document
      const document = await documentStorageService.getDocument(documentId, userId);
      if (!document) {
        throw new ValidationError('Document not found');
      }

      const history = await documentWorkflowService.getDocumentWorkflowHistory(documentId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all workflow rules
   */
  static async getWorkflowRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await documentWorkflowService.getAllWorkflowRules();

      res.json({
        success: true,
        data: rules
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a workflow rule
   */
  static async createWorkflowRule(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, triggerEvent, action, condition, actionParams, description } = req.body;

      if (!name || !triggerEvent || !action) {
        throw new ValidationError('Name, triggerEvent, and action are required');
      }

      const rule = await documentWorkflowService.createWorkflowRule(
        name,
        triggerEvent,
        action,
        condition,
        actionParams,
        description
      );

      res.status(201).json({
        success: true,
        data: rule
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a workflow rule
   */
  static async updateWorkflowRule(req: Request, res: Response, next: NextFunction) {
    try {
      const { ruleId } = req.params;
      const updates = req.body;

      const rule = await documentWorkflowService.updateWorkflowRule(ruleId, updates);

      res.json({
        success: true,
        data: rule
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a workflow rule
   */
  static async deleteWorkflowRule(req: Request, res: Response, next: NextFunction) {
    try {
      const { ruleId } = req.params;

      await documentWorkflowService.deleteWorkflowRule(ruleId);

      res.json({
        success: true,
        message: 'Workflow rule deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
