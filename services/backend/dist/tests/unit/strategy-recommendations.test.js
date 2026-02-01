"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StrategyRecommendationsController_1 = require("../../controllers/StrategyRecommendationsController");
const client_1 = require("@prisma/client");
const recommendationEngine_1 = require("../../../../scripts/ml/recommendationEngine");
const enhancedStrategyRecommendations_1 = require("../../../../scripts/ml/enhancedStrategyRecommendations");
const documentSummarizer_1 = require("../../../../scripts/nlp/documentSummarizer");
// Mock the modules
jest.mock('@prisma/client');
jest.mock('../../utils/logger');
jest.mock('../../../../scripts/ml/recommendationEngine');
jest.mock('../../../../scripts/ml/enhancedStrategyRecommendations');
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
describe('StrategyRecommendationsController', () => {
    let prisma;
    beforeEach(() => {
        prisma = new client_1.PrismaClient();
        prisma.document = {
            findUnique: jest.fn(),
            findMany: jest.fn()
        };
        prisma.recommendation = {
            create: jest.fn()
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('generateDocumentRecommendations', () => {
        it('should generate recommendations for a document successfully', async () => {
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
                summary: 'Document summary',
                confidence: 0.8,
                entities: { totalEntities: 5 },
                topics: [{ name: 'Mietvertrag' }]
            });
            // Mock recommendation creation
            prisma.recommendation.create.mockResolvedValue({
                id: 'rec123',
                documentId: 'doc123',
                userId: 'user123',
                strategy: 'Document-based strategy: Document summary',
                confidence: 0.8
            });
            await StrategyRecommendationsController_1.StrategyRecommendationsController.generateDocumentRecommendations(req, res, next);
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
            expect(prisma.recommendation.create).toHaveBeenCalledWith({
                data: {
                    documentId: 'doc123',
                    userId: 'user123',
                    strategy: 'Document-based strategy: Document summary',
                    confidence: 0.8,
                    recommendations: {
                        create: [
                            {
                                id: "document_review",
                                title: "Dokumentenüberprüfung",
                                description: "Gründliche Überprüfung des Dokuments auf rechtliche Aspekte",
                                priority: "high",
                                confidence: 0.8
                            },
                            {
                                id: "entity_analysis",
                                title: "Entitätenanalyse",
                                description: "Analyse der identifizierten Entitäten: 5 gefunden",
                                priority: "medium",
                                confidence: 0.8
                            }
                        ]
                    }
                }
            });
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    id: 'rec123',
                    documentId: 'doc123',
                    userId: 'user123',
                    strategy: 'Document-based strategy: Document summary',
                    confidence: 0.8
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
            await StrategyRecommendationsController_1.StrategyRecommendationsController.generateDocumentRecommendations(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Document not found'
            }));
        });
    });
    describe('generateCaseRecommendations', () => {
        it('should generate recommendations for a case successfully', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();
            req.params.caseId = 'case123';
            req.body = {
                clientData: { id: 'client123' },
                lawyerData: { id: 'lawyer123' },
                riskAssessment: { score: 0.6 },
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
            // Mock recommendation generation
            recommendationEngine_1.generateRecommendations.mockReturnValue({
                strategy: 'Case strategy',
                confidence: 0.7,
                recommendations: [
                    {
                        id: 'rec1',
                        title: 'Recommendation 1',
                        description: 'Description 1',
                        priority: 'high',
                        confidence: 0.7
                    }
                ]
            });
            // Mock recommendation creation
            prisma.recommendation.create.mockResolvedValue({
                id: 'rec123',
                caseId: 'case123',
                userId: 'user123',
                strategy: 'Case strategy',
                confidence: 0.7
            });
            await StrategyRecommendationsController_1.StrategyRecommendationsController.generateCaseRecommendations(req, res, next);
            expect(prisma.document.findMany).toHaveBeenCalledWith({
                where: {
                    caseId: 'case123',
                    userId: 'user123'
                }
            });
            expect(recommendationEngine_1.generateRecommendations).toHaveBeenCalledWith({
                id: 'case123',
                documents: [
                    {
                        id: 'doc123',
                        content: 'Sample document content',
                        type: 'RENTAL_CONTRACT'
                    }
                ]
            }, { id: 'client123' }, { id: 'lawyer123' });
            expect(prisma.recommendation.create).toHaveBeenCalledWith({
                data: {
                    caseId: 'case123',
                    userId: 'user123',
                    strategy: 'Case strategy',
                    confidence: 0.7,
                    recommendations: {
                        create: [
                            {
                                id: 'rec1',
                                title: 'Recommendation 1',
                                description: 'Description 1',
                                priority: 'high',
                                confidence: 0.7
                            }
                        ]
                    }
                }
            });
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    id: 'rec123',
                    caseId: 'case123',
                    userId: 'user123',
                    strategy: 'Case strategy',
                    confidence: 0.7
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
            await StrategyRecommendationsController_1.StrategyRecommendationsController.generateCaseRecommendations(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: 'No documents found for this case'
            }));
        });
    });
    describe('generateEnhancedCaseRecommendations', () => {
        it('should generate enhanced recommendations for a case successfully', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();
            req.params.caseId = 'case123';
            req.body = {
                clientData: { id: 'client123' },
                lawyerData: { id: 'lawyer123' },
                riskAssessment: { score: 0.6 },
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
            // Mock enhanced recommendation generation
            enhancedStrategyRecommendations_1.generateEnhancedStrategyRecommendations.mockReturnValue({
                strategy: 'Enhanced case strategy',
                confidence: 0.9,
                recommendations: [
                    {
                        id: 'en_rec1',
                        title: 'Enhanced Recommendation 1',
                        description: 'Enhanced Description 1',
                        priority: 'high',
                        confidence: 0.9
                    }
                ]
            });
            // Mock recommendation creation
            prisma.recommendation.create.mockResolvedValue({
                id: 'rec123',
                caseId: 'case123',
                userId: 'user123',
                strategy: 'Enhanced case strategy',
                confidence: 0.9,
                isEnhanced: true
            });
            await StrategyRecommendationsController_1.StrategyRecommendationsController.generateEnhancedCaseRecommendations(req, res, next);
            expect(prisma.document.findMany).toHaveBeenCalledWith({
                where: {
                    caseId: 'case123',
                    userId: 'user123'
                }
            });
            expect(enhancedStrategyRecommendations_1.generateEnhancedStrategyRecommendations).toHaveBeenCalledWith({
                id: 'case123',
                documents: [
                    {
                        id: 'doc123',
                        content: 'Sample document content',
                        type: 'RENTAL_CONTRACT'
                    }
                ]
            }, { id: 'client123' }, { id: 'lawyer123' }, { score: 0.6 }, { cases: [] });
            expect(prisma.recommendation.create).toHaveBeenCalledWith({
                data: {
                    caseId: 'case123',
                    userId: 'user123',
                    strategy: 'Enhanced case strategy',
                    confidence: 0.9,
                    isEnhanced: true,
                    recommendations: {
                        create: [
                            {
                                id: 'en_rec1',
                                title: 'Enhanced Recommendation 1',
                                description: 'Enhanced Description 1',
                                priority: 'high',
                                confidence: 0.9
                            }
                        ]
                    }
                }
            });
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    id: 'rec123',
                    caseId: 'case123',
                    userId: 'user123',
                    strategy: 'Enhanced case strategy',
                    confidence: 0.9,
                    isEnhanced: true
                }
            });
        });
    });
});
