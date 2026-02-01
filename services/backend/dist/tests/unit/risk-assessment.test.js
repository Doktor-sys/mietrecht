"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RiskAssessmentController_1 = require("../../controllers/RiskAssessmentController");
const client_1 = require("@prisma/client");
const advancedRiskAssessment_1 = require("../../../../scripts/ml/advancedRiskAssessment");
const caseAnalyzer_1 = require("../../../../scripts/ml/caseAnalyzer");
const clientProfiler_1 = require("../../../../scripts/ml/clientProfiler");
const documentSummarizer_1 = require("../../../../scripts/nlp/documentSummarizer");
// Mock the modules
jest.mock('@prisma/client');
jest.mock('../../utils/logger');
jest.mock('../../../../scripts/ml/advancedRiskAssessment');
jest.mock('../../../../scripts/ml/caseAnalyzer');
jest.mock('../../../../scripts/ml/clientProfiler');
jest.mock('../../../../scripts/nlp/documentSummarizer');
// Mock the express request and response objects
const mockRequest = () => {
    const req = {};
    req.user = { id: 'user123' };
    req.params = {};
    req.body = {};
    return req;
};
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const mockNext = () => jest.fn();
describe('RiskAssessmentController', () => {
    let prisma;
    beforeEach(() => {
        prisma = new client_1.PrismaClient();
        prisma.document = {
            findUnique: jest.fn(),
            findMany: jest.fn()
        };
        prisma.riskAssessment = {
            create: jest.fn()
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('assessDocumentRisk', () => {
        it('should assess risk for a document successfully', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();
            req.params.documentId = 'doc123';
            // Mock document retrieval
            prisma.document.findUnique.mockResolvedValue({
                id: 'doc123',
                metadata: { textContent: 'Sample document content' },
                documentType: 'RENTAL_CONTRACT'
            });
            // Mock document summarization
            documentSummarizer_1.summarizeLegalDocument.mockReturnValue({
                confidence: 0.8,
                entities: { totalEntities: 5 },
                topics: ['Mietvertrag', 'Kündigung']
            });
            // Mock risk assessment creation
            prisma.riskAssessment.create.mockResolvedValue({
                id: 'risk123',
                documentId: 'doc123',
                userId: 'user123',
                riskScore: 0.7,
                riskLevel: 'high'
            });
            await RiskAssessmentController_1.RiskAssessmentController.assessDocumentRisk(req, res, next);
            expect(prisma.document.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 'doc123',
                    userId: 'user123'
                },
                include: {
                    analysis: true
                }
            });
            expect(documentSummarizer_1.summarizeLegalDocument).toHaveBeenCalledWith({
                id: 'doc123',
                content: 'Sample document content',
                type: 'RENTAL_CONTRACT'
            });
            expect(prisma.riskAssessment.create).toHaveBeenCalledWith({
                data: {
                    documentId: 'doc123',
                    userId: 'user123',
                    riskScore: 0.7,
                    riskLevel: 'high',
                    details: {
                        summary: {
                            confidence: 0.8,
                            entities: { totalEntities: 5 },
                            topics: ['Mietvertrag', 'Kündigung']
                        },
                        confidence: 0.8
                    }
                }
            });
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    id: 'risk123',
                    documentId: 'doc123',
                    userId: 'user123',
                    riskScore: 0.7,
                    riskLevel: 'high'
                }
            });
        });
        it('should handle document not found error', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();
            req.params.documentId = 'doc123';
            // Mock document not found
            prisma.document.findUnique.mockResolvedValue(null);
            await RiskAssessmentController_1.RiskAssessmentController.assessDocumentRisk(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Document not found'
            }));
        });
    });
    describe('assessCaseRisk', () => {
        it('should assess risk for a case successfully', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();
            req.params.caseId = 'case123';
            req.body = {
                clientData: { id: 'client123' },
                historicalData: { cases: [] }
            };
            // Mock document retrieval
            prisma.document.findMany.mockResolvedValue([
                {
                    id: 'doc123',
                    metadata: { textContent: 'Sample document content' },
                    documentType: 'RENTAL_CONTRACT'
                }
            ]);
            // Mock case analysis
            caseAnalyzer_1.analyzeCase.mockReturnValue({
                riskScore: 0.6
            });
            // Mock client profile creation
            clientProfiler_1.createClientProfile.mockReturnValue({
                id: 'client123',
                riskTolerance: 'medium'
            });
            // Mock risk assessment creation
            prisma.riskAssessment.create.mockResolvedValue({
                id: 'risk123',
                caseId: 'case123',
                userId: 'user123',
                riskScore: 0.6,
                riskLevel: 'medium'
            });
            await RiskAssessmentController_1.RiskAssessmentController.assessCaseRisk(req, res, next);
            expect(prisma.document.findMany).toHaveBeenCalledWith({
                where: {
                    caseId: 'case123',
                    userId: 'user123'
                }
            });
            expect(caseAnalyzer_1.analyzeCase).toHaveBeenCalledWith({
                id: 'case123',
                documents: [
                    {
                        id: 'doc123',
                        content: 'Sample document content',
                        type: 'RENTAL_CONTRACT'
                    }
                ]
            });
            expect(prisma.riskAssessment.create).toHaveBeenCalledWith({
                data: {
                    caseId: 'case123',
                    userId: 'user123',
                    riskScore: 0.6,
                    riskLevel: 'medium',
                    details: {
                        caseAnalysis: {
                            riskScore: 0.6
                        },
                        clientProfile: {
                            id: 'client123',
                            riskTolerance: 'medium'
                        }
                    }
                }
            });
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    id: 'risk123',
                    caseId: 'case123',
                    userId: 'user123',
                    riskScore: 0.6,
                    riskLevel: 'medium'
                }
            });
        });
        it('should handle no documents found error', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();
            req.params.caseId = 'case123';
            // Mock no documents found
            prisma.document.findMany.mockResolvedValue([]);
            await RiskAssessmentController_1.RiskAssessmentController.assessCaseRisk(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: 'No documents found for this case'
            }));
        });
    });
    describe('assessEnhancedCaseRisk', () => {
        it('should assess enhanced risk for a case successfully', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();
            req.params.caseId = 'case123';
            req.body = {
                clientData: { id: 'client123' },
                historicalData: { cases: [] }
            };
            // Mock document retrieval
            prisma.document.findMany.mockResolvedValue([
                {
                    id: 'doc123',
                    metadata: { textContent: 'Sample document content' },
                    documentType: 'RENTAL_CONTRACT'
                }
            ]);
            // Mock enhanced risk assessment
            advancedRiskAssessment_1.assessEnhancedCaseRisk.mockResolvedValue({
                riskScore: 0.8,
                riskLevel: 'high',
                confidence: 0.9
            });
            // Mock risk assessment creation
            prisma.riskAssessment.create.mockResolvedValue({
                id: 'risk123',
                caseId: 'case123',
                userId: 'user123',
                riskScore: 0.8,
                riskLevel: 'high',
                isEnhanced: true
            });
            await RiskAssessmentController_1.RiskAssessmentController.assessEnhancedCaseRisk(req, res, next);
            expect(prisma.document.findMany).toHaveBeenCalledWith({
                where: {
                    caseId: 'case123',
                    userId: 'user123'
                }
            });
            expect(advancedRiskAssessment_1.assessEnhancedCaseRisk).toHaveBeenCalledWith({
                id: 'case123',
                documents: [
                    {
                        id: 'doc123',
                        content: 'Sample document content',
                        type: 'RENTAL_CONTRACT'
                    }
                ]
            }, { id: 'client123' }, { cases: [] });
            expect(prisma.riskAssessment.create).toHaveBeenCalledWith({
                data: {
                    caseId: 'case123',
                    userId: 'user123',
                    riskScore: 0.8,
                    riskLevel: 'high',
                    isEnhanced: true,
                    details: {
                        riskScore: 0.8,
                        riskLevel: 'high',
                        confidence: 0.9
                    }
                }
            });
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    id: 'risk123',
                    caseId: 'case123',
                    userId: 'user123',
                    riskScore: 0.8,
                    riskLevel: 'high',
                    isEnhanced: true
                }
            });
        });
    });
});
