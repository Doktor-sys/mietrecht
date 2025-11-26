import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

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
    topDocumentTypes: Array<{ type: string; count: number }>;
    topLegalCategories: Array<{ category: string; count: number }>;
    riskLevelDistribution: Array<{ level: string; count: number }>;
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
    byService: Array<{ service: string; count: number; percentage: number }>;
    byDocumentType: Array<{ type: string; count: number; percentage: number }>;
    byRiskLevel: Array<{ level: string; count: number; percentage: number }>;
  };
  recommendations: string[];
}

export class AnalyticsService {
  /**
   * Generiert umfassende Analytics für eine Organisation
   */
  async generateAnalytics(query: AnalyticsQuery): Promise<AnalyticsResult> {
    try {
      const { organizationId, startDate, endDate, groupBy } = query;

      // Parallel alle Metriken sammeln
      const [
        apiRequests,
        documentAnalyses,
        chatInteractions,
        templateGenerations,
        bulkJobs,
        apiKey
      ] = await Promise.all([
        this.getApiRequestMetrics(organizationId, startDate, endDate),
        this.getDocumentAnalysisMetrics(organizationId, startDate, endDate),
        this.getChatInteractionMetrics(organizationId, startDate, endDate),
        this.getTemplateGenerationMetrics(organizationId, startDate, endDate),
        this.getBulkJobMetrics(organizationId, startDate, endDate),
        this.getQuotaInfo(organizationId)
      ]);

      // Trends generieren falls groupBy angegeben
      let trends;
      if (groupBy) {
        trends = await this.generateTrends(organizationId, startDate, endDate, groupBy);
      }

      const result: AnalyticsResult = {
        period: {
          start: startDate,
          end: endDate,
          groupBy
        },
        metrics: {
          totalRequests: apiRequests.total,
          documentAnalyses: documentAnalyses.total,
          chatInteractions: chatInteractions.total,
          templateGenerations: templateGenerations.total,
          bulkJobs: bulkJobs.total,
          averageConfidence: documentAnalyses.averageConfidence,
          topDocumentTypes: documentAnalyses.topTypes,
          topLegalCategories: chatInteractions.topCategories,
          riskLevelDistribution: documentAnalyses.riskDistribution,
          errorRate: apiRequests.errorRate,
          responseTimeStats: apiRequests.responseTimeStats
        },
        trends,
        quota: {
          used: apiKey?.quotaUsed || 0,
          limit: apiKey?.quotaLimit || 0,
          remaining: (apiKey?.quotaLimit || 0) - (apiKey?.quotaUsed || 0),
          utilizationRate: apiKey?.quotaLimit ?
            Math.round(((apiKey.quotaUsed || 0) / apiKey.quotaLimit) * 100) : 0
        }
      };

      return result;

    } catch (error) {
      logger.error('Error generating analytics:', error);
      throw new Error('Failed to generate analytics');
    }
  }

  /**
   * Generiert einen detaillierten Nutzungsbericht
   */
  async generateUsageReport(
    organizationId: string,
    period: 'week' | 'month' | 'quarter'
  ): Promise<UsageReport> {
    try {
      const { startDate, endDate } = this.getPeriodDates(period);

      const analytics = await this.generateAnalytics({
        organizationId,
        startDate,
        endDate
      });

      // Berechne Service-Breakdown
      const totalServices = analytics.metrics.documentAnalyses +
        analytics.metrics.chatInteractions +
        analytics.metrics.templateGenerations;

      const byService = [
        {
          service: 'Document Analysis',
          count: analytics.metrics.documentAnalyses,
          percentage: totalServices > 0 ?
            Math.round((analytics.metrics.documentAnalyses / totalServices) * 100) : 0
        },
        {
          service: 'Chat Interactions',
          count: analytics.metrics.chatInteractions,
          percentage: totalServices > 0 ?
            Math.round((analytics.metrics.chatInteractions / totalServices) * 100) : 0
        },
        {
          service: 'Template Generation',
          count: analytics.metrics.templateGenerations,
          percentage: totalServices > 0 ?
            Math.round((analytics.metrics.templateGenerations / totalServices) * 100) : 0
        }
      ];

      // Generiere Empfehlungen
      const recommendations = this.generateRecommendations(analytics);

      const report: UsageReport = {
        organizationId,
        reportPeriod: period,
        generatedAt: new Date(),
        summary: {
          totalApiCalls: analytics.metrics.totalRequests,
          totalDocuments: analytics.metrics.documentAnalyses,
          totalChatMessages: analytics.metrics.chatInteractions,
          totalBulkJobs: analytics.metrics.bulkJobs,
          averageProcessingTime: 0, // Not available in schema yet
          successRate: Math.round((1 - analytics.metrics.errorRate) * 100)
        },
        breakdown: {
          byService,
          byDocumentType: analytics.metrics.topDocumentTypes.map(item => ({
            type: item.type,
            count: item.count,
            percentage: analytics.metrics.documentAnalyses > 0 ?
              Math.round((item.count / analytics.metrics.documentAnalyses) * 100) : 0
          })),
          byRiskLevel: analytics.metrics.riskLevelDistribution.map(item => ({
            level: item.level,
            count: item.count,
            percentage: analytics.metrics.documentAnalyses > 0 ?
              Math.round((item.count / analytics.metrics.documentAnalyses) * 100) : 0
          }))
        },
        recommendations
      };

      return report;

    } catch (error) {
      logger.error('Error generating usage report:', error);
      throw new Error('Failed to generate usage report');
    }
  }

