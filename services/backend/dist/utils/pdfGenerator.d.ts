import { ComprehensiveReport } from '../services/ReportingService';
export declare class PdfGenerator {
    private static readonly COLORS;
    static generateReport(report: ComprehensiveReport): Promise<Buffer>;
    private static generateCoverPage;
    private static generateHeader;
    private static generateSummarySection;
    private static drawUsageChart;
    private static generatePerformanceSection;
    private static generateUsageSection;
    private static generateComplianceSection;
    private static generateRecommendationsSection;
    private static generateDetailedContent;
    private static generateFooter;
    private static drawSectionHeader;
    private static drawHorizontalLine;
    private static drawTable;
}
