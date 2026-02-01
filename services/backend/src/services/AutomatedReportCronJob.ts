import { CronJob } from 'cron';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ReportingService } from './ReportingService';
import { CentralizedAnalyticsService } from './CentralizedAnalyticsService';
import { EmailService } from './EmailService';

export interface ReportSchedule {
  id: string;
  organizationId: string;
  reportType: 'usage' | 'performance' | 'compliance' | 'comprehensive' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  time: string; // HH:MM format
  recipients: string[];
  format: 'pdf' | 'csv' | 'json';
  customConfig?: any; // For custom reports
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AutomatedReportCronJob {
  private prisma: PrismaClient;
  private reportingService: ReportingService;
  private centralizedAnalyticsService: CentralizedAnalyticsService;
  private emailService: EmailService;
  private scheduledJobs: Map<string, CronJob> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.reportingService = new ReportingService();
    this.centralizedAnalyticsService = new CentralizedAnalyticsService(prisma);
    this.emailService = new EmailService();
  }

  /**
   * Starts all enabled scheduled reports
   */
  async start(): Promise<void> {
    try {
      // Load all enabled report schedules
      const schedules = await (this.prisma as any).reportSchedule.findMany({
        where: { isEnabled: true }
      });

      // Schedule each report
      for (const schedule of schedules) {
        await this.scheduleReportJob(schedule);
      }

      logger.info(`Started ${schedules.length} automated report jobs`);
    } catch (error) {
      logger.error('Error starting automated report cron jobs:', error);
      throw error;
    }
  }

  /**
   * Stops all scheduled jobs
   */
  stop(): void {
    for (const [id, job] of this.scheduledJobs) {
      job.stop();
      logger.info(`Stopped report job ${id}`);
    }
    this.scheduledJobs.clear();
  }

