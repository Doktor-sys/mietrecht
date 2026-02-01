"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentStorageService = void 0;
const minio_1 = require("../config/minio");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const stream_1 = require("stream");
const ClamAVService_1 = require("./ClamAVService");
const kms_1 = require("../types/kms");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
class DocumentStorageService {
    constructor(prisma, encryptionService, clamAVService) {
        this.prisma = prisma;
        this.minioClient = (0, minio_1.getMinioClient)();
        this.bucketName = config_1.config.minio.bucketName;
        this.maxFileSize = config_1.config.upload.maxFileSize;
        this.allowedMimeTypes = config_1.config.upload.allowedMimeTypes;
        this.encryptionService = encryptionService;
        this.clamAVService = clamAVService || new ClamAVService_1.ClamAVService();
    }
    /**
     * Upload a document with validation and virus scanning
     */
    async uploadDocument(userId, file, documentType, caseId, parentId) {
        try {
            logger_1.logger.info('Starting document upload', {
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
                throw new errorHandler_1.ValidationError(`File validation failed: ${validation.errors.join(', ')}`);
            }
            // Step 2: Scan for viruses (placeholder - would integrate with ClamAV or similar)
            const virusScanResult = await this.scanForViruses(file.buffer);
            if (!virusScanResult.clean) {
                throw new errorHandler_1.ValidationError('File contains malicious content');
            }
            // Step 3: Generate secure filename
            const filename = this.generateSecureFilename(file.originalname);
            const objectName = `${userId}/${filename}`;
            // Step 4: Encrypt and upload to MinIO
            let encryptedBuffer;
            let encryptionKeyId;
            let encryptionKeyVersion;
            // Use KMS if available, otherwise fall back to legacy encryption
            if (this.encryptionService) {
                const encrypted = await this.encryptionService.encryptFileWithKMS(file.buffer, userId, // Use userId as tenantId for now
                kms_1.KeyPurpose.DOCUMENT_ENCRYPTION, 'document-service');
                encryptedBuffer = Buffer.from(encrypted.encryptedData, 'base64');
                encryptionKeyId = encrypted.keyId;
                encryptionKeyVersion = encrypted.keyVersion;
                logger_1.logger.info('File encrypted with KMS', {
                    objectName,
                    keyId: encryptionKeyId,
                    keyVersion: encryptionKeyVersion
                });
            }
            else {
                // Legacy encryption (backward compatibility)
                encryptedBuffer = this.encryptFile(file.buffer);
                logger_1.logger.warn('Using legacy encryption (KMS not available)', { objectName });
            }
            await this.minioClient.putObject(this.bucketName, objectName, encryptedBuffer, encryptedBuffer.length, {
                'Content-Type': file.mimetype,
                'X-Original-Name': Buffer.from(file.originalname).toString('base64'),
                'X-User-Id': userId,
                'X-Document-Type': documentType,
                'X-Encrypted': 'true',
                'X-Encryption-Type': this.encryptionService ? 'kms' : 'legacy',
                ...(encryptionKeyId && { 'X-Encryption-Key-Id': encryptionKeyId }),
                ...(encryptionKeyVersion && { 'X-Encryption-Key-Version': encryptionKeyVersion.toString() })
            });
            logger_1.logger.info('File uploaded to MinIO', { objectName });
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
            logger_1.logger.info('Document record created', { documentId: document.id });
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
        }
        catch (error) {
            logger_1.logger.error('Error uploading document', { error, userId });
            throw error;
        }
    }
    /**
     * Get document versions
     */
    async getDocumentVersions(documentId, userId) {
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
                throw new errorHandler_1.ValidationError('Document not found or access denied');
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
        }
        catch (error) {
            logger_1.logger.error('Error getting document versions', { error, documentId });
            throw error;
        }
    }
    /**
     * Get current version of a document
     */
    async getCurrentDocument(documentId, userId) {
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
        }
        catch (error) {
            logger_1.logger.error('Error getting current document', { error, documentId });
            throw error;
        }
    }
    /**
     * Download a document
     */
    async downloadDocument(documentId, userId) {
        try {
            // Verify document belongs to user
            const document = await this.prisma.document.findFirst({
                where: {
                    id: documentId,
                    userId
                }
            });
            if (!document) {
                throw new errorHandler_1.ValidationError('Document not found or access denied');
            }
            const objectName = `${userId}/${document.filename}`;
            // Get encrypted file from MinIO
            const encryptedStream = await this.minioClient.getObject(this.bucketName, objectName);
            // Get object metadata to check encryption type
            const stat = await this.minioClient.statObject(this.bucketName, objectName);
            const encryptionType = stat.metaData?.['x-encryption-type'] || 'legacy';
            let decryptedStream;
            // Use KMS decryption if available and document was encrypted with KMS
            if (this.encryptionService && encryptionType === 'kms' && document.encryptionKeyId) {
                // Convert stream to buffer for KMS decryption
                const chunks = [];
                for await (const chunk of encryptedStream) {
                    chunks.push(chunk);
                }
                const encryptedBuffer = Buffer.concat(chunks);
                const decrypted = await this.encryptionService.decryptFileWithKMS({
                    encryptedData: encryptedBuffer.toString('base64'),
                    keyId: document.encryptionKeyId,
                    keyVersion: document.encryptionKeyVersion || 1,
                    iv: '', // IV is included in encryptedData for KMS
                    authTag: '' // AuthTag is included in encryptedData for KMS
                }, userId, // Use userId as tenantId
                'document-service');
                // Convert decrypted buffer to stream
                decryptedStream = stream_1.Readable.from(decrypted);
                logger_1.logger.info('File decrypted with KMS', {
                    documentId,
                    keyId: document.encryptionKeyId
                });
            }
            else {
                // Legacy decryption (backward compatibility)
                decryptedStream = this.decryptStream(encryptedStream);
                logger_1.logger.info('File decrypted with legacy method', { documentId });
            }
            return {
                stream: decryptedStream,
                filename: document.originalName,
                mimeType: document.mimeType
            };
        }
        catch (error) {
            logger_1.logger.error('Error downloading document', { error, documentId });
            throw error;
        }
    }
    /**
     * Delete a document
     */
    async deleteDocument(documentId, userId) {
        try {
            // Verify document belongs to user
            const document = await this.prisma.document.findFirst({
                where: {
                    id: documentId,
                    userId
                }
            });
            if (!document) {
                throw new errorHandler_1.ValidationError('Document not found or access denied');
            }
            const objectName = `${userId}/${document.filename}`;
            // Delete from MinIO
            await this.minioClient.removeObject(this.bucketName, objectName);
            // Delete from database (cascade will delete analysis)
            await this.prisma.document.delete({
                where: { id: documentId }
            });
            logger_1.logger.info('Document deleted', { documentId });
        }
        catch (error) {
            logger_1.logger.error('Error deleting document', { error, documentId });
            throw error;
        }
    }
    /**
     * Get user's documents
     */
    async getUserDocuments(userId) {
        try {
            return await this.prisma.document.findMany({
                where: { userId },
                orderBy: { uploadedAt: 'desc' },
                include: {
                    analysis: true
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting user documents', { error, userId });
            throw error;
        }
    }
    /**
     * Validate file before upload
     */
    async validateFile(file) {
        const errors = [];
        const warnings = [];
        const metadata = {};
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
        const extension = path_1.default.extname(file.originalname).toLowerCase();
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
    async scanForViruses(buffer) {
        try {
            const result = await this.clamAVService.scanBuffer(buffer);
            if (result.isInfected) {
                const threat = result.viruses?.join(', ') || 'Unknown threat';
                logger_1.logger.warn('Virus detected in uploaded file', {
                    threat,
                    bufferSize: buffer.length
                });
                return { clean: false, threat };
            }
            logger_1.logger.debug('File passed virus scan', { bufferSize: buffer.length });
            return { clean: true };
        }
        catch (error) {
            logger_1.logger.error('Error during virus scan', { error });
            // Fail-open: Allow upload if scanning fails
            return { clean: true };
        }
    }
    /**
     * Generate secure filename
     */
    generateSecureFilename(originalName) {
        const extension = path_1.default.extname(originalName);
        const timestamp = Date.now();
        const randomString = crypto_1.default.randomBytes(16).toString('hex');
        return `${timestamp}-${randomString}${extension}`;
    }
    /**
     * Encrypt file content
     */
    encryptFile(buffer) {
        const algorithm = 'aes-256-cbc';
        const key = crypto_1.default.scryptSync(config_1.config.jwt.secret, 'salt', 32);
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
        // Prepend IV to encrypted data
        return Buffer.concat([iv, encrypted]);
    }
    /**
     * Decrypt file stream
     */
    decryptStream(encryptedStream) {
        const algorithm = 'aes-256-cbc';
        const key = crypto_1.default.scryptSync(config_1.config.jwt.secret, 'salt', 32);
        let iv = null;
        let ivCollected = false;
        const decryptStream = new stream_1.Readable({
            read() { }
        });
        encryptedStream.on('data', (chunk) => {
            if (!ivCollected) {
                // First 16 bytes are the IV
                if (chunk.length >= 16) {
                    iv = chunk.slice(0, 16);
                    const remaining = chunk.slice(16);
                    ivCollected = true;
                    if (iv) {
                        const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
                        const decrypted = decipher.update(remaining);
                        decryptStream.push(decrypted);
                    }
                }
            }
            else if (iv) {
                const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
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
    async extractMetadata(file) {
        const metadata = {};
        try {
            // Extract metadata based on file type
            if (file.mimetype === 'application/pdf') {
                // Extract PDF metadata using pdf-parse
                const pdfData = await (0, pdf_parse_1.default)(file.buffer);
                metadata.pageCount = pdfData.numpages;
                metadata.hasText = pdfData.text.length > 0;
                logger_1.logger.info('PDF metadata extracted', {
                    pages: metadata.pageCount,
                    hasText: metadata.hasText,
                    textLength: pdfData.text.length
                });
            }
            else if (file.mimetype.startsWith('image/')) {
                // Extract image metadata using sharp
                try {
                    // Dynamic import to avoid issues when sharp is not installed
                    const sharp = await Promise.resolve().then(() => __importStar(require('sharp'))).catch(() => null);
                    if (sharp) {
                        const imageMetadata = await sharp.default(file.buffer).metadata();
                        metadata.dimensions = {
                            width: imageMetadata.width || 0,
                            height: imageMetadata.height || 0
                        };
                        logger_1.logger.info('Image metadata extracted', {
                            width: metadata.dimensions.width,
                            height: metadata.dimensions.height,
                            format: imageMetadata.format
                        });
                    }
                    else {
                        logger_1.logger.warn('Sharp module not available, skipping image metadata extraction');
                    }
                }
                catch (error) {
                    logger_1.logger.warn('Failed to extract image metadata', { error });
                }
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to extract metadata', { error, mimeType: file.mimetype });
            // Return empty metadata on error - don't fail the upload
        }
        return metadata;
    }
    /**
     * Get expected file extensions for MIME type
     */
    getExpectedExtensions(mimeType) {
        const mimeToExtension = {
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
    hasSuspiciousFilename(filename) {
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
    validateFileContent(buffer, mimeType) {
        // Check file signatures (magic numbers)
        const signatures = {
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
    async getDocument(documentId, userId) {
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
        }
        catch (error) {
            logger_1.logger.error('Error getting document', { error, documentId });
            throw error;
        }
    }
    /**
     * Get storage statistics for user
     */
    async getUserStorageStats(userId) {
        try {
            const documents = await this.prisma.document.findMany({
                where: { userId },
                select: {
                    size: true,
                    documentType: true
                }
            });
            const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
            const documentsByType = {};
            documents.forEach(doc => {
                documentsByType[doc.documentType] = (documentsByType[doc.documentType] || 0) + 1;
            });
            return {
                totalDocuments: documents.length,
                totalSize,
                documentsByType
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting storage stats', { error, userId });
            throw error;
        }
    }
}
exports.DocumentStorageService = DocumentStorageService;
