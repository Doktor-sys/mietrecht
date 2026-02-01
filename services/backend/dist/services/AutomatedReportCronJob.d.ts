import { PrismaClient } from '@prisma/client';
export interface ReportSchedule {
    id: string;
    organizationId: string;
    reportType: 'usage' | 'performance' | 'compliance' | 'comprehensive' | 'custom';
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    recipients: string[];
    format: 'pdf' | 'csv' | 'json';
    customConfig?: any;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class AutomatedReportCronJob {
    private prisma;
    private reportingService;
    private centralizedAnalyticsService;
    private emailService;
    private scheduledJobs;
    constructor(prisma: PrismaClient);
    /**
     * Starts all enabled scheduled reports
     */
    start(): Promise<void>;
    /**
     * Stops all scheduled jobs
     */
    stop(): void;
    /**
     * Adds a new report schedule
     */
    addReportSchedule(schedule: Omit<ReportSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportSchedule>;
    /**
     * Updates an existing report schedule
     */
    updateReportSchedule(id: string, updates: Partial<ReportSchedule>): Promise<ReportSchedule>;
    /**
     * Removes a report schedule
     */
    removeReportSchedule(id: string): Promise<void>;
    /**
     * Generates a report immediately (for testing or manual triggers)
     */
    generateReportNow(scheduleId: string): Promise<void>;
    /**
     * Gets status of all scheduled jobs
     */
    getJobStatus(): Array<{
        id: string;
        running: boolean | undefined;
    }>;
    /**
     * Private helper methods
     */
    private scheduleReportJob;
    private generateCronExpression;
    private executeReportJob;
    private deliverReport;
    private getPeriodFromFrequency;
    private getStartDate;
}