  /**
   * Adds a new report schedule
   */
  async addReportSchedule(schedule: Omit<ReportSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportSchedule> {
    try {
      const newSchedule = await (this.prisma as any).reportSchedule.create({
        data: {
          ...schedule,
          id: `rs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // If enabled, schedule the job immediately
      if (newSchedule.isEnabled) {
        await this.scheduleReportJob(newSchedule);
      }

      return newSchedule;
    } catch (error) {
      logger.error('Error adding report schedule:', error);
      throw error;
    }
  }

  /**
   * Updates an existing report schedule
   */
  async updateReportSchedule(id: string, updates: Partial<ReportSchedule>): Promise<ReportSchedule> {
    try {
      // Stop existing job if it exists
      const existingJob = this.scheduledJobs.get(id);
      if (existingJob) {
        existingJob.stop();
        this.scheduledJobs.delete(id);
      }

      // Update in database
      const updatedSchedule = await (this.prisma as any).reportSchedule.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      // If still enabled, reschedule the job
      if (updatedSchedule.isEnabled) {
        await this.scheduleReportJob(updatedSchedule);
      }

      return updatedSchedule;
    } catch (error) {
      logger.error(`Error updating report schedule ${id}:`, error);
      throw error;
    }
  }

  /**
   * Removes a report schedule
   */
  async removeReportSchedule(id: string): Promise<void> {
    try {
      // Stop existing job if it exists
      const existingJob = this.scheduledJobs.get(id);
      if (existingJob) {
        existingJob.stop();
        this.scheduledJobs.delete(id);
      }

      // Remove from database
      await (this.prisma as any).reportSchedule.delete({
        where: { id }
      });

      logger.info(`Removed report schedule ${id}`);
    } catch (error) {
      logger.error(`Error removing report schedule ${id}:`, error);
      throw error;
    }
  }

  /**
   * Generates a report immediately (for testing or manual triggers)
   */
  async generateReportNow(scheduleId: string): Promise<void> {
    try {
      const schedule = await (this.prisma as any).reportSchedule.findUnique({
        where: { id: scheduleId }
      });

      if (!schedule) {
        throw new Error(`Report schedule ${scheduleId} not found`);
      }

      await this.executeReportJob(schedule);
    } catch (error) {
      logger.error(`Error generating report now for schedule ${scheduleId}:`, error);
      throw error;
    }
  }

  /**
   * Gets status of all scheduled jobs
   */
  getJobStatus(): Array<{ id: string; running: boolean | undefined }> {
    const status = [];
    for (const [id, job] of this.scheduledJobs) {
      status.push({
        id,
        running: job.running
      });
    }
    return status;
  }

  /**
   * Private helper methods
   */

  private async scheduleReportJob(schedule: ReportSchedule): Promise<void> {
    try {
      const cronExpression = this.generateCronExpression(schedule);
      
      const job = new CronJob(cronExpression, async () => {
        try {
          await this.executeReportJob(schedule);
        } catch (error) {
          logger.error(`Error executing scheduled report ${schedule.id}:`, error);
        }
      });

      this.scheduledJobs.set(schedule.id, job);
      job.start();
      logger.info(`Scheduled report job ${schedule.id} with cron expression: ${cronExpression}`);
    } catch (error) {
      logger.error(`Error scheduling report job ${schedule.id}:`, error);
      throw error;
    }
  }

  private generateCronExpression(schedule: ReportSchedule): string {
    const [hours, minutes] = schedule.time.split(':').map(Number);

    switch (schedule.frequency) {
      case 'daily':
        return `${minutes} ${hours} * * *`;
      
      case 'weekly':
        const dayOfWeek = schedule.dayOfWeek !== undefined ? schedule.dayOfWeek : 1; // Default to Monday
        return `${minutes} ${hours} * * ${dayOfWeek}`;
      
      case 'monthly':
        const dayOfMonth = schedule.dayOfMonth !== undefined ? schedule.dayOfMonth : 1; // Default to 1st
        return `${minutes} ${hours} ${dayOfMonth} * *`;
      
      case 'quarterly':
        // Quarterly: Run on 1st day of January, April, July, October
        return `${minutes} ${hours} 1 1,4,7,10 *`;
      
      default:
        throw new Error(`Unsupported frequency: ${schedule.frequency}`);
    }
  }

  private async executeReportJob(schedule: ReportSchedule): Promise<void> {
    try {
      logger.info(`Executing scheduled report ${schedule.id} for organization ${schedule.organizationId}`);

      // Generate the report based on type
      let reportData: any;
      let reportBuffer: Buffer | string;

      switch (schedule.reportType) {
        case 'usage':
        case 'performance':
        case 'compliance':
        case 'comprehensive':
          // Use existing reporting service for standard reports
          reportData = await this.reportingService.generateComprehensiveReport({
            organizationId: schedule.organizationId,
            reportType: schedule.reportType,
            period: this.getPeriodFromFrequency(schedule.frequency),
            includeDetails: true
          });
          
          reportBuffer = await this.reportingService.exportReport(reportData, schedule.format);
          break;
        
        case 'custom':
          // Use centralized analytics service for custom reports
          const consolidatedData = await this.centralizedAnalyticsService.generateConsolidatedAnalytics({
            organizationId: schedule.organizationId,
            startDate: this.getStartDate(schedule.frequency),
            endDate: new Date(),
            includeTrends: true,
            includeBenchmarking: true,
            includeCompliance: true,
            includeLegalUpdates: true
          });
          
          // For custom reports, we'll export as JSON for now
          reportBuffer = JSON.stringify(consolidatedData, null, 2);
          break;
        
        default:
          throw new Error(`Unsupported report type: ${schedule.reportType}`);
      }

      // Send report to recipients
      await this.deliverReport(schedule, reportBuffer, reportData);
      
      logger.info(`Successfully executed scheduled report ${schedule.id}`);
    } catch (error) {
      logger.error(`Error executing scheduled report ${schedule.id}:`, error);
      throw error;
    }
  }

  private async deliverReport(schedule: ReportSchedule, reportBuffer: Buffer | string, reportData?: any): Promise<void> {
    try {
      // In a real implementation, we would send the report to all recipients
      // For now, we'll just log that delivery would happen
      
      for (const recipient of schedule.recipients) {
        logger.info(`Would send report to ${recipient} in ${schedule.format} format`);
        
        // Actual implementation would send emails or upload to cloud storage
        // await this.emailService.sendReportEmail(recipient, schedule, reportBuffer, reportData);
      }
    } catch (error) {
      logger.error(`Error delivering report for schedule ${schedule.id}:`, error);
      throw error;
    }
  }

  private getPeriodFromFrequency(frequency: ReportSchedule['frequency']): 'week' | 'month' | 'quarter' {
    switch (frequency) {
      case 'daily':
      case 'weekly':
        return 'week';
      case 'monthly':
        return 'month';
      case 'quarterly':
        return 'quarter';
      default:
        return 'month';
    }
  }

  private getStartDate(frequency: ReportSchedule['frequency']): Date {
    const now = new Date();
    const startDate = new Date(now);

    switch (frequency) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    return startDate;
  }
}