import { PrismaClient, Document as PrismaDocument, DocumentType as PrismaDocumentType } from '@prisma/client';
import { Readable } from 'stream';
import { EncryptionServiceWithKMS } from './EncryptionService';
import { ClamAVService } from './ClamAVService';
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
export declare class DocumentStorageService {
    private prisma;
    private minioClient;
    private bucketName;
    private maxFileSize;
    private allowedMimeTypes;
    private encryptionService?;
    private clamAVService;
    constructor(prisma: PrismaClient, encryptionService?: EncryptionServiceWithKMS, clamAVService?: ClamAVService);
    /**
     * Upload a document with validation and virus scanning
     */
    uploadDocument(userId: string, file: Express.Multer.File, documentType: PrismaDocumentType, caseId?: string, parentId?: string): Promise<UploadResult>;
    /**
     * Get document versions
     */
    getDocumentVersions(documentId: string, userId: string): Promise<PrismaDocument[]>;
    /**
     * Get current version of a document
     */
    getCurrentDocument(documentId: string, userId: string): Promise<PrismaDocument | null>;
    /**
     * Download a document
     */
    downloadDocument(documentId: string, userId: string): Promise<{
        stream: Readable;
        filename: string;
        mimeType: string;
    }>;
    /**
     * Delete a document
     */
    deleteDocument(documentId: string, userId: string): Promise<void>;
    /**
     * Get user's documents
     */
    getUserDocuments(userId: string): Promise<PrismaDocument[]>;
    /**
     * Validate file before upload
     */
    private validateFile;
    /**
     * Scan file for viruses using ClamAV
     */
    private scanForViruses;
    /**
     * Generate secure filename
     */
    private generateSecureFilename;
    /**
     * Encrypt file content
     */
    private encryptFile;
    /**
     * Decrypt file stream
     */
    private decryptStream;
    /**
     * Extract metadata from file
     */
    private extractMetadata;
    /**
     * Get expected file extensions for MIME type
     */
    private getExpectedExtensions;
    /**
     * Check for suspicious filename patterns
     */
    private hasSuspiciousFilename;
    /**
     * Validate file content matches MIME type
     */
    private validateFileContent;
    /**
     * Get document by ID (with access check)
     */
    getDocument(documentId: string, userId: string): Promise<PrismaDocument | null>;
    /**
     * Get storage statistics for user
     */
    getUserStorageStats(userId: string): Promise<{
        totalDocuments: number;
        totalSize: number;
        documentsByType: Record<string, number>;
    }>;
}
