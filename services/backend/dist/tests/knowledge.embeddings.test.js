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
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const client_1 = require("@prisma/client");
const KnowledgeService_1 = require("../services/KnowledgeService");
const OpenAIServiceModule = __importStar(require("../services/OpenAIService"));
// Mock dependencies
vitest_1.vi.mock('../config/redis', () => ({
    redis: {
        get: vitest_1.vi.fn(),
        set: vitest_1.vi.fn(),
        del: vitest_1.vi.fn(),
        getClient: vitest_1.vi.fn(() => ({
            keys: vitest_1.vi.fn().mockResolvedValue([]),
            del: vitest_1.vi.fn()
        }))
    }
}));
vitest_1.vi.mock('../utils/logger', () => ({
    logger: {
        info: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        debug: vitest_1.vi.fn()
    },
    loggers: {
        businessEvent: vitest_1.vi.fn()
    }
}));
vitest_1.vi.mock('../services/OpenAIService', () => ({
    openaiService: {
        isConfigured: vitest_1.vi.fn(),
        generateLegalContentEmbedding: vitest_1.vi.fn()
    }
}));
(0, vitest_1.describe)('KnowledgeService - Embeddings Generation', () => {
    let prisma;
    let knowledgeService;
    let mockOpenAIService;
    (0, vitest_1.beforeEach)(() => {
        prisma = new client_1.PrismaClient();
        knowledgeService = new KnowledgeService_1.KnowledgeService(prisma);
        mockOpenAIService = OpenAIServiceModule.openaiService;
        // Reset all mocks
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.afterEach)(async () => {
        await prisma.$disconnect();
    });
    (0, vitest_1.describe)('generateEmbeddings', () => {
        (0, vitest_1.it)('should generate embeddings when OpenAI is configured', async () => {
            // Arrange
            const title = 'BGB § 535 - Inhalt und Hauptpflichten des Mietvertrags';
            const content = 'Durch den Mietvertrag wird der Vermieter verpflichtet...';
            const mockEmbeddings = new Array(1536).fill(0).map(() => Math.random());
            mockOpenAIService.isConfigured.mockReturnValue(true);
            mockOpenAIService.generateLegalContentEmbedding.mockResolvedValue(mockEmbeddings);
            // Mock Prisma methods
            vitest_1.vi.spyOn(prisma.legalKnowledge, 'findUnique').mockResolvedValue(null);
            vitest_1.vi.spyOn(prisma.legalKnowledge, 'create').mockResolvedValue({
                id: 'test-id',
                reference: 'BGB § 535',
                title,
                content,
                type: 'LAW',
                jurisdiction: 'DE',
                effectiveDate: new Date(),
                lastUpdated: new Date(),
                tags: [],
                embeddings: mockEmbeddings
            });
            // Mock Elasticsearch
            const mockElasticsearch = {
                index: vitest_1.vi.fn().mockResolvedValue({})
            };
            knowledgeService.elasticsearch = mockElasticsearch;
            // Act
            const result = await knowledgeService.addLegalContent({
                reference: 'BGB § 535',
                title,
                content,
                type: 'LAW',
                jurisdiction: 'DE',
                effectiveDate: new Date(),
                tags: ['Mietrecht', 'BGB']
            });
            // Assert
            (0, vitest_1.expect)(mockOpenAIService.isConfigured).toHaveBeenCalled();
            (0, vitest_1.expect)(mockOpenAIService.generateLegalContentEmbedding).toHaveBeenCalledWith(title, content);
            (0, vitest_1.expect)(result.embeddings).toEqual(mockEmbeddings);
            (0, vitest_1.expect)(result.embeddings.length).toBe(1536);
        });
        (0, vitest_1.it)('should return empty array when OpenAI is not configured', async () => {
            // Arrange
            const title = 'BGB § 535';
            const content = 'Test content';
            mockOpenAIService.isConfigured.mockReturnValue(false);
            // Mock Prisma methods
            vitest_1.vi.spyOn(prisma.legalKnowledge, 'findUnique').mockResolvedValue(null);
            vitest_1.vi.spyOn(prisma.legalKnowledge, 'create').mockResolvedValue({
                id: 'test-id',
                reference: 'BGB § 535',
                title,
                content,
                type: 'LAW',
                jurisdiction: 'DE',
                effectiveDate: new Date(),
                lastUpdated: new Date(),
                tags: [],
                embeddings: []
            });
            // Mock Elasticsearch
            const mockElasticsearch = {
                index: vitest_1.vi.fn().mockResolvedValue({})
            };
            knowledgeService.elasticsearch = mockElasticsearch;
            // Act
            const result = await knowledgeService.addLegalContent({
                reference: 'BGB § 535',
                title,
                content,
                type: 'LAW',
                jurisdiction: 'DE',
                effectiveDate: new Date()
            });
            // Assert
            (0, vitest_1.expect)(mockOpenAIService.isConfigured).toHaveBeenCalled();
            (0, vitest_1.expect)(mockOpenAIService.generateLegalContentEmbedding).not.toHaveBeenCalled();
            (0, vitest_1.expect)(result.embeddings).toEqual([]);
        });
        (0, vitest_1.it)('should handle OpenAI API errors gracefully', async () => {
            // Arrange
            const title = 'BGB § 535';
            const content = 'Test content';
            mockOpenAIService.isConfigured.mockReturnValue(true);
            mockOpenAIService.generateLegalContentEmbedding.mockRejectedValue(new Error('OpenAI API Error'));
            // Mock Prisma methods
            vitest_1.vi.spyOn(prisma.legalKnowledge, 'findUnique').mockResolvedValue(null);
            vitest_1.vi.spyOn(prisma.legalKnowledge, 'create').mockResolvedValue({
                id: 'test-id',
                reference: 'BGB § 535',
                title,
                content,
                type: 'LAW',
                jurisdiction: 'DE',
                effectiveDate: new Date(),
                lastUpdated: new Date(),
                tags: [],
                embeddings: []
            });
            // Mock Elasticsearch
            const mockElasticsearch = {
                index: vitest_1.vi.fn().mockResolvedValue({})
            };
            knowledgeService.elasticsearch = mockElasticsearch;
            // Act
            const result = await knowledgeService.addLegalContent({
                reference: 'BGB § 535',
                title,
                content,
                type: 'LAW',
                jurisdiction: 'DE',
                effectiveDate: new Date()
            });
            // Assert
            (0, vitest_1.expect)(mockOpenAIService.generateLegalContentEmbedding).toHaveBeenCalled();
            (0, vitest_1.expect)(result.embeddings).toEqual([]);
        });
        (0, vitest_1.it)('should generate embeddings with correct dimensions', async () => {
            // Arrange
            const title = 'Test Legal Content';
            const content = 'This is test legal content for embeddings generation.';
            const mockEmbeddings = new Array(1536).fill(0).map((_, i) => i / 1536);
            mockOpenAIService.isConfigured.mockReturnValue(true);
            mockOpenAIService.generateLegalContentEmbedding.mockResolvedValue(mockEmbeddings);
            // Mock Prisma methods
            vitest_1.vi.spyOn(prisma.legalKnowledge, 'findUnique').mockResolvedValue(null);
            vitest_1.vi.spyOn(prisma.legalKnowledge, 'create').mockResolvedValue({
                id: 'test-id',
                reference: 'TEST-001',
                title,
                content,
                type: 'LAW',
                jurisdiction: 'DE',
                effectiveDate: new Date(),
                lastUpdated: new Date(),
                tags: [],
                embeddings: mockEmbeddings
            });
            // Mock Elasticsearch
            const mockElasticsearch = {
                index: vitest_1.vi.fn().mockResolvedValue({})
            };
            knowledgeService.elasticsearch = mockElasticsearch;
            // Act
            const result = await knowledgeService.addLegalContent({
                reference: 'TEST-001',
                title,
                content,
                type: 'LAW',
                jurisdiction: 'DE',
                effectiveDate: new Date()
            });
            // Assert
            (0, vitest_1.expect)(result.embeddings).toHaveLength(1536);
            (0, vitest_1.expect)(result.embeddings[0]).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(result.embeddings[1535]).toBeLessThanOrEqual(1);
        });
        (0, vitest_1.it)('should call OpenAI with combined title and content', async () => {
            // Arrange
            const title = 'Legal Title';
            const content = 'Legal Content';
            const mockEmbeddings = new Array(1536).fill(0.5);
            mockOpenAIService.isConfigured.mockReturnValue(true);
            mockOpenAIService.generateLegalContentEmbedding.mockResolvedValue(mockEmbeddings);
            // Mock Prisma methods
            vitest_1.vi.spyOn(prisma.legalKnowledge, 'findUnique').mockResolvedValue(null);
            vitest_1.vi.spyOn(prisma.legalKnowledge, 'create').mockResolvedValue({
                id: 'test-id',
                reference: 'TEST-002',
                title,
                content,
                type: 'LAW',
                jurisdiction: 'DE',
                effectiveDate: new Date(),
                lastUpdated: new Date(),
                tags: [],
                embeddings: mockEmbeddings
            });
            // Mock Elasticsearch
            const mockElasticsearch = {
                index: vitest_1.vi.fn().mockResolvedValue({})
            };
            knowledgeService.elasticsearch = mockElasticsearch;
            // Act
            await knowledgeService.addLegalContent({
                reference: 'TEST-002',
                title,
                content,
                type: 'LAW',
                jurisdiction: 'DE',
                effectiveDate: new Date()
            });
            // Assert
            (0, vitest_1.expect)(mockOpenAIService.generateLegalContentEmbedding).toHaveBeenCalledWith(title, content);
        });
    });
});
