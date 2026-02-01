export interface ReportOptions {
    organizationId: string;
    reportType: 'usage' | 'performance' | 'compliance' | 'comprehensive';
    period: 'week' | 'month' | 'quarter' | 'year';
    startDate?: Date;
    endDate?: Date;
    includeDetails?: boolean;
    format?: 'json' | 'pdf' | 'csv';
}
export interface ComprehensiveReport {
    organizationId: string;
    reportType: string;
    period: {
        start: Date;
        end: Date;
        duration: string;
    };
    generatedAt: Date;
    summary: {
        totalApiCalls: number;
        totalDocuments: number;
        totalChatInteractions: number;
        totalBulkJobs: number;
        successRate: number;
        averageResponseTime: number;
        costSummary: {
            totalCost: number;
            costPerDocument: number;
            costPerChat: number;
            costPerBulkJob: number;
        };
    };
    performance: {
        throughput: {
            documentsPerHour: number;
            chatsPerHour: number;
            bulkJobsPerDay: number;
        };
        reliability: {
            uptime: number;
            errorRate: number;
            retryRate: number;
        };
        efficiency: {
            averageProcessingTime: number;
            peakProcessingTime: number;
            resourceUtilization: number;
        };
    };
    usage: {
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
        byTimeOfDay: Array<{
            hour: number;
            count: number;
        }>;
        trends: Array<{
            date: string;
            requests: number;
            documents: number;
            chats: number;
        }>;
    };
    compliance: {
        dataRetention: {
            documentsStored: number;
            oldestDocument: Date;
            retentionPolicy: string;
        };
        privacy: {
            dataProcessingConsent: boolean;
            dataExportRequests: number;
            dataDeletionRequests: number;
        };
        security: {
            encryptionStatus: string;
            accessLogs: number;
            securityIncidents: number;
        };
    };
    recommendations: Array<{
        category: string;
        priority: 'low' | 'medium' | 'high';
        title: string;
        description: string;
        estimatedImpact: string;
    }>;
    alerts: Array<{
        type: 'warning' | 'error' | 'info';
        message: string;
        timestamp: Date;
    }>;
}
export declare class ReportingService {
    private analyticsService;
    private bulkProcessingService;
    private emailService;
    constructor();
    /**
     * Generiert einen umfassenden Bericht für Business-Kunden
     */
    generateComprehensiveReport(options: ReportOptions): Promise<ComprehensiveReport>;
    /**
     * Exportiert Bericht in verschiedenen Formaten
     */
    exportReport(report: ComprehensiveReport, format: 'json' | 'pdf' | 'csv'): Promise<Buffer | string>;
    /**
     * Generiert geplante Berichte für alle aktiven Organisationen
     */
    generateScheduledReports(period?: 'week' | 'month'): Promise<void>;
    /**
     * Private Hilfsmethoden
     */
    private calculatePeriodDates;
    private getDaysDifference;
    private formatDuration;
    private calculateThroughput;
    private calculateCostSummary;
    private getUsageBreakdown;
    private getComplianceData;
    private getPerformanceMetrics;
    private generateRecommendations;
    private generateAlerts;
    private saveReportMetadata;
    private convertReportToCSV;
    private generateReportPDF;
    private deliverReport;
}
