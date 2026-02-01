"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DocumentAnalysisService_1 = require("services/DocumentAnalysisService");
const OCRService_1 = __importDefault(require("services/OCRService"));
// Mock PrismaClient
const mockPrisma = {
    document: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
    documentAnalysis: {
        create: jest.fn(),
        findUnique: jest.fn(),
    },
};
const mockDocument = {
    id: 'doc-1',
    userId: 'user-1',
    type: 'RENTAL_CONTRACT',
    filename: 'contract.pdf',
    mimeType: 'application/pdf',
    size: 1000,
    storageKey: 'key-1',
    createdAt: new Date(),
    updatedAt: new Date()
};
const mockExtractedData = {
    landlordName: 'Max Mustermann',
    tenantName: 'Erika Musterfrau',
    address: 'Musterstraße 1, 12345 Berlin',
    rentAmount: 1500,
    squareMeters: 50,
    deposit: 3000
};
describe('DocumentAnalysisService', () => {
    let service;
    beforeEach(() => {
        jest.clearAllMocks();
        service = new DocumentAnalysisService_1.DocumentAnalysisService(mockPrisma);
        mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
        jest.spyOn(OCRService_1.default, 'extractRentalContractData').mockReturnValue(mockExtractedData);
        mockPrisma.documentAnalysis.create.mockResolvedValue({});
    });
    it('should detect excessive rent', async () => {
        const analysis = await service.analyzeDocument('doc-1');
        expect(analysis.documentType).toBe('RENTAL_CONTRACT');
        expect(analysis.issues.length).toBeGreaterThan(0);
        const rentIssue = analysis.issues.find((i) => i.type === 'excessive_rent');
        expect(rentIssue).toBeDefined();
        expect(rentIssue?.severity).toBe('warning');
    });
    it('should detect excessive deposit', async () => {
        const mockDocument2 = {
            id: 'doc-2',
            userId: 'user-1',
            type: 'RENTAL_CONTRACT',
            filename: 'contract.pdf',
            mimeType: 'application/pdf',
            size: 1000,
            storageKey: 'key-2',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const mockExtractedData2 = {
            landlordName: 'Max Mustermann',
            tenantName: 'Erika Musterfrau',
            rentAmount: 1000,
            deposit: 4000 // More than 3x rent
        };
        mockPrisma.document.findUnique.mockResolvedValue(mockDocument2);
        jest.spyOn(OCRService_1.default, 'extractRentalContractData').mockReturnValue(mockExtractedData2);
        const analysis = await service.analyzeDocument('doc-2');
        const depositIssue = analysis.issues.find((i) => i.type === 'excessive_deposit');
        expect(depositIssue).toBeDefined();
        expect(depositIssue?.legalBasis).toBe('§ 551 BGB');
    });
    it('should detect missing mandatory fields', async () => {
        const mockDocument3 = {
            id: 'doc-3',
            userId: 'user-1',
            type: 'RENTAL_CONTRACT',
            filename: 'contract.pdf',
            mimeType: 'application/pdf',
            size: 1000,
            storageKey: 'key-3',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const mockExtractedData3 = {
            landlordName: 'Max Mustermann'
            // Missing other mandatory fields
        };
        mockPrisma.document.findUnique.mockResolvedValue(mockDocument3);
        jest.spyOn(OCRService_1.default, 'extractRentalContractData').mockReturnValue(mockExtractedData3);
        const analysis = await service.analyzeDocument('doc-3');
        const missingFieldsIssue = analysis.issues.find((i) => i.type === 'missing_information');
        expect(missingFieldsIssue).toBeDefined();
    });
    // Additional test suites for utility bills, warning letters, etc. can remain unchanged
});
