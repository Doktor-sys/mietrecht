import { PrismaClient } from '@prisma/client';
import { UsageReport } from './AnalyticsService';
import { LegalTrendAnalysis } from './TrendAnalysisService';
import { BenchmarkReport } from './BenchmarkingService';
import { ComplianceMonitoringReport } from './ComplianceMonitoringService';
export interface ConsolidatedAnalyticsQuery {
    organizationId: string;
    startDate: Date;
    endDate: Date;
    metrics?: string[];
    groupBy?: 'day' | 'week' | 'month';
    includeTrends?: boolean;
    includeBenchmarking?: boolean;
    includeCompliance?: boolean;
    includeLegalUpdates?: boolean;
}
export interface ConsolidatedAnalyticsResult {
    period: {
        start: Date;
        end: Date;
        groupBy?: string;
    };
    metrics: {
        totalRequests: number;
        documentAnalyses: number;
        chatInteractions: number;
        templateGenerations: number;
        bulkJobs: number;
        averageConfidence: number;
        topDocumentTypes: Array<{
            type: string;
            count: number;
        }>;
        topLegalCategories: Array<{
            category: string;
            count: number;
        }>;
        riskLevelDistribution: Array<{
            level: string;
            count: number;
        }>;
        errorRate: number;
        responseTimeStats: {
            average: number;
            median: number;
            p95: number;
        };
        chatMetrics: {
            totalMessages: number;
            activeConversations: number;
            avgResponseTime: number;
            satisfactionRate: number;
        };
        documentMetrics: {
            totalDocuments: number;
            processedDocuments: number;
            failedDocuments: number;
            avgProcessingTime: number;
        };
        bulkProcessingMetrics: {
            totalJobs: number;
            completedJobs: number;
            failedJobs: number;
            avgJobDuration: number;
        };
    };
    quota: {
        used: number;
        limit: number;
        remaining: number;
        utilizationRate: number;
    };
    legalTrends?: LegalTrendAnalysis;
    benchmarkReport?: BenchmarkReport;
    complianceReport?: ComplianceMonitoringReport;
    legalUpdates?: any[];
    insights: string[];
    recommendations: string[];
}
export interface CustomDashboardConfig {
    organizationId: string;
    widgets: Array<{
        type: 'metric' | 'chart' | 'table' | 'trend';
        title: string;
        dataSource: string;
        config: any;
    }>;
    filters: {
        dateRange: {
            start: Date;
            end: Date;
        };
        categories?: string[];
        jurisdictions?: string[];
    };
}
export interface DashboardWidgetData {
    id: string;
    type: 'metric' | 'chart' | 'table' | 'trend';
    title: string;
    data: any;
    config: any;
}
export declare class CentralizedAnalyticsService {
    private prisma;
    private analyticsService;
    private trendAnalysisService;
    private benchmarkingService;
    private complianceMonitoringService;
    private reportingService;
    private bulkProcessingService;
    private chatService;
    private documentAnalysisService;
    private legalDataUpdateService;
    constructor(prisma: PrismaClient);
    /**
     * Generates consolidated analytics from all available data sources
     */
    generateConsolidatedAnalytics(query: ConsolidatedAnalyticsQuery): Promise<ConsolidatedAnalyticsResult>;
    /**
     * Generates usage report with enhanced metrics
     */
    generateEnhancedUsageReport(organizationId: string, period: 'week' | 'month' | 'quarter'): Promise<UsageReport & {
        enhancedMetrics: any;
    }>;
    /**
     * Gets data for custom dashboard widgets
     */
    getDashboardWidgetData(config: CustomDashboardConfig): Promise<DashboardWidgetData[]>;
    /**
     * Private helper methods
     */
    private getChatMetrics;
    private getDocumentMetrics;
    private getBulkProcessingMetrics;
    private getLegalUpdates;
    private generateInsights;
    private generateRecommendations;
    private getAnalyticsWidgetData;
    private getTrendsWidgetData;
    private getComplianceWidgetData;
    private getChatWidgetData;
}
