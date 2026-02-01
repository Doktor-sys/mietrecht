"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const AnalyticsService_1 = require("./AnalyticsService");
const BulkProcessingService_1 = require("./BulkProcessingService");
const EmailService_1 = require("./EmailService");
const pdfGenerator_1 = require("../utils/pdfGenerator");
const prisma = new client_1.PrismaClient();
class ReportingService {
    constructor() {
        this.analyticsService = new AnalyticsService_1.AnalyticsService();
        this.bulkProcessingService = new BulkProcessingService_1.BulkProcessingService();
        this.emailService = new EmailService_1.EmailService();
    }
    /**
     * Generiert einen umfassenden Bericht für Business-Kunden
     */
    async generateComprehensiveReport(options) {
        try {
            const { organizationId, period, startDate, endDate } = options;
            const { start, end } = this.calculatePeriodDates(period, startDate, endDate);
            logger_1.logger.info(`Generating comprehensive report for organization ${organizationId}`, {
                period: { start, end },
                reportType: options.reportType
            });
            // Sammle alle erforderlichen Daten parallel
            const [analyticsData, bulkStats, usageData, complianceData, performanceData] = await Promise.all([
                this.analyticsService.generateAnalytics({
                    organizationId,
                    startDate: start,
                    endDate: end,
                    groupBy: 'day'
                }),
                this.bulkProcessingService.getBulkProcessingStats(organizationId, this.getDaysDifference(start, end)),
                this.getUsageBreakdown(organizationId, start, end),
                this.getComplianceData(organizationId, start, end),
                this.getPerformanceMetrics(organizationId, start, end)
            ]);
            // Generiere Empfehlungen und Alerts
            const recommendations = this.generateRecommendations(analyticsData, bulkStats, performanceData);
            const alerts = this.generateAlerts(analyticsData, performanceData);
            const report = {
                organizationId,
                reportType: options.reportType,
                period: {
                    start,
                    end,
                    duration: this.formatDuration(start, end)
                },
                generatedAt: new Date(),
                summary: {
                    totalApiCalls: analyticsData.metrics.totalRequests,
                    totalDocuments: analyticsData.metrics.documentAnalyses,
                    totalChatInteractions: analyticsData.metrics.chatInteractions,
                    totalBulkJobs: analyticsData.metrics.bulkJobs,
                    successRate: Math.round((1 - analyticsData.metrics.errorRate) * 100),
                    averageResponseTime: analyticsData.metrics.responseTimeStats.average,
                    costSummary: this.calculateCostSummary(analyticsData)
                },
                performance: {
                    throughput: {
                        documentsPerHour: this.calculateThroughput(analyticsData.metrics.documentAnalyses, start, end, 'hour'),
                        chatsPerHour: this.calculateThroughput(analyticsData.metrics.chatInteractions, start, end, 'hour'),
                        bulkJobsPerDay: this.calculateThroughput(analyticsData.metrics.bulkJobs, start, end, 'day')
                    },
                    reliability: {
                        uptime: performanceData.uptime,
                        errorRate: Math.round(analyticsData.metrics.errorRate * 100),
                        retryRate: bulkStats.performance?.averageRetryRate || 0
                    },
                    efficiency: {
                        averageProcessingTime: performanceData.averageProcessingTime,
                        peakProcessingTime: performanceData.peakProcessingTime,
                        resourceUtilization: performanceData.resourceUtilization
                    }
                },
                usage: {
                    byService: usageData.byService,
                    byDocumentType: usageData.byDocumentType,
                    byTimeOfDay: usageData.byTimeOfDay,
                    trends: analyticsData.trends || []
                },
                compliance: complianceData,
                recommendations,
                alerts
            };
            // Speichere Bericht für Audit-Zwecke
            await this.saveReportMetadata(report);
            return report;
        }
        catch (error) {
            logger_1.logger.error('Error generating comprehensive report:', error);
            throw new Error('Failed to generate comprehensive report');
        }
    }
    /**
     * Exportiert Bericht in verschiedenen Formaten
     */
    async exportReport(report, format) {
        try {
            switch (format) {
                case 'json':
                    return JSON.stringify(report, null, 2);
                case 'csv':
                    return this.convertReportToCSV(report);
                case 'pdf':
                    return await this.generateReportPDF(report);
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error exporting report:', error);
            throw new Error('Failed to export report');
        }
    }
    /**
     * Generiert geplante Berichte für alle aktiven Organisationen
     */
    async generateScheduledReports(period = 'week') {
        try {
            const organizations = await prisma.organization.findMany({
                where: { isActive: true }
            });
            for (const org of organizations) {
                try {
                    const report = await this.generateComprehensiveReport({
                        organizationId: org.id,
                        reportType: 'comprehensive',
                        period,
                        includeDetails: true
                    });
                    // Sende Bericht per E-Mail oder Webhook
                    await this.deliverReport(org, report);
                }
                catch (orgError) {
                    logger_1.logger.error(`Failed to generate report for organization ${org.id}:`, orgError);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error generating scheduled reports:', error);
            throw new Error('Failed to generate scheduled reports');
        }
    }
    /**
     * Private Hilfsmethoden
     */
    calculatePeriodDates(period, startDate, endDate) {
        if (startDate && endDate) {
            return { start: startDate, end: endDate };
        }
        const end = new Date();
        const start = new Date();
        switch (period) {
            case 'week':
                start.setDate(end.getDate() - 7);
                break;
            case 'month':
                start.setMonth(end.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(end.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(end.getFullYear() - 1);
                break;
        }
        return { start, end };
    }
    getDaysDifference(start, end) {
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    formatDuration(start, end) {
        const days = this.getDaysDifference(start, end);
        if (days <= 7)
            return `${days} days`;
        if (days <= 31)
            return `${Math.ceil(days / 7)} weeks`;
        if (days <= 365)
            return `${Math.ceil(days / 30)} months`;
        return `${Math.ceil(days / 365)} years`;
    }
    calculateThroughput(total, start, end, unit) {
        const duration = (end.getTime() - start.getTime()) / 1000; // seconds
        const divisor = unit === 'hour' ? 3600 : 86400; // seconds in hour/day
        const periods = duration / divisor;
        return periods > 0 ? Math.round(total / periods) : 0;
    }
    calculateCostSummary(analyticsData) {
        // Vereinfachte Kostenberechnung - in Produktion würde dies auf echten Preisen basieren
        const documentCost = 0.10; // €0.10 per document
        const chatCost = 0.05; // €0.05 per chat
        const bulkJobCost = 1.00; // €1.00 per bulk job
        const totalCost = (analyticsData.metrics.documentAnalyses * documentCost) +
            (analyticsData.metrics.chatInteractions * chatCost) +
            (analyticsData.metrics.bulkJobs * bulkJobCost);
        return {
            totalCost: Math.round(totalCost * 100) / 100,
            costPerDocument: documentCost,
            costPerChat: chatCost,
            costPerBulkJob: bulkJobCost
        };
    }
    async getUsageBreakdown(organizationId, start, end) {
        // Vereinfachte Implementierung - würde in Produktion detailliertere Daten sammeln
        const documents = await prisma.document.findMany({
            where: {
                organizationId,
                uploadedAt: { gte: start, lte: end }
            }
        });
        const chats = await prisma.chatInteraction.findMany({
            where: {
                organizationId,
                createdAt: { gte: start, lte: end }
            }
        });
        // Service-Breakdown
        const totalServices = documents.length + chats.length;
        const byService = [
            {
                service: 'Document Analysis',
                count: documents.length,
                percentage: totalServices > 0 ? Math.round((documents.length / totalServices) * 100) : 0
            },
            {
                service: 'Chat Interactions',
                count: chats.length,
                percentage: totalServices > 0 ? Math.round((chats.length / totalServices) * 100) : 0
            }
        ];
        // Document Type Breakdown
        const typeCount = documents.reduce((acc, doc) => {
            acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
            return acc;
        }, {});
        const byDocumentType = Object.entries(typeCount).map(([type, count]) => ({
            type,
            count,
            percentage: documents.length > 0 ? Math.round((count / documents.length) * 100) : 0
        }));
        // Time of Day Breakdown (Dummy Data for now)
        const byTimeOfDay = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            count: Math.floor(Math.random() * 10) // Placeholder
        }));
        return { byService, byDocumentType, byTimeOfDay };
    }
    async getComplianceData(organizationId, start, end) {
        // Placeholder for compliance data
        return {
            dataRetention: {
                documentsStored: await prisma.document.count({ where: { organizationId } }),
                oldestDocument: new Date(start.getTime() - 1000 * 60 * 60 * 24 * 30), // Mock
                retentionPolicy: '30 days'
            },
            privacy: {
                dataProcessingConsent: true,
                dataExportRequests: 0,
                dataDeletionRequests: 0
            },
            security: {
                encryptionStatus: 'Enabled',
                accessLogs: 100,
                securityIncidents: 0
            }
        };
    }
    async getPerformanceMetrics(organizationId, start, end) {
        // Placeholder for performance metrics
        return {
            uptime: 99.9,
            averageProcessingTime: 1500, // ms
            peakProcessingTime: 3000, // ms
            resourceUtilization: 45 // %
        };
    }
    generateRecommendations(analyticsData, bulkStats, performanceData) {
        const recommendations = [];
        // Performance-basierte Empfehlungen
        if (performanceData.averageProcessingTime > 2000) {
            recommendations.push({
                category: 'Performance',
                priority: 'high',
                title: 'Optimize Document Processing',
                description: 'Average processing time is above optimal threshold. Consider using batch processing for better efficiency.',
                estimatedImpact: '30% faster processing'
            });
        }
        // Nutzungsbasierte Empfehlungen
        if (analyticsData.metrics.bulkJobs < analyticsData.metrics.documentAnalyses * 0.1) {
            recommendations.push({
                category: 'Efficiency',
                priority: 'medium',
                title: 'Increase Bulk Processing Usage',
                description: 'You could benefit from using bulk processing for multiple documents to reduce costs and improve efficiency.',
                estimatedImpact: '20% cost reduction'
            });
        }
        // Quota-basierte Empfehlungen
        if (analyticsData.quota && analyticsData.quota.utilizationRate > 80) {
            recommendations.push({
                category: 'Capacity',
                priority: 'high',
                title: 'Consider Plan Upgrade',
                description: 'Your quota utilization is high. Consider upgrading your plan to avoid service interruptions.',
                estimatedImpact: 'Prevent service disruption'
            });
        }
        return recommendations;
    }
    generateAlerts(analyticsData, performanceData) {
        const alerts = [];
        if (analyticsData.metrics.errorRate > 0.05) {
            alerts.push({
                type: 'warning',
                message: `Error rate is ${Math.round(analyticsData.metrics.errorRate * 100)}%, which is above the 5% threshold`,
                timestamp: new Date()
            });
        }
        if (performanceData.uptime < 99.5) {
            alerts.push({
                type: 'error',
                message: `System uptime is ${performanceData.uptime}%, below the 99.5% SLA`,
                timestamp: new Date()
            });
        }
        return alerts;
    }
    async saveReportMetadata(report) {
        try {
            await prisma.reportGeneration.create({
                data: {
                    organizationId: report.organizationId,
                    reportType: report.reportType,
                    periodStart: report.period.start,
                    periodEnd: report.period.end,
                    generatedAt: report.generatedAt,
                    summary: {
                        totalApiCalls: report.summary.totalApiCalls,
                        totalDocuments: report.summary.totalDocuments,
                        successRate: report.summary.successRate
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.warn('Failed to save report metadata:', error);
        }
    }
    convertReportToCSV(report) {
        // Vereinfachte CSV-Konvertierung
        const lines = [
            'Metric,Value',
            `Organization ID,${report.organizationId}`,
            `Report Period,${report.period.start.toISOString()} to ${report.period.end.toISOString()}`,
            `Total API Calls,${report.summary.totalApiCalls}`,
            `Total Documents,${report.summary.totalDocuments}`,
            `Total Chat Interactions,${report.summary.totalChatInteractions}`,
            `Success Rate,${report.summary.successRate}%`,
            `Average Response Time,${report.summary.averageResponseTime}ms`,
            `Total Cost,€${report.summary.costSummary.totalCost}`
        ];
        return lines.join('\n');
    }
    async generateReportPDF(report) {
        return await pdfGenerator_1.PdfGenerator.generateReport(report);
    }
    async deliverReport(organization, report) {
        try {
            // Hole die E-Mail-Adresse des Organisations-Admins oder die konfigurierte Report-E-Mail
            // Vereinfachung: Wir nehmen an, dass die Organisation eine Kontakt-E-Mail hat
            const recipientEmail = organization.email || 'admin@example.com';
            await this.emailService.sendReportNotification(recipientEmail, {
                organizationName: organization.name,
                reportType: report.reportType,
                period: report.period.duration,
                summary: {
                    totalApiCalls: report.summary.totalApiCalls,
                    totalDocuments: report.summary.totalDocuments,
                    successRate: report.summary.successRate,
                    totalCost: report.summary.costSummary.totalCost
                },
                reportUrl: `https://smartlaw.de/reports/${report.organizationId}/${report.generatedAt.getTime()}`, // Mock URL
                generatedAt: report.generatedAt
            });
            logger_1.logger.info(`Report delivered for organization ${organization.id} to ${recipientEmail}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to deliver report for organization ${organization.id}:`, error);
            // Wir werfen den Fehler nicht weiter, um den Prozess nicht zu unterbrechen
        }
    }
}
exports.ReportingService = ReportingService;
