import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AnalyticsService, AnalyticsResult, UsageReport } from './AnalyticsService';
import { TrendAnalysisService, LegalTrendAnalysis } from './TrendAnalysisService';
import { BenchmarkingService, BenchmarkReport } from './BenchmarkingService';
import { ComplianceMonitoringService, ComplianceMonitoringReport } from './ComplianceMonitoringService';
import { ReportingService } from './ReportingService';
import { BulkProcessingService } from './BulkProcessingService';
import { ChatService } from './ChatService';
import { DocumentAnalysisService } from './DocumentAnalysisService';
import { LegalDataUpdateService } from './LegalDataUpdateService';
import { AlertManager } from './kms/AlertManager';

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
    topDocumentTypes: Array<{ type: string; count: number }>;
    topLegalCategories: Array<{ category: string; count: number }>;
    riskLevelDistribution: Array<{ level: string; count: number }>;
    errorRate: number;
    responseTimeStats: {
      average: number;
      median: number;
      p95: number;
    };
    // Additional metrics from other services
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
  legalUpdates?: any[]; // Legal data updates
  insights: string[]; // Generated insights from all data
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
    dateRange: { start: Date; end: Date };
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

export class CentralizedAnalyticsService {
  private prisma: PrismaClient;
  private analyticsService: AnalyticsService;
  private trendAnalysisService: TrendAnalysisService;
  private benchmarkingService: BenchmarkingService;
  private complianceMonitoringService: ComplianceMonitoringService;
  private reportingService: ReportingService;
  private bulkProcessingService: BulkProcessingService;
  private chatService: ChatService;
  private documentAnalysisService: DocumentAnalysisService;
  private legalDataUpdateService: LegalDataUpdateService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.analyticsService = new AnalyticsService();
    this.trendAnalysisService = new TrendAnalysisService(prisma);
    this.benchmarkingService = new BenchmarkingService(prisma);
    this.complianceMonitoringService = new ComplianceMonitoringService(prisma, new AlertManager()); // AlertManager would be passed here
    this.reportingService = new ReportingService();
    this.bulkProcessingService = new BulkProcessingService();
    this.chatService = new ChatService(prisma);
    this.documentAnalysisService = new DocumentAnalysisService(prisma);
    this.legalDataUpdateService = new LegalDataUpdateService(prisma);
  }

  /**
   * Generates consolidated analytics from all available data sources
   */
  async generateConsolidatedAnalytics(query: ConsolidatedAnalyticsQuery): Promise<ConsolidatedAnalyticsResult> {
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
      const [
        chatMetrics,
        documentMetrics,
        bulkProcessingMetrics,
        legalTrends,
        benchmarkReport,
        complianceReport,
        legalUpdates
      ] = await Promise.all([
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
      const consolidatedResult: ConsolidatedAnalyticsResult = {
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
    } catch (error) {
      logger.error('Error generating consolidated analytics:', error);
      throw new Error('Failed to generate consolidated analytics');
    }
  }

  /**
   * Generates usage report with enhanced metrics
   */
  async generateEnhancedUsageReport(
    organizationId: string,
    period: 'week' | 'month' | 'quarter'
  ): Promise<UsageReport & { enhancedMetrics: any }> {
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
    } catch (error) {
      logger.error('Error generating enhanced usage report:', error);
      throw new Error('Failed to generate enhanced usage report');
    }
  }

  /**
   * Gets data for custom dashboard widgets
   */
  async getDashboardWidgetData(config: CustomDashboardConfig): Promise<DashboardWidgetData[]> {
    try {
      const widgetData: DashboardWidgetData[] = [];

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
    } catch (error) {
      logger.error('Error getting dashboard widget data:', error);
      throw new Error('Failed to get dashboard widget data');
    }
  }

  /**
   * Private helper methods
   */

  private async getChatMetrics(organizationId: string, startDate: Date, endDate: Date) {
    // In a real implementation, this would fetch actual chat metrics
    // For now, we'll return placeholder data
    return {
      totalMessages: 0,
      activeConversations: 0,
      avgResponseTime: 0,
      satisfactionRate: 0
    };
  }

  private async getDocumentMetrics(organizationId: string, startDate: Date, endDate: Date) {
    // In a real implementation, this would fetch actual document metrics
    // For now, we'll return placeholder data
    return {
      totalDocuments: 0,
      processedDocuments: 0,
      failedDocuments: 0,
      avgProcessingTime: 0
    };
  }

  private async getBulkProcessingMetrics(organizationId: string, startDate: Date, endDate: Date) {
    // In a real implementation, this would fetch actual bulk processing metrics
    // For now, we'll return placeholder data
    return {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      avgJobDuration: 0
    };
  }

  private async getLegalUpdates(startDate: Date, endDate: Date) {
    // In a real implementation, this would fetch actual legal updates
    // For now, we'll return placeholder data
    return [];
  }

  private generateInsights(
    analytics: AnalyticsResult,
    chatMetrics: any,
    documentMetrics: any,
    bulkProcessingMetrics: any
  ): string[] {
    const insights: string[] = [];

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

  private generateRecommendations(
    analytics: AnalyticsResult,
    chatMetrics: any,
    documentMetrics: any,
    bulkProcessingMetrics: any,
    legalTrends?: LegalTrendAnalysis,
    benchmarkReport?: BenchmarkReport,
    complianceReport?: ComplianceMonitoringReport
  ): string[] {
    const recommendations: string[] = [];

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

  private async getAnalyticsWidgetData(widget: any, filters: any) {
    // Implementation for analytics widget data
    return { placeholder: 'Analytics data' };
  }

  private async getTrendsWidgetData(widget: any, filters: any) {
    // Implementation for trends widget data
    return { placeholder: 'Trends data' };
  }

  private async getComplianceWidgetData(widget: any, filters: any) {
    // Implementation for compliance widget data
    return { placeholder: 'Compliance data' };
  }

  private async getChatWidgetData(widget: any, filters: any) {
    // Implementation for chat widget data
    return { placeholder: 'Chat data' };
  }
}