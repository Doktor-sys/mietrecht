import { PrismaClient } from '@prisma/client';
import { AnalyticsResult } from './AnalyticsService';
import { LegalTrendAnalysis } from './TrendAnalysisService';
import { BenchmarkReport } from './BenchmarkingService';
import { ComplianceMonitoringReport } from './ComplianceMonitoringService';
export interface EnhancedExportOptions {
    format: 'pdf' | 'csv' | 'xlsx' | 'json';
    includeCharts?: boolean;
    includeRecommendations?: boolean;
    includeDetailedMetrics?: boolean;
    customSections?: string[];
    branding?: {
        logoUrl?: string;
        companyName?: string;
        reportTitle?: string;
    };
}
export interface EnhancedExportData {
    analytics?: AnalyticsResult;
    legalTrends?: LegalTrendAnalysis;
    benchmarkReport?: BenchmarkReport;
    complianceReport?: ComplianceMonitoringReport;
    customData?: any;
    metadata: {
        organizationName: string;
        generatedAt: Date;
        period: {
            start: Date;
            end: Date;
        };
    };
}
export declare class EnhancedExportService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Exports data in various formats with enhanced capabilities
     */
    exportData(data: EnhancedExportData, options: EnhancedExportOptions): Promise<Buffer | string>;
    /**
     * Generates a PDF report with enhanced formatting and charts
     */
    private generatePdfReport;
    /**
     * Generates a CSV report with multiple sheets/sections
     */
    private generateCsvReport;
    /**
     * Generates an Excel report with multiple sheets
     */
    private generateExcelReport;
    /**
     * Generates a JSON report with full data structure
     */
    private generateJsonReport;
    /**
     * Creates enhanced PDF content with charts and branding
     */
    private createEnhancedPdfContent;
    /**
     * Generates a summary report for quick overview
     */
    generateSummaryReport(data: EnhancedExportData, format?: 'pdf' | 'csv' | 'json'): Promise<Buffer | string>;
    /**
     * Exports specific data sections
     */
    exportCustomSections(data: EnhancedExportData, sections: string[], format?: 'pdf' | 'csv' | 'json'): Promise<Buffer | string>;
}
