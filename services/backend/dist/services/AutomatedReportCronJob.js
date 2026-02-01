"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomatedReportCronJob = void 0;
const cron_1 = require("cron");
const logger_1 = require("../utils/logger");
const ReportingService_1 = require("./ReportingService");
const CentralizedAnalyticsService_1 = require("./CentralizedAnalyticsService");
const EmailService_1 = require("./EmailService");
class AutomatedReportCronJob {
    constructor(prisma) {
        this.scheduledJobs = new Map();
        this.prisma = prisma;
        this.reportingService = new ReportingService_1.ReportingService();
        this.centralizedAnalyticsService = new CentralizedAnalyticsService_1.CentralizedAnalyticsService(prisma);
        this.emailService = new EmailService_1.EmailService();
    }
    /**
     * Starts all enabled scheduled reports
     */
    async start() {
        try {
            // Load all enabled report schedules
            const schedules = await this.prisma.reportSchedule.findMany({
                where: { isEnabled: true }
            });
            // Schedule each report
            for (const schedule of schedules) {
                await this.scheduleReportJob(schedule);
            }
            logger_1.logger.info(`Started ${schedules.length} automated report jobs`);
        }
        catch (error) {
            logger_1.logger.error('Error starting automated report cron jobs:', error);
            throw error;
        }
    }
    /**
     * Stops all scheduled jobs
     */
    stop() {
        for (const [id, job] of this.scheduledJobs) {
            job.stop();
            logger_1.logger.info(`Stopped report job ${id}`);
        }
        this.scheduledJobs.clear();
    }
    /**
     * Adds a new report schedule
     */
    async addReportSchedule(schedule) {
        try {
            const newSchedule = await this.prisma.reportSchedule.create({
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
        }
        catch (error) {
            logger_1.logger.error('Error adding report schedule:', error);
            throw error;
        }
    }
    /**
     * Updates an existing report schedule
     */
    async updateReportSchedule(id, updates) {
        try {
            // Stop existing job if it exists
            const existingJob = this.scheduledJobs.get(id);
            if (existingJob) {
                existingJob.stop();
                this.scheduledJobs.delete(id);
            }
            // Update in database
            const updatedSchedule = await this.prisma.reportSchedule.update({
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
        }
        catch (error) {
            logger_1.logger.error(`Error updating report schedule ${id}:`, error);
            throw error;
        }
    }
    /**
     * Removes a report schedule
     */
    async removeReportSchedule(id) {
        try {
            // Stop existing job if it exists
            const existingJob = this.scheduledJobs.get(id);
            if (existingJob) {
                existingJob.stop();
                this.scheduledJobs.delete(id);
            }
            // Remove from database
            await this.prisma.reportSchedule.delete({
                where: { id }
            });
            logger_1.logger.info(`Removed report schedule ${id}`);
        }
        catch (error) {
            logger_1.logger.error(`Error removing report schedule ${id}:`, error);
            throw error;
        }
    }
    /**
     * Generates a report immediately (for testing or manual triggers)
     */
    async generateReportNow(scheduleId) {
        try {
            const schedule = await this.prisma.reportSchedule.findUnique({
                where: { id: scheduleId }
            });
            if (!schedule) {
                throw new Error(`Report schedule ${scheduleId} not found`);
            }
            await this.executeReportJob(schedule);
        }
        catch (error) {
            logger_1.logger.error(`Error generating report now for schedule ${scheduleId}:`, error);
            throw error;
        }
    }
    /**
     * Gets status of all scheduled jobs
     */
    getJobStatus() {
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
    async scheduleReportJob(schedule) {
        try {
            const cronExpression = this.generateCronExpression(schedule);
            const job = new cron_1.CronJob(cronExpression, async () => {
                try {
                    await this.executeReportJob(schedule);
                }
                catch (error) {
                    logger_1.logger.error(`Error executing scheduled report ${schedule.id}:`, error);
                }
            });
            this.scheduledJobs.set(schedule.id, job);
            job.start();
            logger_1.logger.info(`Scheduled report job ${schedule.id} with cron expression: ${cronExpression}`);
        }
        catch (error) {
            logger_1.logger.error(`Error scheduling report job ${schedule.id}:`, error);
            throw error;
        }
    }
    generateCronExpression(schedule) {
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
    async executeReportJob(schedule) {
        try {
            logger_1.logger.info(`Executing scheduled report ${schedule.id} for organization ${schedule.organizationId}`);
            // Generate the report based on type
            let reportData;
            let reportBuffer;
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
            logger_1.logger.info(`Successfully executed scheduled report ${schedule.id}`);
        }
        catch (error) {
            logger_1.logger.error(`Error executing scheduled report ${schedule.id}:`, error);
            throw error;
        }
    }
    async deliverReport(schedule, reportBuffer, reportData) {
        try {
            // In a real implementation, we would send the report to all recipients
            // For now, we'll just log that delivery would happen
            for (const recipient of schedule.recipients) {
                logger_1.logger.info(`Would send report to ${recipient} in ${schedule.format} format`);
                // Actual implementation would send emails or upload to cloud storage
                // await this.emailService.sendReportEmail(recipient, schedule, reportBuffer, reportData);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error delivering report for schedule ${schedule.id}:`, error);
            throw error;
        }
    }
    getPeriodFromFrequency(frequency) {
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
    getStartDate(frequency) {
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
exports.AutomatedReportCronJob = AutomatedReportCronJob;
