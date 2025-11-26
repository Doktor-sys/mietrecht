import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { KnowledgeService } from '../services/KnowledgeService';
import * as OpenAIServiceModule from '../services/OpenAIService';

// Mock dependencies
vi.mock('../config/redis', () => ({
    redis: {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
        getClient: vi.fn(() => ({
            keys: vi.fn().mockResolvedValue([]),
            del: vi.fn()
        }))
    }
}));

vi.mock('../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn()
    },
    loggers: {
        businessEvent: vi.fn()
    }
}));

vi.mock('../services/OpenAIService', () => ({
    openaiService: {
        isConfigured: vi.fn(),
        generateLegalContentEmbedding: vi.fn()
    }
}));

describe('KnowledgeService - Embeddings Generation', () => {
    let prisma: PrismaClient;
    let knowledgeService: KnowledgeService;
    let mockOpenAIService: any;

    beforeEach(() => {
        prisma = new PrismaClient();
        knowledgeService = new KnowledgeService(prisma);
        mockOpenAIService = OpenAIServiceModule.openaiService;

        // Reset all mocks
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await prisma.$disconnect();
    });

    describe('generateEmbeddings', () => {
        it('should generate embeddings when OpenAI is configured', async () => {
            // Arrange
            const title = 'BGB § 535 - Inhalt und Hauptpflichten des Mietvertrags';
            const content = 'Durch den Mietvertrag wird der Vermieter verpflichtet...';
            const mockEmbeddings = new Array(1536).fill(0).map(() => Math.random());

            mockOpenAIService.isConfigured.mockReturnValue(true);
            mockOpenAIService.generateLegalContentEmbedding.mockResolvedValue(mockEmbeddings);

            // Mock Prisma methods
            vi.spyOn(prisma.legalKnowledge, 'findUnique').mockResolvedValue(null);
            vi.spyOn(prisma.legalKnowledge, 'create').mockResolvedValue({
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
            } as any);

            // Mock Elasticsearch
            const mockElasticsearch = {
                index: vi.fn().mockResolvedValue({})
            };
            (knowledgeService as any).elasticsearch = mockElasticsearch;

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
            expect(mockOpenAIService.isConfigured).toHaveBeenCalled();
            expect(mockOpenAIService.generateLegalContentEmbedding).toHaveBeenCalledWith(title, content);
            expect(result.embeddings).toEqual(mockEmbeddings);
            expect(result.embeddings.length).toBe(1536);
        });

        it('should return empty array when OpenAI is not configured', async () => {
            // Arrange
            const title = 'BGB § 535';
            const content = 'Test content';

            mockOpenAIService.isConfigured.mockReturnValue(false);

            // Mock Prisma methods
            vi.spyOn(prisma.legalKnowledge, 'findUnique').mockResolvedValue(null);
            vi.spyOn(prisma.legalKnowledge, 'create').mockResolvedValue({
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
            } as any);

            // Mock Elasticsearch
            const mockElasticsearch = {
                index: vi.fn().mockResolvedValue({})
            };
            (knowledgeService as any).elasticsearch = mockElasticsearch;

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
            expect(mockOpenAIService.isConfigured).toHaveBeenCalled();
            expect(mockOpenAIService.generateLegalContentEmbedding).not.toHaveBeenCalled();
            expect(result.embeddings).toEqual([]);
        });

        it('should handle OpenAI API errors gracefully', async () => {
            // Arrange
            const title = 'BGB § 535';
            const content = 'Test content';

            mockOpenAIService.isConfigured.mockReturnValue(true);
            mockOpenAIService.generateLegalContentEmbedding.mockRejectedValue(
                new Error('OpenAI API Error')
            );

            // Mock Prisma methods
            vi.spyOn(prisma.legalKnowledge, 'findUnique').mockResolvedValue(null);
            vi.spyOn(prisma.legalKnowledge, 'create').mockResolvedValue({
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
            } as any);

            // Mock Elasticsearch
            const mockElasticsearch = {
                index: vi.fn().mockResolvedValue({})
            };
            (knowledgeService as any).elasticsearch = mockElasticsearch;

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
            expect(mockOpenAIService.generateLegalContentEmbedding).toHaveBeenCalled();
            expect(result.embeddings).toEqual([]);
        });

        it('should generate embeddings with correct dimensions', async () => {
            // Arrange
            const title = 'Test Legal Content';
            const content = 'This is test legal content for embeddings generation.';
            const mockEmbeddings = new Array(1536).fill(0).map((_, i) => i / 1536);

            mockOpenAIService.isConfigured.mockReturnValue(true);
            mockOpenAIService.generateLegalContentEmbedding.mockResolvedValue(mockEmbeddings);

            // Mock Prisma methods
            vi.spyOn(prisma.legalKnowledge, 'findUnique').mockResolvedValue(null);
            vi.spyOn(prisma.legalKnowledge, 'create').mockResolvedValue({
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
            } as any);

            // Mock Elasticsearch
            const mockElasticsearch = {
                index: vi.fn().mockResolvedValue({})
            };
            (knowledgeService as any).elasticsearch = mockElasticsearch;

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
            expect(result.embeddings).toHaveLength(1536);
            expect(result.embeddings[0]).toBeGreaterThanOrEqual(0);
            expect(result.embeddings[1535]).toBeLessThanOrEqual(1);
        });

        it('should call OpenAI with combined title and content', async () => {
            // Arrange
            const title = 'Legal Title';
            const content = 'Legal Content';
            const mockEmbeddings = new Array(1536).fill(0.5);

            mockOpenAIService.isConfigured.mockReturnValue(true);
            mockOpenAIService.generateLegalContentEmbedding.mockResolvedValue(mockEmbeddings);

            // Mock Prisma methods
            vi.spyOn(prisma.legalKnowledge, 'findUnique').mockResolvedValue(null);
            vi.spyOn(prisma.legalKnowledge, 'create').mockResolvedValue({
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
            } as any);

            // Mock Elasticsearch
            const mockElasticsearch = {
                index: vi.fn().mockResolvedValue({})
            };
            (knowledgeService as any).elasticsearch = mockElasticsearch;

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
            expect(mockOpenAIService.generateLegalContentEmbedding).toHaveBeenCalledWith(
                title,
                content
            );
        });
    });
});
