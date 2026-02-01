"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const DocumentStorageService_1 = require("../services/DocumentStorageService");
const errorHandler_1 = require("../middleware/errorHandler");
jest.mock('../config/minio');
jest.mock('../utils/logger');
jest.mock('../services/ClamAVService');
describe('DocumentStorageService', () => {
    let service;
    const mockPrisma = {
        document: {
            create: jest.fn(),
            findFirst: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
    };
    const mockMinioClient = {
        putObject: jest.fn().mockResolvedValue({}),
        getObject: jest.fn(),
        removeObject: jest.fn().mockResolvedValue({}),
        bucketExists: jest.fn().mockResolvedValue(true),
        statObject: jest.fn().mockResolvedValue({ metaData: {} }),
    };
    // Mock ClamAVService with all used methods
    const mockClamAVService = {
        scanBuffer: jest.fn().mockResolvedValue({ isInfected: false }),
        isAvailable: jest.fn().mockResolvedValue(true),
        getVersion: jest.fn().mockResolvedValue('ClamAV 0.103.2'),
    };
    // Mock getMinioClient
    const minio = require('../config/minio');
    minio.getMinioClient = jest.fn().mockReturnValue(mockMinioClient);
    service = new DocumentStorageService_1.DocumentStorageService(mockPrisma, undefined, mockClamAVService);
    afterEach(() => {
        jest.clearAllMocks();
    });
    // ---------- uploadDocument tests ----------
    describe('uploadDocument', () => {
        const mockFile = {
            fieldname: 'file',
            originalname: 'test-document.pdf',
            encoding: '7bit',
            mimetype: 'application/pdf',
            size: 1024 * 100, // 100KB
            buffer: Buffer.from('%PDF-1.4 test content'),
            stream: null,
            destination: '',
            filename: '',
            path: '',
        };
        it('should upload a valid PDF document', async () => {
            const userId = 'user-123';
            const documentType = client_1.DocumentType.RENTAL_CONTRACT;
            mockPrisma.document.create.mockResolvedValue({
                id: 'doc-123',
                userId,
                caseId: null,
                filename: 'generated-filename.pdf',
                originalName: mockFile.originalname,
                mimeType: mockFile.mimetype,
                size: mockFile.size,
                documentType,
                uploadedAt: new Date(),
            });
            const result = await service.uploadDocument(userId, mockFile, documentType);
            expect(result).toBeDefined();
            expect(result.documentId).toBe('doc-123');
            expect(result.originalName).toBe('test-document.pdf');
            expect(result.mimeType).toBe('application/pdf');
            expect(mockMinioClient.putObject).toHaveBeenCalled();
            expect(mockPrisma.document.create).toHaveBeenCalled();
        });
        it('should reject file that exceeds max size', async () => {
            const largeFile = { ...mockFile, size: 20 * 1024 * 1024 };
            await expect(service.uploadDocument('user-123', largeFile, client_1.DocumentType.RENTAL_CONTRACT)).rejects.toThrow(errorHandler_1.ValidationError);
        });
        it('should reject file with invalid MIME type', async () => {
            const invalidFile = { ...mockFile, mimetype: 'application/x-executable', buffer: Buffer.from('MZ') };
            await expect(service.uploadDocument('user-123', invalidFile, client_1.DocumentType.RENTAL_CONTRACT)).rejects.toThrow(errorHandler_1.ValidationError);
        });
        it('should reject empty file', async () => {
            const emptyFile = { ...mockFile, size: 0, buffer: Buffer.from('') };
            await expect(service.uploadDocument('user-123', emptyFile, client_1.DocumentType.RENTAL_CONTRACT)).rejects.toThrow(errorHandler_1.ValidationError);
        });
        it('should reject file with suspicious filename', async () => {
            const suspiciousFile = { ...mockFile, originalname: '../../../etc/passwd' };
            await expect(service.uploadDocument('user-123', suspiciousFile, client_1.DocumentType.RENTAL_CONTRACT)).rejects.toThrow(errorHandler_1.ValidationError);
        });
        it('should reject file with mismatched content', async () => {
            const mismatchedFile = { ...mockFile, mimetype: 'application/pdf', buffer: Buffer.from('Not a PDF file') };
            await expect(service.uploadDocument('user-123', mismatchedFile, client_1.DocumentType.RENTAL_CONTRACT)).rejects.toThrow(errorHandler_1.ValidationError);
        });
        it('should upload image file', async () => {
            const imageFile = { ...mockFile, originalname: 'test-image.jpg', mimetype: 'image/jpeg', buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]) };
            mockPrisma.document.create.mockResolvedValue({
                id: 'doc-456',
                userId: 'user-123',
                caseId: null,
                filename: 'generated-filename.jpg',
                originalName: imageFile.originalname,
                mimeType: imageFile.mimetype,
                size: imageFile.size,
                documentType: client_1.DocumentType.OTHER,
                uploadedAt: new Date(),
            });
            const result = await service.uploadDocument('user-123', imageFile, client_1.DocumentType.OTHER);
            expect(result).toBeDefined();
            expect(result.mimeType).toBe('image/jpeg');
        });
        it('should associate document with case', async () => {
            const caseId = 'case-123';
            mockPrisma.document.create.mockResolvedValue({
                id: 'doc-789',
                userId: 'user-123',
                caseId,
                filename: 'generated-filename.pdf',
                originalName: mockFile.originalname,
                mimeType: mockFile.mimetype,
                size: mockFile.size,
                documentType: client_1.DocumentType.RENTAL_CONTRACT,
                uploadedAt: new Date(),
            });
            const result = await service.uploadDocument('user-123', mockFile, client_1.DocumentType.RENTAL_CONTRACT, caseId);
            expect(result).toBeDefined();
            expect(mockPrisma.document.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ caseId }) }));
        });
    });
    // ---------- downloadDocument tests ----------
    describe('downloadDocument', () => {
        it('should download document for authorized user', async () => {
            const documentId = 'doc-123';
            const userId = 'user-123';
            mockPrisma.document.findFirst.mockResolvedValue({
                id: documentId,
                userId,
                filename: 'test-file.pdf',
                originalName: 'original.pdf',
                mimeType: 'application/pdf',
                size: 1024,
                documentType: client_1.DocumentType.RENTAL_CONTRACT,
                uploadedAt: new Date(),
            });
            const mockStream = { on: jest.fn(), pipe: jest.fn() };
            mockMinioClient.getObject.mockResolvedValue(mockStream);
            const result = await service.downloadDocument(documentId, userId);
            expect(result).toBeDefined();
            expect(result.filename).toBe('original.pdf');
            expect(result.mimeType).toBe('application/pdf');
            expect(mockMinioClient.getObject).toHaveBeenCalled();
        });
        it('should reject download for unauthorized user', async () => {
            mockPrisma.document.findFirst.mockResolvedValue(null);
            await expect(service.downloadDocument('doc-123', 'wrong-user')).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
    // ---------- deleteDocument tests ----------
    describe('deleteDocument', () => {
        it('should delete document for authorized user', async () => {
            const documentId = 'doc-123';
            const userId = 'user-123';
            mockPrisma.document.findFirst.mockResolvedValue({
                id: documentId,
                userId,
                filename: 'test-file.pdf',
                originalName: 'original.pdf',
                mimeType: 'application/pdf',
                size: 1024,
                documentType: client_1.DocumentType.RENTAL_CONTRACT,
                uploadedAt: new Date(),
            });
            mockPrisma.document.delete.mockResolvedValue({});
            await service.deleteDocument(documentId, userId);
            expect(mockMinioClient.removeObject).toHaveBeenCalled();
            expect(mockPrisma.document.delete).toHaveBeenCalledWith({ where: { id: documentId } });
        });
        it('should reject delete for unauthorized user', async () => {
            mockPrisma.document.findFirst.mockResolvedValue(null);
            await expect(service.deleteDocument('doc-123', 'wrong-user')).rejects.toThrow(errorHandler_1.ValidationError);
        });
    });
    // ---------- getUserDocuments tests ----------
    describe('getUserDocuments', () => {
        it('should return all documents for user', async () => {
            const userId = 'user-123';
            const mockDocuments = [
                { id: 'doc-1', userId, filename: 'file1.pdf', originalName: 'original1.pdf', mimeType: 'application/pdf', size: 1024, documentType: client_1.DocumentType.RENTAL_CONTRACT, uploadedAt: new Date() },
                { id: 'doc-2', userId, filename: 'file2.pdf', originalName: 'original2.pdf', mimeType: 'application/pdf', size: 2048, documentType: client_1.DocumentType.UTILITY_BILL, uploadedAt: new Date() },
            ];
            mockPrisma.document.findMany.mockResolvedValue(mockDocuments);
            const result = await service.getUserDocuments(userId);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('doc-1');
            expect(result[1].id).toBe('doc-2');
        });
        it('should return empty array for user with no documents', async () => {
            mockPrisma.document.findMany.mockResolvedValue([]);
            const result = await service.getUserDocuments('user-123');
            expect(result).toHaveLength(0);
        });
    });
    // ---------- getUserStorageStats tests ----------
    describe('getUserStorageStats', () => {
        it('should calculate storage statistics correctly', async () => {
            const userId = 'user-123';
            const mockDocuments = [
                { size: 1024, documentType: client_1.DocumentType.RENTAL_CONTRACT },
                { size: 2048, documentType: client_1.DocumentType.RENTAL_CONTRACT },
                { size: 512, documentType: client_1.DocumentType.UTILITY_BILL },
            ];
            mockPrisma.document.findMany.mockResolvedValue(mockDocuments);
            const result = await service.getUserStorageStats(userId);
            expect(result.totalDocuments).toBe(3);
            expect(result.totalSize).toBe(3584);
            expect(result.documentsByType[client_1.DocumentType.RENTAL_CONTRACT]).toBe(2);
            expect(result.documentsByType[client_1.DocumentType.UTILITY_BILL]).toBe(1);
        });
        it('should return zero stats for user with no documents', async () => {
            mockPrisma.document.findMany.mockResolvedValue([]);
            const result = await service.getUserStorageStats('user-123');
            expect(result.totalDocuments).toBe(0);
            expect(result.totalSize).toBe(0);
            expect(Object.keys(result.documentsByType)).toHaveLength(0);
        });
    });
    // ---------- File Validation tests ----------
    describe('File Validation', () => {
        it('should validate PDF file signature', async () => {
            const pdfFile = {
                fieldname: 'file',
                originalname: 'test.pdf',
                encoding: '7bit',
                mimetype: 'application/pdf',
                size: 1024,
                buffer: Buffer.from('%PDF-1.4'),
                stream: null,
                destination: '',
                filename: '',
                path: '',
            };
            mockPrisma.document.create.mockResolvedValue({
                id: 'doc-123',
                userId: 'user-123',
                caseId: null,
                filename: 'test.pdf',
                originalName: pdfFile.originalname,
                mimeType: pdfFile.mimetype,
                size: pdfFile.size,
                documentType: client_1.DocumentType.OTHER,
                uploadedAt: new Date(),
            });
            const result = await service.uploadDocument('user-123', pdfFile, client_1.DocumentType.OTHER);
            expect(result).toBeDefined();
        });
        it('should validate JPEG file signature', async () => {
            const jpegFile = {
                fieldname: 'file',
                originalname: 'test.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                size: 1024,
                buffer: Buffer.from([0xFF, 0xD8, 0xFF]),
                stream: null,
                destination: '',
                filename: '',
                path: '',
            };
            mockPrisma.document.create.mockResolvedValue({
                id: 'doc-123',
                userId: 'user-123',
                caseId: null,
                filename: 'test.jpg',
                originalName: jpegFile.originalname,
                mimeType: jpegFile.mimetype,
                size: jpegFile.size,
                documentType: client_1.DocumentType.OTHER,
                uploadedAt: new Date(),
            });
            const result = await service.uploadDocument('user-123', jpegFile, client_1.DocumentType.OTHER);
            expect(result).toBeDefined();
        });
        it('should validate PNG file signature', async () => {
            const pngFile = {
                fieldname: 'file',
                originalname: 'test.png',
                encoding: '7bit',
                mimetype: 'image/png',
                size: 1024,
                buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47]),
                stream: null,
                destination: '',
                filename: '',
                path: '',
            };
            mockPrisma.document.create.mockResolvedValue({
                id: 'doc-123',
                userId: 'user-123',
                caseId: null,
                filename: 'test.png',
                originalName: pngFile.originalname,
                mimeType: pngFile.mimetype,
                size: pngFile.size,
                documentType: client_1.DocumentType.OTHER,
                uploadedAt: new Date(),
            });
            const result = await service.uploadDocument('user-123', pngFile, client_1.DocumentType.OTHER);
            expect(result).toBeDefined();
        });
    });
    // ---------- Virus Scanning tests ----------
    describe('Virus Scanning', () => {
        const mockFile = {
            fieldname: 'file',
            originalname: 'test-document.pdf',
            encoding: '7bit',
            mimetype: 'application/pdf',
            size: 1024 * 100,
            buffer: Buffer.from('%PDF-1.4 test content'),
            stream: null,
            destination: '',
            filename: '',
            path: '',
        };
        it('should scan file for viruses during upload', async () => {
            mockClamAVService.scanBuffer.mockResolvedValue({ isInfected: false });
            mockPrisma.document.create.mockResolvedValue({
                id: 'doc-123',
                userId: 'user-123',
                caseId: null,
                filename: 'test.pdf',
                originalName: mockFile.originalname,
                mimeType: mockFile.mimetype,
                size: mockFile.size,
                documentType: client_1.DocumentType.OTHER,
                uploadedAt: new Date(),
            });
            await service.uploadDocument('user-123', mockFile, client_1.DocumentType.OTHER);
            expect(mockClamAVService.scanBuffer).toHaveBeenCalledWith(mockFile.buffer);
        });
        it('should reject file when virus is detected', async () => {
            mockClamAVService.scanBuffer.mockResolvedValue({ isInfected: true, viruses: ['Eicar-Test-Signature'] });
            await expect(service.uploadDocument('user-123', mockFile, client_1.DocumentType.OTHER)).rejects.toThrow('File contains malicious content');
            expect(mockPrisma.document.create).not.toHaveBeenCalled();
        });
        it('should allow upload when ClamAV is unavailable (fail-open)', async () => {
            mockClamAVService.scanBuffer.mockResolvedValue({ isInfected: false });
            mockPrisma.document.create.mockResolvedValue({
                id: 'doc-123',
                userId: 'user-123',
                caseId: null,
                filename: 'test.pdf',
                originalName: mockFile.originalname,
                mimeType: mockFile.mimetype,
                size: mockFile.size,
                documentType: client_1.DocumentType.OTHER,
                uploadedAt: new Date(),
            });
            const result = await service.uploadDocument('user-123', mockFile, client_1.DocumentType.OTHER);
            expect(result).toBeDefined();
            expect(result.documentId).toBe('doc-123');
        });
        it('should handle virus scan errors gracefully', async () => {
            mockClamAVService.scanBuffer.mockRejectedValue(new Error('Scan timeout'));
            mockPrisma.document.create.mockResolvedValue({
                id: 'doc-123',
                userId: 'user-123',
                caseId: null,
                filename: 'test.pdf',
                originalName: mockFile.originalname,
                mimeType: mockFile.mimetype,
                size: mockFile.size,
                documentType: client_1.DocumentType.OTHER,
                uploadedAt: new Date(),
            });
            const result = await service.uploadDocument('user-123', mockFile, client_1.DocumentType.OTHER);
            expect(result).toBeDefined();
        });
    });
});
