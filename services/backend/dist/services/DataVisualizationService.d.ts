import { PrismaClient } from '@prisma/client';
import { LegalTrendAnalysis } from './TrendAnalysisService';
import { AnalyticsResult } from './AnalyticsService';
export interface ChartDataPoint {
    x: string | number;
    y: number;
    label?: string;
}
export interface TimeSeriesData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        borderColor?: string;
        backgroundColor?: string;
        fill?: boolean;
    }>;
}
export interface PieChartData {
    labels: string[];
    data: number[];
    backgroundColors: string[];
}
export interface HeatmapData {
    xLabels: string[];
    yLabels: string[];
    data: number[][];
}
export interface DashboardVisualizationConfig {
    organizationId: string;
    visualizationType: 'trendLine' | 'usagePie' | 'heatmap' | 'barChart' | 'scatterPlot';
    dataType: 'legalTrends' | 'usageMetrics' | 'performance' | 'compliance';
    dateRange: {
        start: Date;
        end: Date;
    };
    filters?: {
        categories?: string[];
        jurisdictions?: string[];
        documentTypes?: string[];
    };
    options?: {
        width?: number;
        height?: number;
        showLegend?: boolean;
        showTooltips?: boolean;
    };
}
export interface VisualizationResult {
    id: string;
    type: string;
    title: string;
    data: TimeSeriesData | PieChartData | HeatmapData | ChartDataPoint[];
    config: any;
    generatedAt: Date;
}
export declare class DataVisualizationService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Generates a time series chart for legal trends
     */
    generateLegalTrendChart(trends: LegalTrendAnalysis, config: DashboardVisualizationConfig): Promise<VisualizationResult>;
    /**
     * Generates a pie chart for usage metrics
     */
    generateUsagePieChart(analytics: AnalyticsResult, config: DashboardVisualizationConfig): Promise<VisualizationResult>;
    /**
     * Generates a heatmap for compliance data
     */
    generateComplianceHeatmap(complianceData: any, // ComplianceMonitoringReport would be the actual type
    config: DashboardVisualizationConfig): Promise<VisualizationResult>;
    /**
     * Generates a bar chart for performance metrics
     */
    generatePerformanceBarChart(analytics: AnalyticsResult, config: DashboardVisualizationConfig): Promise<VisualizationResult>;
    /**
     * Generates a scatter plot for correlation analysis
     */
    generateScatterPlot(analytics: AnalyticsResult, config: DashboardVisualizationConfig): Promise<VisualizationResult>;
    /**
     * Generates multiple visualizations based on configuration
     */
    generateDashboardVisualizations(config: DashboardVisualizationConfig): Promise<VisualizationResult[]>;
    /**
     * Private helper methods for sample visualizations
     */
    private generateSampleTrendLine;
    private generateSamplePieChart;
    private generateSampleHeatmap;
    private generateSampleBarChart;
    private generateSampleScatterPlot;
}
