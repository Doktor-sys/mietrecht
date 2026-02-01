"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CentralizedAnalyticsService = void 0;
const logger_1 = require("../utils/logger");
const AnalyticsService_1 = require("./AnalyticsService");
const TrendAnalysisService_1 = require("./TrendAnalysisService");
const BenchmarkingService_1 = require("./BenchmarkingService");
const ComplianceMonitoringService_1 = require("./ComplianceMonitoringService");
const ReportingService_1 = require("./ReportingService");
const BulkProcessingService_1 = require("./BulkProcessingService");
const ChatService_1 = require("./ChatService");
const DocumentAnalysisService_1 = require("./DocumentAnalysisService");
const LegalDataUpdateService_1 = require("./LegalDataUpdateService");
const AlertManager_1 = require("./kms/AlertManager");
class CentralizedAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.analyticsService = new AnalyticsService_1.AnalyticsService();
        this.trendAnalysisService = new TrendAnalysisService_1.TrendAnalysisService(prisma);
        this.benchmarkingService = new BenchmarkingService_1.BenchmarkingService(prisma);
        this.complianceMonitoringService = new ComplianceMonitoringService_1.ComplianceMonitoringService(prisma, new AlertManager_1.AlertManager()); // AlertManager would be passed here
        this.reportingService = new ReportingService_1.ReportingService();
        this.bulkProcessingService = new BulkProcessingService_1.BulkProcessingService();
        this.chatService = new ChatService_1.ChatService(prisma);
        this.documentAnalysisService = new DocumentAnalysisService_1.DocumentAnalysisService(prisma);
        this.legalDataUpdateService = new LegalDataUpdateService_1.LegalDataUpdateService(prisma);
    }
    /**
     * Generates consolidated analytics from all available data sources
     */
    async generateConsolidatedAnalytics(query) {
        try {
            const { organizationId, startDate, endDate, groupBy, includeTrends = true, includeBenchmarking = true, includeCompliance = true, includeLegalUpdates = true } = query;
            // Get base analytics data
            const baseAnalytics = await this.analyticsService.generateAnalytics({
                organizationId,
                startDate,
                endDate,
                groupBy
            });
            // Get additional service data in parallel
            const [chatMetrics, documentMetrics, bulkProcessingMetrics, legalTrends, benchmarkReport, complianceReport, legalUpdates] = await Promise.all([
                this.getChatMetrics(organizationId, startDate, endDate),
                this.getDocumentMetrics(organizationId, startDate, endDate),
                this.getBulkProcessingMetrics(organizationId, startDate, endDate),
                includeTrends ? this.trendAnalysisService.analyzeTrends({ startDate, endDate }) : Promise.resolve(undefined),
                includeBenchmarking ? this.benchmarkingService.performBenchmarking({ organizationId, startDate, endDate }) : Promise.resolve(undefined),
                includeCompliance ? this.complianceMonitoringService.monitorCompliance({ organizationId, startDate, endDate }) : Promise.resolve(undefined),
                includeLegalUpdates ? this.getLegalUpdates(startDate, endDate) : Promise.resolve([])
            ]);
            // Generate insights from all data
            const insights = this.generateInsights(baseAnalytics, chatMetrics, documentMetrics, bulkProcessingMetrics);
            // Combine all data into consolidated result
            const consolidatedResult = {
                period: baseAnalytics.period,
                metrics: {
                    ...baseAnalytics.metrics,
                    chatMetrics,
                    documentMetrics,
                    bulkProcessingMetrics
                },
                quota: baseAnalytics.quota,
                legalTrends,
                benchmarkReport,
                complianceReport,
                legalUpdates,
                insights,
                recommendations: this.generateRecommendations(baseAnalytics, chatMetrics, documentMetrics, bulkProcessingMetrics, legalTrends, benchmarkReport, complianceReport)
            };
            return consolidatedResult;
        }
        catch (error) {
            logger_1.logger.error('Error generating consolidated analytics:', error);
            throw new Error('Failed to generate consolidated analytics');
        }
    }
    /**
     * Generates usage report with enhanced metrics
     */
    async generateEnhancedUsageReport(organizationId, period) {
        try {
            const baseReport = await this.analyticsService.generateUsageReport(organizationId, period);
            // Add enhanced metrics
            const enhancedMetrics = {
            // Additional metrics could be added here
            };
            return {
                ...baseReport,
                enhancedMetrics
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating enhanced usage report:', error);
            throw new Error('Failed to generate enhanced usage report');
        }
    }
    /**
     * Gets data for custom dashboard widgets
     */
    async getDashboardWidgetData(config) {
        try {
            const widgetData = [];
            // Process each widget in parallel
            const widgetPromises = config.widgets.map(async (widget) => {
                let data;
                switch (widget.dataSource) {
                    case 'analytics':
                        data = await this.getAnalyticsWidgetData(widget, config.filters);
                        break;
                    case 'trends':
                        data = await this.getTrendsWidgetData(widget, config.filters);
                        break;
                    case 'compliance':
                        data = await this.getComplianceWidgetData(widget, config.filters);
                        break;
                    case 'chat':
                        data = await this.getChatWidgetData(widget, config.filters);
                        break;
                    default:
                        data = { error: `Unknown data source: ${widget.dataSource}` };
                }
                return {
                    id: `${widget.type}-${Date.now()}-${Math.random()}`,
                    type: widget.type,
                    title: widget.title,
                    data,
                    config: widget.config
                };
            });
            const results = await Promise.all(widgetPromises);
            return results;
        }
        catch (error) {
            logger_1.logger.error('Error getting dashboard widget data:', error);
            throw new Error('Failed to get dashboard widget data');
        }
    }
    /**
     * Private helper methods
     */
    async getChatMetrics(organizationId, startDate, endDate) {
        // In a real implementation, this would fetch actual chat metrics
        // For now, we'll return placeholder data
        return {
            totalMessages: 0,
            activeConversations: 0,
            avgResponseTime: 0,
            satisfactionRate: 0
        };
    }
    async getDocumentMetrics(organizationId, startDate, endDate) {
        // In a real implementation, this would fetch actual document metrics
        // For now, we'll return placeholder data
        return {
            totalDocuments: 0,
            processedDocuments: 0,
            failedDocuments: 0,
            avgProcessingTime: 0
        };
    }
    async getBulkProcessingMetrics(organizationId, startDate, endDate) {
        // In a real implementation, this would fetch actual bulk processing metrics
        // For now, we'll return placeholder data
        return {
            totalJobs: 0,
            completedJobs: 0,
            failedJobs: 0,
            avgJobDuration: 0
        };
    }
    async getLegalUpdates(startDate, endDate) {
        // In a real implementation, this would fetch actual legal updates
        // For now, we'll return placeholder data
        return [];
    }
    generateInsights(analytics, chatMetrics, documentMetrics, bulkProcessingMetrics) {
        const insights = [];
        // Generate insights based on the data
        if (analytics.metrics.errorRate > 0.05) {
            insights.push('High error rate detected in API requests. Consider reviewing integration.');
        }
        if (chatMetrics.satisfactionRate < 80) {
            insights.push('Chat satisfaction rate is below target. Review chatbot responses.');
        }
        if (documentMetrics.failedDocuments > documentMetrics.totalDocuments * 0.1) {
            insights.push('High document processing failure rate. Check document quality.');
        }
        if (bulkProcessingMetrics.failedJobs > bulkProcessingMetrics.totalJobs * 0.05) {
            insights.push('Bulk processing job failures detected. Review job configurations.');
        }
        return insights;
    }
    generateRecommendations(analytics, chatMetrics, documentMetrics, bulkProcessingMetrics, legalTrends, benchmarkReport, complianceReport) {
        const recommendations = [];
        // Add recommendations based on all data sources
        if (analytics.quota.utilizationRate > 80) {
            recommendations.push('Your quota utilization is high. Consider upgrading your plan.');
        }
        if (legalTrends && legalTrends.emergingTrends.length > 5) {
            recommendations.push(`There are ${legalTrends.emergingTrends.length} emerging legal trends. Review and adapt your practice accordingly.`);
        }
        // Fix the BenchmarkReport property access
        if (benchmarkReport && benchmarkReport.overallPerformance.aboveAverage < 50) {
            recommendations.push('Your performance is below industry benchmarks. Identify improvement opportunities.');
        }
        if (complianceReport && complianceReport.complianceStatus.complianceRate < 95) {
            recommendations.push('Compliance rate is below target. Address outstanding compliance issues.');
        }
        return recommendations;
    }
    async getAnalyticsWidgetData(widget, filters) {
        // Implementation for analytics widget data
        return { placeholder: 'Analytics data' };
    }
    async getTrendsWidgetData(widget, filters) {
        // Implementation for trends widget data
        return { placeholder: 'Trends data' };
    }
    async getComplianceWidgetData(widget, filters) {
        // Implementation for compliance widget data
        return { placeholder: 'Compliance data' };
    }
    async getChatWidgetData(widget, filters) {
        // Implementation for chat widget data
        return { placeholder: 'Chat data' };
    }
}
exports.CentralizedAnalyticsService = CentralizedAnalyticsService;
