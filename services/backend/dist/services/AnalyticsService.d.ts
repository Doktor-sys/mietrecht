import { LegalTrendAnalysis } from './TrendAnalysisService';
import { BenchmarkReport } from './BenchmarkingService';
import { ComplianceMonitoringReport } from './ComplianceMonitoringService';
export interface AnalyticsQuery {
    organizationId: string;
    startDate: Date;
    endDate: Date;
    metrics?: string[];
    groupBy?: 'day' | 'week' | 'month';
}
export interface AnalyticsResult {
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
    };
    trends?: Array<{
        date: string;
        requests: number;
        documents: number;
        chats: number;
    }>;
    quota: {
        used: number;
        limit: number;
        remaining: number;
        utilizationRate: number;
    };
    legalTrends?: LegalTrendAnalysis;
    benchmarkReport?: BenchmarkReport;
    complianceReport?: ComplianceMonitoringReport;
}
export interface UsageReport {
    organizationId: string;
    reportPeriod: string;
    generatedAt: Date;
    summary: {
        totalApiCalls: number;
        totalDocuments: number;
        totalChatMessages: number;
        totalBulkJobs: number;
        averageProcessingTime: number;
        successRate: number;
    };
    breakdown: {
        byService: Array<{
            service: string;
            count: number;
            percentage: number;
        }>;
        byDocumentType: Array<{
            type: string;
            count: number;
            percentage: number;
        }>;
        byRiskLevel: Array<{
            level: string;
            count: number;
            percentage: number;
        }>;
    };
    recommendations: string[];
    legalTrends?: LegalTrendAnalysis;
    benchmarkReport?: BenchmarkReport;
    complianceReport?: ComplianceMonitoringReport;
}
export declare class AnalyticsService {
    private trendAnalysisService;
    private benchmarkingService;
    private complianceMonitoringService;
    constructor();
    /**
     * Generiert umfassende Analytics für eine Organisation
     */
    generateAnalytics(query: AnalyticsQuery): Promise<AnalyticsResult>;
    /**
     * Generiert einen detaillierten Nutzungsbericht
     */
    generateUsageReport(organizationId: string, period: 'week' | 'month' | 'quarter'): Promise<UsageReport>;
    /**
     * Exportiert Analytics-Daten in verschiedenen Formaten
     */
    exportAnalytics(organizationId: string, startDate: Date, endDate: Date, format: 'json' | 'csv' | 'pdf'): Promise<Buffer | string>;
    /**
     * Private Methoden für Metriken-Sammlung
     */
    private getApiRequestMetrics;
    private getDocumentAnalysisMetrics;
    private getChatInteractionMetrics;
    private getTemplateGenerationMetrics;
    private getBulkJobMetrics;
    private getQuotaInfo;
    private generateTrends;
    private generateRecommendations;
    private getPeriodDates;
    private convertToCSV;
    private generatePDFReport;
}
