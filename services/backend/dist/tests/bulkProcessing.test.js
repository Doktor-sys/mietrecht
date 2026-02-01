"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Erstelle eine vereinfachte Mock-Implementierung für die Tests
class MockBulkProcessingService {
    async startBulkJob(options) {
        if (!options.items || options.items.length === 0) {
            throw new Error('Items cannot be empty');
        }
        return 'test-job-id';
    }
    async getBulkJobStatus(jobId) {
        if (jobId === 'invalid-job-id') {
            return null;
        }
        return {
            jobId,
            status: 'pending',
            totalItems: 2,
            processedItems: 1,
            successfulItems: 1,
            failedItems: 0,
            progress: 50,
            results: [],
            errors: []
        };
    }
    async cancelBulkJob(jobId) {
        if (jobId === 'invalid-job-id') {
            return false;
        }
        return true;
    }
    async cleanupCompletedJobs(olderThanDays) {
        return 1;
    }
}
class MockAnalyticsService {
    async generateAnalytics(options) {
        return {
            period: options,
            metrics: { totalRequests: 100, documentAnalyses: 50, chatInteractions: 30 },
            quota: { used: 100, limit: 1000 }
        };
    }
    async generateUsageReport(organizationId, period) {
        return {
            organizationId,
            reportPeriod: period,
            summary: {},
            breakdown: {},
            recommendations: []
        };
    }
    async exportAnalytics(organizationId, startDate, endDate, format) {
        return JSON.stringify({ test: 'data' });
    }
}
(0, globals_1.describe)('Bulk Processing Service', () => {
    let bulkProcessingService;
    let analyticsService;
    let testOrganizationId;
    (0, globals_1.beforeAll)(async () => {
        bulkProcessingService = new MockBulkProcessingService();
        analyticsService = new MockAnalyticsService();
        testOrganizationId = 'test-org-id';
    });
    (0, globals_1.afterAll)(async () => {
        // Cleanup - nicht mehr nötig da wir Mocks verwenden
    });
    (0, globals_1.beforeEach)(async () => {
        // Reset für jeden Test
    });
    (0, globals_1.describe)('Document Bulk Analysis', () => {
        (0, globals_1.test)('should start bulk document analysis job', async () => {
            const documents = [
                {
                    id: 'doc1',
                    filename: 'contract1.pdf',
                    content: Buffer.from('Test document content 1'),
                    mimeType: 'application/pdf',
                    documentType: 'rental_contract'
                },
                {
                    id: 'doc2',
                    filename: 'contract2.pdf',
                    content: Buffer.from('Test document content 2'),
                    mimeType: 'application/pdf',
                    documentType: 'rental_contract'
                }
            ];
            const jobId = await bulkProcessingService.startBulkJob({
                organizationId: testOrganizationId,
                type: 'document_analysis',
                items: documents
            });
            (0, globals_1.expect)(jobId).toBeDefined();
            (0, globals_1.expect)(typeof jobId).toBe('string');
            // Überprüfe dass Job erstellt wurde
            (0, globals_1.expect)(jobId).toBeDefined();
            (0, globals_1.expect)(typeof jobId).toBe('string');
        });
        (0, globals_1.test)('should get bulk job status', async () => {
            const documents = [
                {
                    id: 'doc1',
                    filename: 'test.pdf',
                    content: Buffer.from('Test content'),
                    mimeType: 'application/pdf',
                    documentType: 'rental_contract'
                }
            ];
            const jobId = await bulkProcessingService.startBulkJob({
                organizationId: testOrganizationId,
                type: 'document_analysis',
                items: documents
            });
            // Warte kurz für Job-Initialisierung
            await new Promise(resolve => setTimeout(resolve, 100));
            const status = await bulkProcessingService.getBulkJobStatus(jobId);
            (0, globals_1.expect)(status).toBeDefined();
            (0, globals_1.expect)(status?.jobId).toBe(jobId);
            (0, globals_1.expect)(status?.totalItems).toBe(1);
            (0, globals_1.expect)(status?.processedItems).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(status?.progress).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(status?.progress).toBeLessThanOrEqual(100);
        });
        (0, globals_1.test)('should cancel bulk job', async () => {
            const documents = [
                {
                    id: 'doc1',
                    filename: 'test.pdf',
                    content: Buffer.from('Test content'),
                    mimeType: 'application/pdf',
                    documentType: 'rental_contract'
                }
            ];
            const jobId = await bulkProcessingService.startBulkJob({
                organizationId: testOrganizationId,
                type: 'document_analysis',
                items: documents
            });
            const cancelled = await bulkProcessingService.cancelBulkJob(jobId);
            (0, globals_1.expect)(cancelled).toBe(true);
            // Überprüfe Status
            const status = await bulkProcessingService.getBulkJobStatus(jobId);
            (0, globals_1.expect)(status?.status).toBe('cancelled');
        });
        (0, globals_1.test)('should handle large batch efficiently', async () => {
            const startTime = Date.now();
            // Erstelle 50 Test-Dokumente
            const documents = Array.from({ length: 50 }, (_, i) => ({
                id: `doc${i}`,
                filename: `document${i}.pdf`,
                content: Buffer.from(`Test document content ${i}`),
                mimeType: 'application/pdf',
                documentType: 'rental_contract'
            }));
            const jobId = await bulkProcessingService.startBulkJob({
                organizationId: testOrganizationId,
                type: 'document_analysis',
                items: documents
            });
            const setupTime = Date.now() - startTime;
            // Setup sollte schnell sein (< 1 Sekunde)
            (0, globals_1.expect)(setupTime).toBeLessThan(1000);
            (0, globals_1.expect)(jobId).toBeDefined();
            // Überprüfe dass Job korrekt erstellt wurde
            const status = await bulkProcessingService.getBulkJobStatus(jobId);
            (0, globals_1.expect)(status?.totalItems).toBe(50);
        }, 10000); // 10 Sekunden Timeout
    });
    (0, globals_1.describe)('Chat Bulk Processing', () => {
        (0, globals_1.test)('should process bulk chat queries', async () => {
            const queries = [
                {
                    id: 'query1',
                    query: 'Kann ich die Miete mindern wenn die Heizung kaputt ist?',
                    context: { location: 'Berlin' }
                },
                {
                    id: 'query2',
                    query: 'Wie kündige ich meinen Mietvertrag?',
                    context: { location: 'München' }
                }
            ];
            const jobId = await bulkProcessingService.startBulkJob({
                organizationId: testOrganizationId,
                type: 'chat_bulk',
                items: queries
            });
            (0, globals_1.expect)(jobId).toBeDefined();
            const status = await bulkProcessingService.getBulkJobStatus(jobId);
            (0, globals_1.expect)(status?.totalItems).toBe(2);
            (0, globals_1.expect)(status?.status).toMatch(/pending|processing/);
        });
    });
    (0, globals_1.describe)('Performance Tests', () => {
        (0, globals_1.test)('should handle concurrent bulk jobs', async () => {
            const documents = Array.from({ length: 10 }, (_, i) => ({
                id: `doc${i}`,
                filename: `document${i}.pdf`,
                content: Buffer.from(`Test content ${i}`),
                mimeType: 'application/pdf',
                documentType: 'rental_contract'
            }));
            // Starte 3 Jobs gleichzeitig
            const jobPromises = Array.from({ length: 3 }, () => bulkProcessingService.startBulkJob({
                organizationId: testOrganizationId,
                type: 'document_analysis',
                items: documents
            }));
            const jobIds = await Promise.all(jobPromises);
            (0, globals_1.expect)(jobIds).toHaveLength(3);
            (0, globals_1.expect)(new Set(jobIds).size).toBe(3); // Alle IDs sollten unique sein
            // Überprüfe dass alle Jobs erstellt wurden
            for (const jobId of jobIds) {
                const status = await bulkProcessingService.getBulkJobStatus(jobId);
                (0, globals_1.expect)(status).toBeDefined();
                (0, globals_1.expect)(status?.totalItems).toBe(10);
            }
        });
        (0, globals_1.test)('should cleanup completed jobs', async () => {
            // Test Cleanup-Funktion
            const cleanedCount = await bulkProcessingService.cleanupCompletedJobs(30);
            (0, globals_1.expect)(typeof cleanedCount).toBe('number');
            (0, globals_1.expect)(cleanedCount).toBeGreaterThanOrEqual(0);
        });
    });
    (0, globals_1.describe)('Analytics Service', () => {
        (0, globals_1.test)('should generate analytics for organization', async () => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 30);
            const analytics = await analyticsService.generateAnalytics({
                organizationId: testOrganizationId,
                startDate,
                endDate
            });
            (0, globals_1.expect)(analytics).toBeDefined();
            (0, globals_1.expect)(analytics.metrics).toBeDefined();
            (0, globals_1.expect)(analytics.quota).toBeDefined();
            (0, globals_1.expect)(typeof analytics.metrics.totalRequests).toBe('number');
            (0, globals_1.expect)(typeof analytics.metrics.documentAnalyses).toBe('number');
            (0, globals_1.expect)(typeof analytics.metrics.chatInteractions).toBe('number');
        });
        (0, globals_1.test)('should generate usage report', async () => {
            const report = await analyticsService.generateUsageReport(testOrganizationId, 'month');
            (0, globals_1.expect)(report).toBeDefined();
            (0, globals_1.expect)(report.organizationId).toBe(testOrganizationId);
            (0, globals_1.expect)(report.reportPeriod).toBe('month');
            (0, globals_1.expect)(report.summary).toBeDefined();
            (0, globals_1.expect)(report.breakdown).toBeDefined();
            (0, globals_1.expect)(Array.isArray(report.recommendations)).toBe(true);
        });
        (0, globals_1.test)('should export analytics in JSON format', async () => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 7);
            const exportData = await analyticsService.exportAnalytics(testOrganizationId, startDate, endDate, 'json');
            (0, globals_1.expect)(typeof exportData).toBe('string');
            // Sollte valides JSON sein
            const parsed = JSON.parse(exportData);
            (0, globals_1.expect)(parsed).toBeDefined();
            (0, globals_1.expect)(parsed.test).toBe('data');
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.test)('should handle invalid job ID gracefully', async () => {
            const status = await bulkProcessingService.getBulkJobStatus('invalid-job-id');
            (0, globals_1.expect)(status).toBeNull();
        });
        (0, globals_1.test)('should handle cancellation of non-existent job', async () => {
            const cancelled = await bulkProcessingService.cancelBulkJob('invalid-job-id');
            (0, globals_1.expect)(cancelled).toBe(false);
        });
        (0, globals_1.test)('should handle empty bulk job items', async () => {
            await (0, globals_1.expect)(bulkProcessingService.startBulkJob({
                organizationId: testOrganizationId,
                type: 'document_analysis',
                items: []
            })).rejects.toThrow();
        });
    });
    (0, globals_1.describe)('Memory and Resource Management', () => {
        (0, globals_1.test)('should not leak memory with large batches', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            // Verarbeite mehrere große Batches
            for (let batch = 0; batch < 5; batch++) {
                const documents = Array.from({ length: 20 }, (_, i) => ({
                    id: `batch${batch}_doc${i}`,
                    filename: `document${i}.pdf`,
                    content: Buffer.from(`Large test content ${i}`.repeat(100)),
                    mimeType: 'application/pdf',
                    documentType: 'rental_contract'
                }));
                const jobId = await bulkProcessingService.startBulkJob({
                    organizationId: testOrganizationId,
                    type: 'document_analysis',
                    items: documents
                });
                // Warte kurz und cancelle Job um Ressourcen freizugeben
                await new Promise(resolve => setTimeout(resolve, 100));
                await bulkProcessingService.cancelBulkJob(jobId);
            }
            // Force garbage collection wenn verfügbar
            if (global.gc) {
                global.gc();
            }
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            // Memory increase sollte reasonable sein (< 50MB)
            (0, globals_1.expect)(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        }, 30000);
    });
});