  /**
   * Exportiert Analytics-Daten in verschiedenen Formaten
   */
  async exportAnalytics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' | 'pdf'
  ): Promise<Buffer | string> {
    try {
      const analytics = await this.generateAnalytics({
        organizationId,
        startDate,
        endDate,
        groupBy: 'day'
      });

      switch (format) {
        case 'json':
          return JSON.stringify(analytics, null, 2);

        case 'csv':
          return this.convertToCSV(analytics);

        case 'pdf':
          return await this.generatePDFReport(analytics);

        default:
          throw new Error(`Unsupported export format: ${format} `);
      }

    } catch (error) {
      logger.error('Error exporting analytics:', error);
      throw new Error('Failed to export analytics');
    }
  }

  /**
   * Private Methoden für Metriken-Sammlung
   */
  private async getApiRequestMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const apiKeys = await prisma.apiKey.findMany({
      where: { organizationId },
      select: { id: true }
    });

    const apiKeyIds = apiKeys.map(key => key.id);

    // Note: ApiRequest schema does not currently have 'status' or 'duration' fields.
    // Assuming 0 errors and default response times until schema is updated.
    const total = await prisma.apiRequest.count({
      where: {
        apiKeyId: { in: apiKeyIds },
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    return {
      total,
      errorRate: 0, // Placeholder until schema update
      responseTimeStats: {
        average: 0, // Placeholder until schema update
        median: 0,
        p95: 0
      }
    };
  }

  private async getDocumentAnalysisMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const documents = await prisma.document.findMany({
      where: {
        organizationId,
        uploadedAt: { gte: startDate, lte: endDate }
      },
      include: {
        analysis: true
      }
    });

    const total = documents.length;
    const withAnalysis = documents.filter(doc => doc.analysis);

    const averageConfidence = withAnalysis.length > 0 ?
      withAnalysis.reduce((sum, doc) => sum + (doc.analysis?.confidence || 0), 0) / withAnalysis.length : 0;

    // Top Document Types
    const typeCount = documents.reduce((acc, doc) => {
      acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTypes = Object.entries(typeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Risk Level Distribution
    const riskCount = withAnalysis.reduce((acc, doc) => {
      const riskLevel = doc.analysis?.riskLevel || 'unknown';
      acc[riskLevel] = (acc[riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const riskDistribution = Object.entries(riskCount)
      .map(([level, count]) => ({ level, count }));

    return {
      total,
      averageConfidence,
      topTypes,
      riskDistribution
    };
  }

  private async getChatInteractionMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const interactions = await prisma.chatInteraction.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const total = interactions.length;

    // Mock categories for now as we don't extract them from text yet
    const topCategories = [
      { category: 'General', count: total }
    ];

    return {
      total,
      topCategories
    };
  }

  private async getTemplateGenerationMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const total = await prisma.templateGeneration.count({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    return { total };
  }

  private async getBulkJobMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const total = await prisma.batchJob.count({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    return { total };
  }

  private async getQuotaInfo(organizationId: string) {
    return await prisma.apiKey.findFirst({
      where: { organizationId },
      select: {
        quotaUsed: true,
        quotaLimit: true
      }
    });
  }

  private async generateTrends(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month'
  ) {
    // Basic client-side aggregation
    const apiKeys = await prisma.apiKey.findMany({
      where: { organizationId },
      select: { id: true }
    });
    const apiKeyIds = apiKeys.map(k => k.id);

    const requests = await prisma.apiRequest.findMany({
      where: {
        apiKeyId: { in: apiKeyIds },
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { createdAt: true }
    });

    const documents = await prisma.document.findMany({
      where: {
        organizationId,
        uploadedAt: { gte: startDate, lte: endDate }
      },
      select: { uploadedAt: true }
    });

    const chats = await prisma.chatInteraction.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { createdAt: true }
    });

    // Helper to format date key
    const getKey = (date: Date) => {
      if (groupBy === 'month') return date.toISOString().slice(0, 7); // YYYY-MM
      if (groupBy === 'week') {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
        return d.toISOString().slice(0, 10);
      }
      return date.toISOString().slice(0, 10); // YYYY-MM-DD
    };

    const trendMap: Record<string, { date: string, requests: number, documents: number, chats: number }> = {};

    requests.forEach(r => {
      const key = getKey(r.createdAt);
      if (!trendMap[key]) trendMap[key] = { date: key, requests: 0, documents: 0, chats: 0 };
      trendMap[key].requests++;
    });
    documents.forEach(d => {
      const key = getKey(d.uploadedAt);
      if (!trendMap[key]) trendMap[key] = { date: key, requests: 0, documents: 0, chats: 0 };
      trendMap[key].documents++;
    });
    chats.forEach(c => {
      const key = getKey(c.createdAt);
      if (!trendMap[key]) trendMap[key] = { date: key, requests: 0, documents: 0, chats: 0 };
      trendMap[key].chats++;
    });

    return Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));
  }

  private generateRecommendations(analytics: AnalyticsResult): string[] {
    const recommendations: string[] = [];

    // Quota-basierte Empfehlungen
    if (analytics.quota.utilizationRate > 80) {
      recommendations.push('Ihre monatliche Quota ist zu 80% ausgeschöpft. Erwägen Sie ein Upgrade Ihres Plans.');
    }

    // Error Rate Empfehlungen
    if (analytics.metrics.errorRate > 0.05) {
      recommendations.push('Ihre Fehlerrate liegt über 5%. Überprüfen Sie Ihre API-Implementierung.');
    }

    // Confidence-basierte Empfehlungen
    if (analytics.metrics.averageConfidence < 0.7 && analytics.metrics.averageConfidence > 0) {
      recommendations.push('Die durchschnittliche Konfidenz Ihrer Dokumentenanalysen ist niedrig. Überprüfen Sie die Qualität Ihrer Eingabedokumente.');
    }

    // Nutzungsmuster-Empfehlungen
    if (analytics.metrics.bulkJobs > analytics.metrics.documentAnalyses * 0.1) {
      recommendations.push('Sie nutzen Bulk-Processing effizient. Erwägen Sie weitere Automatisierung Ihrer Workflows.');
    }

    return recommendations;
  }

  private getPeriodDates(period: 'week' | 'month' | 'quarter') {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
    }

    return { startDate, endDate };
  }

  private convertToCSV(analytics: AnalyticsResult): string {
    const lines: string[] = [];
    lines.push('Metric,Value');
    lines.push(`Total Requests, ${analytics.metrics.totalRequests} `);
    lines.push(`Document Analyses, ${analytics.metrics.documentAnalyses} `);
    lines.push(`Chat Interactions, ${analytics.metrics.chatInteractions} `);
    lines.push(`Template Generations, ${analytics.metrics.templateGenerations} `);
    lines.push(`Average Confidence, ${analytics.metrics.averageConfidence} `);
    lines.push(`Error Rate, ${analytics.metrics.errorRate} `);

    if (analytics.trends && analytics.trends.length > 0) {
      lines.push('');
      lines.push('Trends');
      lines.push('Date,Requests,Documents,Chats');
      analytics.trends.forEach(t => {
        lines.push(`${t.date},${t.requests},${t.documents},${t.chats} `);
      });
    }

    return lines.join('\n');
  }

  private async generatePDFReport(analytics: AnalyticsResult): Promise<Buffer> {
    const content = `Analytics Report

Period: ${analytics.period.start.toISOString()} - ${analytics.period.end.toISOString()}
Generated: ${new Date().toISOString()}

Metrics:
- Total Requests: ${analytics.metrics.totalRequests}
- Documents: ${analytics.metrics.documentAnalyses}
- Chats: ${analytics.metrics.chatInteractions}

(PDF generation not available, returning text representation)`;

    return Buffer.from(content);
  }
}