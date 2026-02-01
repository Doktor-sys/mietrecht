"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
const uuid_1 = require("uuid");
const node_test_1 = require("node:test");
const node_test_2 = require("node:test");
// Mock Services
jest.mock('../services/DocumentAnalysisService');
jest.mock('../services/AIResponseGenerator');
jest.mock('../services/TemplateService');
jest.mock('../services/LawyerMatchingService');
jest.mock('../services/BulkProcessingService');
jest.mock('../services/AnalyticsService');
// Mock Prisma Client
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        organization: {
            create: jest.fn(),
            delete: jest.fn(),
        },
        apiKey: {
            create: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        apiRequest: {
            deleteMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
        },
        chatInteraction: {
            create: jest.fn(),
        },
        templateGeneration: {
            create: jest.fn(),
        },
        document: {
            count: jest.fn(),
            create: jest.fn(),
        },
        batchJob: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        webhook: {
            upsert: jest.fn(),
        },
        $disconnect: jest.fn(),
    })),
}));
const mockPrisma = new (require('@prisma/client').PrismaClient)();
(0, node_test_2.describe)('B2B API', () => {
    let testOrganization;
    let testApiKey;
    let validApiKey;
    beforeAll(async () => {
        // Mock Test-Organisation
        testOrganization = {
            id: 'test-org-id',
            name: 'Test Organization',
            plan: 'professional',
            isActive: true,
        };
        // Mock Test-API-Key
        validApiKey = `sk_test_${(0, uuid_1.v4)().replace(/-/g, '')}`;
        testApiKey = {
            id: 'test-api-key-id',
            key: validApiKey,
            name: 'Test API Key',
            organizationId: testOrganization.id,
            permissions: ['*'],
            rateLimit: 1000,
            quotaLimit: 10000,
            quotaUsed: 0,
            isActive: true,
            expiresAt: null,
            lastUsedAt: null,
            organization: testOrganization,
        };
        // Setup mocks
        mockPrisma.apiKey.findUnique.mockResolvedValue(testApiKey);
        mockPrisma.apiKey.update.mockResolvedValue(testApiKey);
        mockPrisma.apiRequest.count.mockResolvedValue(0);
        mockPrisma.apiRequest.create.mockResolvedValue({});
        mockPrisma.chatInteraction.create.mockResolvedValue({});
        mockPrisma.templateGeneration.create.mockResolvedValue({});
        mockPrisma.document.count.mockResolvedValue(0);
        mockPrisma.document.create.mockResolvedValue({
            id: 'test-doc-id',
            filename: 'test.pdf',
        });
        mockPrisma.webhook.upsert.mockResolvedValue({
            id: 'webhook-id',
            url: 'https://example.com/webhook',
            events: ['document.analyzed'],
            secret: 'webhook-secret',
        });
        mockPrisma.batchJob.findFirst.mockResolvedValue({
            id: 'bulk-job-id',
            organizationId: testOrganization.id,
        });
        mockPrisma.batchJob.findMany.mockResolvedValue([]);
        mockPrisma.batchJob.count.mockResolvedValue(0);
        // Mock Services
        const { DocumentAnalysisService } = require('../services/DocumentAnalysisService');
        const { AIResponseGenerator } = require('../services/AIResponseGenerator');
        const { TemplateService } = require('../services/TemplateService');
        const { LawyerMatchingService } = require('../services/LawyerMatchingService');
        const { BulkProcessingService } = require('../services/BulkProcessingService');
        const { AnalyticsService } = require('../services/AnalyticsService');
        DocumentAnalysisService.prototype.analyzeDocument = jest.fn().mockResolvedValue({
            riskLevel: 'medium',
            confidence: 0.85,
            issues: ['Test issue'],
            recommendations: ['Test recommendation'],
            extractedData: { test: 'data' },
        });
        AIResponseGenerator.prototype.generateResponse = jest.fn().mockResolvedValue({
            message: 'Test AI response',
            confidence: 0.9,
            legalReferences: ['BGB §123'],
            escalationRecommended: false,
        });
        TemplateService.prototype.generateDocument = jest.fn().mockResolvedValue({
            content: 'Generated template content',
            instructions: 'Template instructions',
        });
        LawyerMatchingService.prototype.searchLawyers = jest.fn().mockResolvedValue({
            lawyers: [
                {
                    id: 'lawyer-1',
                    name: 'Test Lawyer',
                    location: 'Berlin',
                    specializations: ['rent_law'],
                    rating: 4.5,
                    reviewCount: 10,
                    hourlyRate: 150,
                    availableSlots: [],
                },
            ],
            total: 1,
        });
        BulkProcessingService.prototype.startBulkJob = jest.fn().mockResolvedValue('bulk-job-id');
        BulkProcessingService.prototype.getBulkJobStatus = jest.fn().mockResolvedValue({
            id: 'bulk-job-id',
            status: 'completed',
            totalItems: 2,
            processedItems: 2,
        });
        BulkProcessingService.prototype.cancelBulkJob = jest.fn().mockResolvedValue(true);
        AnalyticsService.prototype.generateAnalytics = jest.fn().mockResolvedValue({
            metrics: { apiRequests: 100 },
        });
        AnalyticsService.prototype.generateUsageReport = jest.fn().mockResolvedValue({
            report: 'usage report',
        });
        AnalyticsService.prototype.exportAnalytics = jest.fn().mockResolvedValue('exported data');
    });
    afterAll(async () => {
        // Cleanup mocks
        jest.clearAllMocks();
    });
    (0, node_test_2.describe)('Authentication', () => {
        (0, node_test_1.it)('should reject requests without API key', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/b2b/status')
                .expect(401);
            expect(response.body.error).toBe('API key required');
        });
        (0, node_test_1.it)('should reject requests with invalid API key', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/b2b/status')
                .set('X-API-Key', 'invalid_key')
                .expect(401);
            expect(response.body.error).toBe('Invalid API key');
        });
        (0, node_test_1.it)('should accept requests with valid API key', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/b2b/status')
                .set('X-API-Key', validApiKey)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('active');
        });
    });
    (0, node_test_2.describe)('API Status', () => {
        (0, node_test_1.it)('should return API status and limits', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/b2b/status')
                .set('X-API-Key', validApiKey)
                .expect(200);
            expect(response.body.data).toHaveProperty('apiKey');
            expect(response.body.data).toHaveProperty('rateLimit');
            expect(response.body.data).toHaveProperty('quota');
            expect(response.body.data.apiKey.name).toBe('Test API Key');
            expect(response.body.data.rateLimit.limit).toBe(1000);
            expect(response.body.data.quota.limit).toBe(10000);
        });
    });
    (0, node_test_2.describe)('Chat Query', () => {
        (0, node_test_1.it)('should process chat query successfully', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/b2b/chat/query')
                .set('X-API-Key', validApiKey)
                .send({
                query: 'Kann ich die Miete wegen defekter Heizung mindern?',
                sessionId: 'test-session-123',
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('response');
            expect(response.body.data).toHaveProperty('confidence');
            expect(response.body.data).toHaveProperty('legalReferences');
        });
        (0, node_test_1.it)('should reject empty query', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/b2b/chat/query')
                .set('X-API-Key', validApiKey)
                .send({
                query: '',
            })
                .expect(400);
            expect(response.body.errors).toBeDefined();
        });
        (0, node_test_1.it)('should reject query that is too long', async () => {
            const longQuery = 'a'.repeat(5001);
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/b2b/chat/query')
                .set('X-API-Key', validApiKey)
                .send({
                query: longQuery,
            })
                .expect(400);
            expect(response.body.errors).toBeDefined();
        });
    });
    (0, node_test_2.describe)('Template Generation', () => {
        (0, node_test_1.it)('should generate template successfully', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/b2b/templates/generate')
                .set('X-API-Key', validApiKey)
                .send({
                templateType: 'rent_reduction_letter',
                data: {
                    tenantName: 'Max Mustermann',
                    landlordName: 'Vermieter GmbH',
                    address: 'Musterstraße 1, 12345 Berlin',
                    issue: 'Defekte Heizung',
                    reductionAmount: 150,
                },
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('content');
            expect(response.body.data).toHaveProperty('templateType');
            expect(response.body.data.templateType).toBe('rent_reduction_letter');
        });
        (0, node_test_1.it)('should reject invalid template type', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/b2b/templates/generate')
                .set('X-API-Key', validApiKey)
                .send({
                templateType: '',
                data: {},
            })
                .expect(400);
            expect(response.body.errors).toBeDefined();
        });
    });
    (0, node_test_2.describe)('Lawyer Search', () => {
        (0, node_test_1.it)('should search lawyers successfully', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/b2b/lawyers/search')
                .set('X-API-Key', validApiKey)
                .query({
                location: 'Berlin',
                specialization: 'rent_law',
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('lawyers');
            expect(response.body.data).toHaveProperty('total');
            expect(Array.isArray(response.body.data.lawyers)).toBe(true);
        });
        (0, node_test_1.it)('should handle search without parameters', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/b2b/lawyers/search')
                .set('X-API-Key', validApiKey)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('lawyers');
        });
    });
    (0, node_test_2.describe)('Usage Analytics', () => {
        (0, node_test_1.it)('should return usage analytics', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/b2b/analytics/usage')
                .set('X-API-Key', validApiKey)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('metrics');
            expect(response.body.data).toHaveProperty('quota');
            expect(response.body.data.metrics).toHaveProperty('apiRequests');
            expect(response.body.data.metrics).toHaveProperty('documentAnalyses');
        });
        (0, node_test_1.it)('should accept different time periods', async () => {
            const periods = ['day', 'week', 'month'];
            for (const period of periods) {
                const response = await (0, supertest_1.default)(index_1.default)
                    .get('/api/b2b/analytics/usage')
                    .set('X-API-Key', validApiKey)
                    .query({ period })
                    .expect(200);
                expect(response.body.data.period).toBe(period);
            }
        });
    });
    (0, node_test_2.describe)('Batch Analysis', () => {
        (0, node_test_1.it)('should create batch job successfully', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/b2b/analyze/batch')
                .set('X-API-Key', validApiKey)
                .send({
                documents: [
                    {
                        id: 'doc1',
                        type: 'rental_contract',
                        url: 'https://example.com/doc1.pdf',
                    },
                    {
                        id: 'doc2',
                        type: 'utility_bill',
                        url: 'https://example.com/doc2.pdf',
                    },
                ],
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('batchJobId');
            expect(response.body.data).toHaveProperty('status');
            expect(response.body.data.status).toBe('pending');
            expect(response.body.data.totalItems).toBe(2);
        });
        (0, node_test_1.it)('should reject empty document array', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/b2b/analyze/batch')
                .set('X-API-Key', validApiKey)
                .send({
                documents: [],
            })
                .expect(400);
            expect(response.body.errors).toBeDefined();
        });
        (0, node_test_1.it)('should reject too many documents', async () => {
            const documents = Array.from({ length: 101 }, (_, i) => ({
                id: `doc${i}`,
                type: 'rental_contract',
                url: `https://example.com/doc${i}.pdf`,
            }));
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/b2b/analyze/batch')
                .set('X-API-Key', validApiKey)
                .send({ documents })
                .expect(400);
            expect(response.body.errors).toBeDefined();
        });
    });
    (0, node_test_2.describe)('Webhook Configuration', () => {
        (0, node_test_1.it)('should configure webhook successfully', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/b2b/webhooks')
                .set('X-API-Key', validApiKey)
                .send({
                url: 'https://example.com/webhook',
                events: ['document.analyzed', 'batch.completed'],
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('webhookId');
            expect(response.body.data).toHaveProperty('secret');
            expect(response.body.data.url).toBe('https://example.com/webhook');
        });
        (0, node_test_1.it)('should reject invalid webhook URL', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/b2b/webhooks')
                .set('X-API-Key', validApiKey)
                .send({
                url: 'not-a-valid-url',
                events: ['document.analyzed'],
            })
                .expect(400);
            expect(response.body.errors).toBeDefined();
        });
    });
    (0, node_test_2.describe)('Rate Limiting', () => {
        (0, node_test_1.it)('should track API requests', async () => {
            // Mock für Request-Zählung
            let requestCount = 0;
            mockPrisma.apiRequest.create.mockImplementation(() => {
                requestCount++;
                return Promise.resolve({});
            });
            // Mache mehrere Requests
            for (let i = 0; i < 5; i++) {
                await (0, supertest_1.default)(index_1.default)
                    .get('/api/b2b/status')
                    .set('X-API-Key', validApiKey)
                    .expect(200);
            }
            // Überprüfe dass Requests geloggt wurden
            expect(mockPrisma.apiRequest.create).toHaveBeenCalledTimes(5);
        });
    });
    (0, node_test_2.describe)('Permissions', () => {
        let limitedApiKey;
        let limitedTestApiKey;
        beforeAll(async () => {
            // Mock API-Key mit begrenzten Berechtigungen
            limitedApiKey = `sk_limited_${(0, uuid_1.v4)().replace(/-/g, '')}`;
            limitedTestApiKey = {
                id: 'limited-api-key-id',
                key: limitedApiKey,
                name: 'Limited API Key',
                organizationId: testOrganization.id,
                permissions: ['chat:query'], // Nur Chat-Berechtigung
                rateLimit: 100,
                quotaLimit: 1000,
                quotaUsed: 0,
                isActive: true,
                expiresAt: null,
                lastUsedAt: null,
                organization: testOrganization,
            };
            // Setup mock für limitierten API-Key
            mockPrisma.apiKey.findUnique.mockImplementation((args) => {
                if (args.where.key === limitedApiKey) {
                    return Promise.resolve(limitedTestApiKey);
                }
                return Promise.resolve(testApiKey);
            });
        });
        afterAll(async () => {
            // Reset mocks
            mockPrisma.apiKey.findUnique.mockResolvedValue(testApiKey);
        });
        (0, node_test_1.it)('should allow access to permitted endpoints', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/b2b/chat/query')
                .set('X-API-Key', limitedApiKey)
                .send({
                query: 'Test query',
            })
                .expect(200);
            expect(response.body.success).toBe(true);
        });
        (0, node_test_1.it)('should deny access to non-permitted endpoints', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/b2b/templates/generate')
                .set('X-API-Key', limitedApiKey)
                .send({
                templateType: 'rent_reduction_letter',
                data: {},
            })
                .expect(403);
            expect(response.body.error).toBe('Insufficient permissions');
        });
    });
});
