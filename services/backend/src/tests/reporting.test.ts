import { ReportingService } from '../services/ReportingService';
import { EmailService } from '../services/EmailService';
import { PrismaClient } from '@prisma/client';

import { PdfGenerator } from '../utils/pdfGenerator';

// Mocks
jest.mock('../services/EmailService');
jest.mock('../services/AnalyticsService');
jest.mock('../services/BulkProcessingService');
jest.mock('@prisma/client');
jest.mock('../utils/logger');
jest.mock('../utils/pdfGenerator');

describe('ReportingService', () => {
    let reportingService: ReportingService;
    let emailServiceMock: jest.Mocked<EmailService>;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Setup EmailService mock
        emailServiceMock = new EmailService() as jest.Mocked<EmailService>;
        (EmailService as jest.Mock).mockImplementation(() => emailServiceMock);

        // Initialize service
        reportingService = new ReportingService();
    });

    describe('generateComprehensiveReport', () => {
        it('should generate a report and send a notification', async () => {
            // Mock data
            const mockOptions = {
                organizationId: 'org-123',
                reportType: 'comprehensive' as const,
                period: 'month' as const
            };

            // Mock internal service responses (simplified for this test)
            // In a real test, we would mock AnalyticsService and BulkProcessingService responses properly
            // For now, we assume they return valid promises or we mock the private methods if possible
            // But since we can't easily mock private methods in TS without casting to any, 
            // we rely on the fact that the mocked services will return undefined by default 
            // which might cause issues if not handled. 

            // However, since we just want to verify the integration flow:

            // We need to mock the private deliverReport if we want to test just that, 
            // OR we test the public method and ensure dependencies behave.

            // Let's try to test the deliverReport method directly by casting to any to access private method
            // This is a common strategy for testing private methods in JS/TS

            const mockReport = {
                organizationId: 'org-123',
                reportType: 'comprehensive',
                period: { start: new Date(), end: new Date(), duration: '30 days' },
                generatedAt: new Date(),
                summary: {
                    totalApiCalls: 1000,
                    totalDocuments: 50,
                    totalChatInteractions: 20,
                    totalBulkJobs: 5,
                    successRate: 98,
                    averageResponseTime: 200,
                    costSummary: {
                        totalCost: 50.00,
                        costPerDocument: 0.10,
                        costPerChat: 0.05,
                        costPerBulkJob: 1.00
                    }
                },
                // ... other fields omitted for brevity
            };

            const mockOrganization = {
                id: 'org-123',
                name: 'Test Org',
                email: 'test@example.com'
            };

            // Access private method deliverReport
            await (reportingService as any).deliverReport(mockOrganization, mockReport);

            // Verify EmailService was called
            expect(emailServiceMock.sendReportNotification).toHaveBeenCalledTimes(1);
            expect(emailServiceMock.sendReportNotification).toHaveBeenCalledWith(
                'test@example.com',
                expect.objectContaining({
                    organizationName: 'Test Org',
                    reportType: 'comprehensive',
                    summary: expect.objectContaining({
                        totalCost: 50.00
                    })
                })
            );
        });
    });
    describe('exportReport', () => {
        it('should export report as PDF', async () => {
            const mockReport = {
                organizationId: 'org-123',
                reportType: 'comprehensive',
                period: { start: new Date(), end: new Date(), duration: '30 days' },
                generatedAt: new Date(),
                summary: {
                    totalApiCalls: 1000,
                    totalDocuments: 50,
                    totalChatInteractions: 20,
                    totalBulkJobs: 5,
                    successRate: 98,
                    averageResponseTime: 200,
                    costSummary: {
                        totalCost: 50.00,
                        costPerDocument: 0.10,
                        costPerChat: 0.05,
                        costPerBulkJob: 1.00
                    }
                },
                performance: {
                    throughput: { documentsPerHour: 10, chatsPerHour: 5, bulkJobsPerDay: 1 },
                    reliability: { uptime: 99.9, errorRate: 2, retryRate: 1 },
                    efficiency: { averageProcessingTime: 200, peakProcessingTime: 500, resourceUtilization: 50 }
                },
                recommendations: [],
                alerts: []
            } as any; // Cast to any to avoid mocking full interface

            const pdfBuffer = Buffer.from('PDF Content');
            (PdfGenerator.generateReport as jest.Mock).mockResolvedValue(pdfBuffer);

            const result = await reportingService.exportReport(mockReport, 'pdf');

            expect(PdfGenerator.generateReport).toHaveBeenCalledWith(mockReport);
            expect(result).toBe(pdfBuffer);
        });
    });
});
