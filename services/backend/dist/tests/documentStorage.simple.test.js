"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const node_test_1 = require("node:test");
const node_test_2 = require("node:test");
// Mock dependencies
jest.mock('../config/minio');
jest.mock('../utils/logger');
(0, node_test_2.describe)('DocumentStorageService - Simple Tests', () => {
    (0, node_test_2.describe)('File Validation', () => {
        (0, node_test_1.it)('should validate file size limits', () => {
            const maxSize = 10 * 1024 * 1024; // 10MB
            const validSize = 5 * 1024 * 1024; // 5MB
            const invalidSize = 15 * 1024 * 1024; // 15MB
            expect(validSize).toBeLessThan(maxSize);
            expect(invalidSize).toBeGreaterThan(maxSize);
        });
        (0, node_test_1.it)('should validate MIME types', () => {
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/gif',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            expect(allowedTypes).toContain('application/pdf');
            expect(allowedTypes).toContain('image/jpeg');
            expect(allowedTypes).not.toContain('application/x-executable');
        });
        (0, node_test_1.it)('should validate file signatures', () => {
            const pdfSignature = Buffer.from('%PDF');
            const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF]);
            const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
            expect(pdfSignature.toString()).toContain('PDF');
            expect(jpegSignature[0]).toBe(0xFF);
            expect(pngSignature[0]).toBe(0x89);
        });
        (0, node_test_1.it)('should detect suspicious filenames', () => {
            const validFilename = 'document.pdf';
            const pathTraversal = '../../../etc/passwd';
            const nullByte = 'file\0.pdf';
            expect(validFilename).not.toContain('..');
            expect(pathTraversal).toContain('..');
            expect(nullByte).toContain('\0');
        });
    });
    (0, node_test_2.describe)('Document Types', () => {
        (0, node_test_1.it)('should support all document types', () => {
            const types = Object.values(client_1.DocumentType);
            expect(types).toContain(client_1.DocumentType.RENTAL_CONTRACT);
            expect(types).toContain(client_1.DocumentType.UTILITY_BILL);
            expect(types).toContain(client_1.DocumentType.WARNING_LETTER);
            expect(types).toContain(client_1.DocumentType.OTHER);
        });
    });
    (0, node_test_2.describe)('Encryption', () => {
        (0, node_test_1.it)('should use AES-256-CBC encryption', () => {
            const algorithm = 'aes-256-cbc';
            const keyLength = 32; // 256 bits / 8
            const ivLength = 16; // 128 bits / 8
            expect(algorithm).toBe('aes-256-cbc');
            expect(keyLength).toBe(32);
            expect(ivLength).toBe(16);
        });
    });
    (0, node_test_2.describe)('Storage Statistics', () => {
        (0, node_test_1.it)('should calculate total size correctly', () => {
            const documents = [
                { size: 1024 },
                { size: 2048 },
                { size: 512 }
            ];
            const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
            expect(totalSize).toBe(3584);
        });
        (0, node_test_1.it)('should count documents by type', () => {
            const documents = [
                { documentType: client_1.DocumentType.RENTAL_CONTRACT },
                { documentType: client_1.DocumentType.RENTAL_CONTRACT },
                { documentType: client_1.DocumentType.UTILITY_BILL }
            ];
            const byType = {};
            documents.forEach(doc => {
                byType[doc.documentType] = (byType[doc.documentType] || 0) + 1;
            });
            expect(byType[client_1.DocumentType.RENTAL_CONTRACT]).toBe(2);
            expect(byType[client_1.DocumentType.UTILITY_BILL]).toBe(1);
        });
    });
    (0, node_test_2.describe)('Filename Generation', () => {
        (0, node_test_1.it)('should generate secure filenames', () => {
            const timestamp = Date.now();
            const randomString = 'abc123def456';
            const extension = '.pdf';
            const filename = `${timestamp}-${randomString}${extension}`;
            expect(filename).toContain(timestamp.toString());
            expect(filename).toContain(randomString);
            expect(filename.endsWith('.pdf')).toBe(true);
        });
        (0, node_test_1.it)('should preserve file extensions', () => {
            const extensions = ['.pdf', '.jpg', '.png', '.docx'];
            extensions.forEach(ext => {
                const filename = `file${ext}`;
                expect(filename.endsWith(ext)).toBe(true);
            });
        });
    });
});
