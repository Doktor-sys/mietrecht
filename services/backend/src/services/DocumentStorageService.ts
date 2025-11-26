import { PrismaClient, Document as PrismaDocument, DocumentType as PrismaDocumentType } from '@prisma/client';
import { getMinioClient } from '../config/minio';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';
import crypto from 'crypto';
import path from 'path';
import { Readable } from 'stream';
import { EncryptionServiceWithKMS } from './EncryptionService';
import { ClamAVService } from './ClamAVService';
import { KeyPurpose } from '../types/kms';
import pdfParse from 'pdf-parse';
// import sharp from 'sharp'; // Dynamic import used instead

export interface UploadResult {
  documentId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  documentType: PrismaDocumentType;
  uploadedAt: Date;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  pageCount?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  hasText?: boolean;
  language?: string;
  encrypted?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: DocumentMetadata;
}

export class DocumentStorageService {
  private minioClient;
  private bucketName: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];
  private encryptionService?: EncryptionServiceWithKMS;
  private clamAVService: ClamAVService;

  constructor(
    private prisma: PrismaClient,
    encryptionService?: EncryptionServiceWithKMS,
    clamAVService?: ClamAVService
  ) {
    this.minioClient = getMinioClient();
    this.bucketName = config.minio.bucketName;
    this.maxFileSize = config.upload.maxFileSize;
    this.allowedMimeTypes = config.upload.allowedMimeTypes;
    this.encryptionService = encryptionService;
    this.clamAVService = clamAVService || new ClamAVService();
  }

  /**
   * Upload a document with validation and virus scanning
   */
  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    documentType: PrismaDocumentType,
    caseId?: string,
    parentId?: string
  ): Promise<UploadResult> {
    try {
      logger.info('Starting document upload', {
        userId,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        documentType,
        parentId
      });

      // Step 1: Validate file
      const validation = await this.validateFile(file);
      if (!validation.isValid) {
        throw new ValidationError(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Step 2: Scan for viruses (placeholder - would integrate with ClamAV or similar)
      const virusScanResult = await this.scanForViruses(file.buffer);
      if (!virusScanResult.clean) {
        throw new ValidationError('File contains malicious content');
      }

      // Step 3: Generate secure filename
      const filename = this.generateSecureFilename(file.originalname);
      const objectName = `${userId}/${filename}`;

      // Step 4: Encrypt and upload to MinIO
      let encryptedBuffer: Buffer;
      let encryptionKeyId: string | undefined;
      let encryptionKeyVersion: number | undefined;

      // Use KMS if available, otherwise fall back to legacy encryption
      if (this.encryptionService) {
        const encrypted = await this.encryptionService.encryptFileWithKMS(
          file.buffer,
          userId, // Use userId as tenantId for now
          KeyPurpose.DOCUMENT_ENCRYPTION,
          'document-service'
        );
        encryptedBuffer = Buffer.from(encrypted.encryptedData, 'base64');
        encryptionKeyId = encrypted.keyId;
        encryptionKeyVersion = encrypted.keyVersion;

        logger.info('File encrypted with KMS', {
          objectName,
          keyId: encryptionKeyId,
          keyVersion: encryptionKeyVersion
        });
      } else {
        // Legacy encryption (backward compatibility)
        encryptedBuffer = this.encryptFile(file.buffer);
        logger.warn('Using legacy encryption (KMS not available)', { objectName });
      }

      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        encryptedBuffer,
        encryptedBuffer.length,
        {
          'Content-Type': file.mimetype,
          'X-Original-Name': Buffer.from(file.originalname).toString('base64'),
          'X-User-Id': userId,
          'X-Document-Type': documentType,
          'X-Encrypted': 'true',
          'X-Encryption-Type': this.encryptionService ? 'kms' : 'legacy',
          ...(encryptionKeyId && { 'X-Encryption-Key-Id': encryptionKeyId }),
          ...(encryptionKeyVersion && { 'X-Encryption-Key-Version': encryptionKeyVersion.toString() })
        }
      );

      logger.info('File uploaded to MinIO', { objectName });

      // Step 5: Extract metadata
      const metadata = await this.extractMetadata(file);

      // Step 6: Handle versioning
      let version = 1;
      if (parentId) {
        // This is a new version of an existing document
        // Mark the previous version as not current
        // @ts-ignore: TypeScript not recognizing isCurrent property
        await this.prisma.document.updateMany({
          where: {
            id: parentId,
            userId
          },
          // @ts-ignore: TypeScript not recognizing isCurrent property
          data: {
            // @ts-ignore: TypeScript not recognizing isCurrent property
            isCurrent: false
          }
        });
        
        // Get the version number of the parent document and increment
        // @ts-ignore: TypeScript not recognizing version property
        const parentDoc = await this.prisma.document.findFirst({
          where: {
            id: parentId,
            userId
          }
        });
        
        if (parentDoc) {
          // @ts-ignore: TypeScript not recognizing version property
          version = parentDoc.version + 1;
        }
      }

      // Step 7: Save document record to database
      // @ts-ignore: TypeScript not recognizing version property
      const document = await this.prisma.document.create({
        // @ts-ignore: TypeScript not recognizing version property
        data: {
          userId,
          caseId,
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          documentType,
          // @ts-ignore: TypeScript not recognizing version property
          version,
          // @ts-ignore: TypeScript not recognizing parentId property
          parentId,
          // @ts-ignore: TypeScript not recognizing isCurrent property
          isCurrent: true,
          ...(encryptionKeyId && { encryptionKeyId }),
          ...(encryptionKeyVersion && { encryptionKeyVersion })
        }
      });

      logger.info('Document record created', { documentId: document.id });

      return {
        documentId: document.id,
        filename: document.filename,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        documentType: document.documentType,
        uploadedAt: document.uploadedAt,
        metadata
      };
    } catch (error) {
      logger.error('Error uploading document', { error, userId });
      throw error;
    }
  }

  /**
   * Get document versions
   */
  async getDocumentVersions(documentId: string, userId: string): Promise<PrismaDocument[]> {
    try {
      // First, find the root document (the one without a parent or the original)
      // @ts-ignore: TypeScript not recognizing parentId property
      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          userId
        }
      });

      if (!document) {
        throw new ValidationError('Document not found or access denied');
      }

      // Find the root document (the one without a parent)
      let rootDocumentId = document.id;
      // @ts-ignore: TypeScript not recognizing parentId property
      if (document.parentId) {
        // Traverse up to find the root
        let current = document;
        // @ts-ignore: TypeScript not recognizing parentId property
        while (current.parentId) {
          // @ts-ignore: TypeScript not recognizing parentId property
          current = await this.prisma.document.findFirst({
            where: {
              // @ts-ignore: TypeScript not recognizing parentId property
              id: current.parentId
            }
          }) || current;
          // @ts-ignore: TypeScript not recognizing parentId property
          if (current.parentId) {
            // @ts-ignore: TypeScript not recognizing parentId property
            rootDocumentId = current.parentId;
          }
        }
      }

      // Get all versions of this document
      // @ts-ignore: TypeScript not recognizing parentId property
      const versions = await this.prisma.document.findMany({
        where: {
          OR: [
            { id: rootDocumentId },
            // @ts-ignore: TypeScript not recognizing parentId property
            { parentId: rootDocumentId }
          ],
          userId
        },
        // @ts-ignore: TypeScript not recognizing version property
        orderBy: {
          // @ts-ignore: TypeScript not recognizing version property
          version: 'asc'
        }
      });

      return versions;
    } catch (error) {
      logger.error('Error getting document versions', { error, documentId });
      throw error;
    }
  }

  /**
   * Get current version of a document
   */
  async getCurrentDocument(documentId: string, userId: string): Promise<PrismaDocument | null> {
    try {
      // First, find the document
      // @ts-ignore: TypeScript not recognizing parentId property
      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          userId
        }
      });

      if (!document) {
        return null;
      }

      // If this is already the current version, return it
      // @ts-ignore: TypeScript not recognizing isCurrent property
      if (document.isCurrent) {
        return document;
      }

      // Otherwise, find the current version
      // @ts-ignore: TypeScript not recognizing parentId property
      let currentDocumentId = document.id;
      // @ts-ignore: TypeScript not recognizing parentId property
      if (document.parentId) {
        // Traverse up to find the root
        // @ts-ignore: TypeScript not recognizing parentId property
        let current = document;
        // @ts-ignore: TypeScript not recognizing parentId property
        while (current.parentId) {
          // @ts-ignore: TypeScript not recognizing parentId property
          current = await this.prisma.document.findFirst({
            where: {
              // @ts-ignore: TypeScript not recognizing parentId property
              id: current.parentId
            }
          }) || current;
          // @ts-ignore: TypeScript not recognizing parentId property
          if (current.parentId) {
            // @ts-ignore: TypeScript not recognizing parentId property
            currentDocumentId = current.parentId;
          }
        }
      }

      // Find the current version
      // @ts-ignore: TypeScript not recognizing isCurrent property
      const currentDocument = await this.prisma.document.findFirst({
        where: {
          OR: [
            { id: currentDocumentId },
            // @ts-ignore: TypeScript not recognizing parentId property
            { parentId: currentDocumentId }
          ],
          userId,
          // @ts-ignore: TypeScript not recognizing isCurrent property
          isCurrent: true
        }
      });

      return currentDocument;
    } catch (error) {
      logger.error('Error getting current document', { error, documentId });
      throw error;
    }
  }

  /**
   * Download a document
   */
  async downloadDocument(documentId: string, userId: string): Promise<{
    stream: Readable;
    filename: string;
    mimeType: string;
  }> {
    try {
      // Verify document belongs to user
      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          userId
        }
      });

      if (!document) {
        throw new ValidationError('Document not found or access denied');
      }

      const objectName = `${userId}/${document.filename}`;

      // Get encrypted file from MinIO
      const encryptedStream = await this.minioClient.getObject(this.bucketName, objectName);

      // Get object metadata to check encryption type
      const stat = await this.minioClient.statObject(this.bucketName, objectName);
      const encryptionType = stat.metaData?.['x-encryption-type'] || 'legacy';

      let decryptedStream: Readable;

      // Use KMS decryption if available and document was encrypted with KMS
      if (this.encryptionService && encryptionType === 'kms' && document.encryptionKeyId) {
        // Convert stream to buffer for KMS decryption
        const chunks: Buffer[] = [];
        for await (const chunk of encryptedStream) {
          chunks.push(chunk);
        }
        const encryptedBuffer = Buffer.concat(chunks);

        const decrypted = await this.encryptionService.decryptFileWithKMS(
          {
            encryptedData: encryptedBuffer.toString('base64'),
            keyId: document.encryptionKeyId,
            keyVersion: document.encryptionKeyVersion || 1,
            iv: '', // IV is included in encryptedData for KMS
            authTag: '' // AuthTag is included in encryptedData for KMS
          },
          userId, // Use userId as tenantId
          'document-service'
        );

        // Convert decrypted buffer to stream
        decryptedStream = Readable.from(decrypted);

        logger.info('File decrypted with KMS', {
          documentId,
          keyId: document.encryptionKeyId
        });
      } else {
        // Legacy decryption (backward compatibility)
        decryptedStream = this.decryptStream(encryptedStream);
        logger.info('File decrypted with legacy method', { documentId });
      }

      return {
        stream: decryptedStream,
        filename: document.originalName,
        mimeType: document.mimeType
      };
    } catch (error) {
      logger.error('Error downloading document', { error, documentId });
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    try {
      // Verify document belongs to user
      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          userId
        }
      });

      if (!document) {
        throw new ValidationError('Document not found or access denied');
      }

      const objectName = `${userId}/${document.filename}`;

      // Delete from MinIO
      await this.minioClient.removeObject(this.bucketName, objectName);

      // Delete from database (cascade will delete analysis)
      await this.prisma.document.delete({
        where: { id: documentId }
      });

      logger.info('Document deleted', { documentId });
    } catch (error) {
      logger.error('Error deleting document', { error, documentId });
      throw error;
    }
  }

  /**
   * Get user's documents
   */
  async getUserDocuments(userId: string): Promise<PrismaDocument[]> {
    try {
      return await this.prisma.document.findMany({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
        include: {
          analysis: true
        }
      });
    } catch (error) {
      logger.error('Error getting user documents', { error, userId });
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  private async validateFile(file: Express.Multer.File): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: DocumentMetadata = {};

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check file extension matches MIME type
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedExtensions = this.getExpectedExtensions(file.mimetype);
    if (!expectedExtensions.includes(extension)) {
      warnings.push(`File extension ${extension} does not match MIME type ${file.mimetype}`);
    }

    // Check for suspicious filenames
    if (this.hasSuspiciousFilename(file.originalname)) {
      errors.push('Filename contains suspicious characters');
    }

    // Basic file content validation
    const contentValidation = this.validateFileContent(file.buffer, file.mimetype);
    if (!contentValidation.valid) {
      errors.push(contentValidation.error || 'Invalid file content');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata
    };
  }

  /**
   * Scan file for viruses using ClamAV
   */
  private async scanForViruses(buffer: Buffer): Promise<{ clean: boolean; threat?: string }> {
    try {
      const result = await this.clamAVService.scanBuffer(buffer);

      if (result.isInfected) {
        const threat = result.viruses?.join(', ') || 'Unknown threat';
        logger.warn('Virus detected in uploaded file', {
          threat,
          bufferSize: buffer.length
        });
        return { clean: false, threat };
      }

      logger.debug('File passed virus scan', { bufferSize: buffer.length });
      return { clean: true };
    } catch (error) {
      logger.error('Error during virus scan', { error });
      // Fail-open: Allow upload if scanning fails
      return { clean: true };
    }
  }

  /**
   * Generate secure filename
   */
  private generateSecureFilename(originalName: string): string {
    const extension = path.extname(originalName);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    return `${timestamp}-${randomString}${extension}`;
  }

  /**
   * Encrypt file content
   */
  private encryptFile(buffer: Buffer): Buffer {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(config.jwt.secret, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

    // Prepend IV to encrypted data
    return Buffer.concat([iv, encrypted]);
  }

  /**
   * Decrypt file stream
   */
  private decryptStream(encryptedStream: Readable): Readable {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(config.jwt.secret, 'salt', 32);

    let iv: Buffer | null = null;
    let ivCollected = false;

    const decryptStream = new Readable({
      read() { }
    });

    encryptedStream.on('data', (chunk: Buffer) => {
      if (!ivCollected) {
        // First 16 bytes are the IV
        if (chunk.length >= 16) {
          iv = chunk.slice(0, 16);
          const remaining = chunk.slice(16);
          ivCollected = true;

          if (iv) {
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            const decrypted = decipher.update(remaining);
            decryptStream.push(decrypted);
          }
        }
      } else if (iv) {
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        const decrypted = decipher.update(chunk);
        decryptStream.push(decrypted);
      }
    });

    encryptedStream.on('end', () => {
      decryptStream.push(null);
    });

    encryptedStream.on('error', (error) => {
      decryptStream.destroy(error);
    });

    return decryptStream;
  }

  /**
   * Extract metadata from file
   */
  private async extractMetadata(file: Express.Multer.File): Promise<DocumentMetadata> {
    const metadata: DocumentMetadata = {};

    try {
      // Extract metadata based on file type
      if (file.mimetype === 'application/pdf') {
        // Extract PDF metadata using pdf-parse
        const pdfData = await pdfParse(file.buffer);
        metadata.pageCount = pdfData.numpages;
        metadata.hasText = pdfData.text.length > 0;

        logger.info('PDF metadata extracted', {
          pages: metadata.pageCount,
          hasText: metadata.hasText,
          textLength: pdfData.text.length
        });
      } else if (file.mimetype.startsWith('image/')) {
        // Extract image metadata using sharp
        try {
          // Dynamic import to avoid issues when sharp is not installed
          const sharp = await import('sharp').catch(() => null);
          if (sharp) {
            const imageMetadata = await sharp.default(file.buffer).metadata();
            metadata.dimensions = {
              width: imageMetadata.width || 0,
              height: imageMetadata.height || 0
            };

            logger.info('Image metadata extracted', {
              width: metadata.dimensions.width,
              height: metadata.dimensions.height,
              format: imageMetadata.format
            });
          } else {
            logger.warn('Sharp module not available, skipping image metadata extraction');
          }
        } catch (error) {
          logger.warn('Failed to extract image metadata', { error });
        }
      }
    } catch (error) {
      logger.warn('Failed to extract metadata', { error, mimeType: file.mimetype });
      // Return empty metadata on error - don't fail the upload
    }

    return metadata;
  }

  /**
   * Get expected file extensions for MIME type
   */
  private getExpectedExtensions(mimeType: string): string[] {
    const mimeToExtension: Record<string, string[]> = {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    };

    return mimeToExtension[mimeType] || [];
  }

  /**
   * Check for suspicious filename patterns
   */
  private hasSuspiciousFilename(filename: string): boolean {
    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return true;
    }

    // Check for null bytes
    if (filename.includes('\0')) {
      return true;
    }

    // Check for excessively long filenames
    if (filename.length > 255) {
      return true;
    }

    return false;
  }

  /**
   * Validate file content matches MIME type
   */
  private validateFileContent(buffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
    // Check file signatures (magic numbers)
    const signatures: Record<string, Buffer[]> = {
      'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
      'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
      'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
      'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])],
      'application/msword': [Buffer.from([0xD0, 0xCF, 0x11, 0xE0])],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        Buffer.from([0x50, 0x4B, 0x03, 0x04]) // ZIP signature
      ]
    };

    const expectedSignatures = signatures[mimeType];
    if (!expectedSignatures) {
      return { valid: true }; // No signature check available
    }

    for (const signature of expectedSignatures) {
      if (buffer.slice(0, signature.length).equals(signature)) {
        return { valid: true };
      }
    }

    return {
      valid: false,
      error: 'File content does not match declared MIME type'
    };
  }

  /**
   * Get document by ID (with access check)
   */
  async getDocument(documentId: string, userId: string): Promise<PrismaDocument | null> {
    try {
      return await this.prisma.document.findFirst({
        where: {
          id: documentId,
          userId
        },
        include: {
          analysis: {
            include: {
              issues: true,
              recommendations: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error getting document', { error, documentId });
      throw error;
    }
  }

  /**
   * Get storage statistics for user
   */
  async getUserStorageStats(userId: string): Promise<{
    totalDocuments: number;
    totalSize: number;
    documentsByType: Record<string, number>;
  }> {
    try {
      const documents = await this.prisma.document.findMany({
        where: { userId },
        select: {
          size: true,
          documentType: true
        }
      });

      const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
      const documentsByType: Record<string, number> = {};

      documents.forEach(doc => {
        documentsByType[doc.documentType] = (documentsByType[doc.documentType] || 0) + 1;
      });

      return {
        totalDocuments: documents.length,
        totalSize,
        documentsByType
      };
    } catch (error) {
      logger.error('Error getting storage stats', { error, userId });
      throw error;
    }
  }
}
