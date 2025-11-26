import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AnalyticsService } from './AnalyticsService';
import { BulkProcessingService } from './BulkProcessingService';
import { EmailService } from './EmailService';
import { PdfGenerator } from '../utils/pdfGenerator';

const prisma = new PrismaClient();

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
    byService: Array<{ service: string; count: number; percentage: number }>;
    byDocumentType: Array<{ type: string; count: number; percentage: number }>;
    byTimeOfDay: Array<{ hour: number; count: number }>;
    trends: Array<{ date: string; requests: number; documents: number; chats: number }>;
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

export class ReportingService {
  private analyticsService: AnalyticsService;
  private bulkProcessingService: BulkProcessingService;
  private emailService: EmailService;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.bulkProcessingService = new BulkProcessingService();
    this.emailService = new EmailService();
  }

  /**
   * Generiert einen umfassenden Bericht für Business-Kunden
   */
  async generateComprehensiveReport(options: ReportOptions): Promise<ComprehensiveReport> {
    try {
      const { organizationId, period, startDate, endDate } = options;
      const { start, end } = this.calculatePeriodDates(period, startDate, endDate);

      logger.info(`Generating comprehensive report for organization ${organizationId}`, {
        period: { start, end },
        reportType: options.reportType
      });

      // Sammle alle erforderlichen Daten parallel
      const [
        analyticsData,
        bulkStats,
        usageData,
        complianceData,
        performanceData
      ] = await Promise.all([
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

      const report: ComprehensiveReport = {
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

    } catch (error) {
      logger.error('Error generating comprehensive report:', error);
      throw new Error('Failed to generate comprehensive report');
    }
  }

  /**
   * Exportiert Bericht in verschiedenen Formaten
   */
  async exportReport(report: ComprehensiveReport, format: 'json' | 'pdf' | 'csv'): Promise<Buffer | string> {
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
    } catch (error) {
      logger.error('Error exporting report:', error);
      throw new Error('Failed to export report');
    }
  }

  /**
   * Generiert geplante Berichte für alle aktiven Organisationen
   */
  async generateScheduledReports(period: 'week' | 'month' = 'week'): Promise<void> {
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

        } catch (orgError) {
          logger.error(`Failed to generate report for organization ${org.id}:`, orgError);
        }
      }

    } catch (error) {
      logger.error('Error generating scheduled reports:', error);
      throw new Error('Failed to generate scheduled reports');
    }
  }

  /**
   * Private Hilfsmethoden
   */
  private calculatePeriodDates(
    period: string,
    startDate?: Date,
    endDate?: Date
  ): { start: Date; end: Date } {
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

  private getDaysDifference(start: Date, end: Date): number {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private formatDuration(start: Date, end: Date): string {
    const days = this.getDaysDifference(start, end);
    if (days <= 7) return `${days} days`;
    if (days <= 31) return `${Math.ceil(days / 7)} weeks`;
    if (days <= 365) return `${Math.ceil(days / 30)} months`;
    return `${Math.ceil(days / 365)} years`;
  }

  private calculateThroughput(total: number, start: Date, end: Date, unit: 'hour' | 'day'): number {
    const duration = (end.getTime() - start.getTime()) / 1000; // seconds
    const divisor = unit === 'hour' ? 3600 : 86400; // seconds in hour/day
    const periods = duration / divisor;
    return periods > 0 ? Math.round(total / periods) : 0;
  }

  private calculateCostSummary(analyticsData: any) {
    // Vereinfachte Kostenberechnung - in Produktion würde dies auf echten Preisen basieren
    const documentCost = 0.10; // €0.10 per document
    const chatCost = 0.05; // €0.05 per chat
    const bulkJobCost = 1.00; // €1.00 per bulk job

    const totalCost =
      (analyticsData.metrics.documentAnalyses * documentCost) +
      (analyticsData.metrics.chatInteractions * chatCost) +
      (analyticsData.metrics.bulkJobs * bulkJobCost);

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      costPerDocument: documentCost,
      costPerChat: chatCost,
      costPerBulkJob: bulkJobCost
    };
  }

  private async getUsageBreakdown(organizationId: string, start: Date, end: Date) {
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
    }, {} as Record<string, number>);

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

  private async getComplianceData(organizationId: string, start: Date, end: Date) {
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

  private async getPerformanceMetrics(organizationId: string, start: Date, end: Date) {
    // Placeholder for performance metrics
    return {
      uptime: 99.9,
      averageProcessingTime: 1500, // ms
      peakProcessingTime: 3000, // ms
      resourceUtilization: 45 // %
    };
  }

  private generateRecommendations(analyticsData: any, bulkStats: any, performanceData: any) {
    const recommendations = [];

    // Performance-basierte Empfehlungen
    if (performanceData.averageProcessingTime > 2000) {
      recommendations.push({
        category: 'Performance',
        priority: 'high' as const,
        title: 'Optimize Document Processing',
        description: 'Average processing time is above optimal threshold. Consider using batch processing for better efficiency.',
        estimatedImpact: '30% faster processing'
      });
    }

    // Nutzungsbasierte Empfehlungen
    if (analyticsData.metrics.bulkJobs < analyticsData.metrics.documentAnalyses * 0.1) {
      recommendations.push({
        category: 'Efficiency',
        priority: 'medium' as const,
        title: 'Increase Bulk Processing Usage',
        description: 'You could benefit from using bulk processing for multiple documents to reduce costs and improve efficiency.',
        estimatedImpact: '20% cost reduction'
      });
    }

    // Quota-basierte Empfehlungen
    if (analyticsData.quota && analyticsData.quota.utilizationRate > 80) {
      recommendations.push({
        category: 'Capacity',
        priority: 'high' as const,
        title: 'Consider Plan Upgrade',
        description: 'Your quota utilization is high. Consider upgrading your plan to avoid service interruptions.',
        estimatedImpact: 'Prevent service disruption'
      });
    }

    return recommendations;
  }

  private generateAlerts(analyticsData: any, performanceData: any) {
    const alerts = [];

    if (analyticsData.metrics.errorRate > 0.05) {
      alerts.push({
        type: 'warning' as const,
        message: `Error rate is ${Math.round(analyticsData.metrics.errorRate * 100)}%, which is above the 5% threshold`,
        timestamp: new Date()
      });
    }

    if (performanceData.uptime < 99.5) {
      alerts.push({
        type: 'error' as const,
        message: `System uptime is ${performanceData.uptime}%, below the 99.5% SLA`,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  private async saveReportMetadata(report: ComprehensiveReport): Promise<void> {
    try {
      await (prisma as any).reportGeneration.create({
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
    } catch (error) {
      logger.warn('Failed to save report metadata:', error);
    }
  }

  private convertReportToCSV(report: ComprehensiveReport): string {
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

  private async generateReportPDF(report: ComprehensiveReport): Promise<Buffer> {
    return await PdfGenerator.generateReport(report);
  }

  private async deliverReport(organization: any, report: ComprehensiveReport): Promise<void> {
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

      logger.info(`Report delivered for organization ${organization.id} to ${recipientEmail}`);
    } catch (error) {
      logger.error(`Failed to deliver report for organization ${organization.id}:`, error);
      // Wir werfen den Fehler nicht weiter, um den Prozess nicht zu unterbrechen
    }
  }
}