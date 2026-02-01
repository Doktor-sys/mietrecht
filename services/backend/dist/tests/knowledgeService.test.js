"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const KnowledgeService_1 = require("../services/KnowledgeService");
const client_1 = require("@prisma/client");
const elasticsearch_1 = require("@elastic/elasticsearch");
const config_1 = require("../config/config");
// Mock dependencies
jest.mock('@prisma/client');
jest.mock('@elastic/elasticsearch');
jest.mock('../utils/logger');
jest.mock('../config/redis', () => ({
    redis: {
        getClient: jest.fn().mockReturnValue({
            keys: jest.fn().mockResolvedValue([]),
            del: jest.fn().mockResolvedValue(1)
        })
    }
}));
describe('KnowledgeService', () => {
    let service;
    let prismaMock;
    let elasticMock;
    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        // Setup Prisma mock
        prismaMock = {
            legalKnowledge: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                count: jest.fn()
            }
        };
        client_1.PrismaClient.mockImplementation(() => prismaMock);
        // Setup Elasticsearch mock
        elasticMock = {
            indices: {
                exists: jest.fn(),
                create: jest.fn()
            },
            index: jest.fn(),
            search: jest.fn(),
            delete: jest.fn(),
            ping: jest.fn()
        };
        elasticsearch_1.Client.mockImplementation(() => elasticMock);
        service = new KnowledgeService_1.KnowledgeService(new client_1.PrismaClient());
    });
    describe('initializeIndex', () => {
        it('should create index if it does not exist', async () => {
            elasticMock.indices.exists.mockResolvedValue(false);
            elasticMock.indices.create.mockResolvedValue({});
            await service.initializeIndex();
            expect(elasticMock.indices.exists).toHaveBeenCalledWith({ index: config_1.config.elasticsearch.index });
            expect(elasticMock.indices.create).toHaveBeenCalled();
        });
        it('should not create index if it already exists', async () => {
            elasticMock.indices.exists.mockResolvedValue(true);
            await service.initializeIndex();
            expect(elasticMock.indices.exists).toHaveBeenCalled();
            expect(elasticMock.indices.create).not.toHaveBeenCalled();
        });
    });
    describe('addLegalContent', () => {
        const mockData = {
            reference: 'BGB-123',
            title: 'Test Law',
            content: 'Test Content',
            type: client_1.LegalType.LAW,
            jurisdiction: 'DE',
            effectiveDate: new Date()
        };
        it('should add new legal content successfully', async () => {
            prismaMock.legalKnowledge.findUnique.mockResolvedValue(null);
            prismaMock.legalKnowledge.create.mockResolvedValue({ ...mockData, id: '1' });
            elasticMock.index.mockResolvedValue({});
            const result = await service.addLegalContent(mockData);
            expect(prismaMock.legalKnowledge.create).toHaveBeenCalled();
            expect(elasticMock.index).toHaveBeenCalled();
            expect(result).toBeDefined();
        });
        it('should throw error if reference already exists', async () => {
            prismaMock.legalKnowledge.findUnique.mockResolvedValue({ id: '1' });
            await expect(service.addLegalContent(mockData))
                .rejects.toThrow('Rechtstext mit Referenz BGB-123 existiert bereits');
        });
    });
    describe('searchLegalContent', () => {
        it('should return search results', async () => {
            const mockHits = [
                {
                    _id: '1',
                    _source: { title: 'Test' },
                    _score: 1.5,
                    highlight: {}
                }
            ];
            elasticMock.search.mockResolvedValue({
                hits: {
                    total: { value: 1 },
                    hits: mockHits
                }
            });
            const result = await service.searchLegalContent('query', {});
            expect(elasticMock.search).toHaveBeenCalled();
            expect(result.results).toHaveLength(1);
            expect(result.total).toBe(1);
        });
    });
    describe('getLegalText', () => {
        it('should return legal text by reference', async () => {
            const mockText = { id: '1', reference: 'REF-1' };
            prismaMock.legalKnowledge.findUnique.mockResolvedValue(mockText);
            const result = await service.getLegalText('REF-1');
            expect(result).toEqual({ ...mockText, relatedLaws: [] });
        });
        it('should return null if not found', async () => {
            prismaMock.legalKnowledge.findUnique.mockResolvedValue(null);
            const result = await service.getLegalText('REF-1');
            expect(result).toBeNull();
        });
    });
    describe('healthCheck', () => {
        it('should return true for both when healthy', async () => {
            elasticMock.ping.mockResolvedValue(true);
            prismaMock.legalKnowledge.count.mockResolvedValue(1);
            const result = await service.healthCheck();
            expect(result.elasticsearch).toBe(true);
            expect(result.database).toBe(true);
        });
        it('should return false when services are down', async () => {
            elasticMock.ping.mockRejectedValue(new Error('Down'));
            prismaMock.legalKnowledge.count.mockRejectedValue(new Error('Down'));
            const result = await service.healthCheck();
            expect(result.elasticsearch).toBe(false);
            expect(result.database).toBe(false);
        });
    });
});
