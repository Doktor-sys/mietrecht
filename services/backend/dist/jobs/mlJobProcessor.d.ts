export type MLJobType = 'CASE_RISK_ASSESSMENT' | 'STRATEGY_RECOMMENDATIONS' | 'DOCUMENT_SUMMARIZATION' | 'PREDICTIVE_ANALYSIS' | 'LEGAL_RESEARCH';
export type MLJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type MLJobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export interface MLJobData {
    caseRiskAssessment?: {
        caseData: any;
        clientData: any;
        historicalData: any;
    };
    strategyRecommendations?: {
        caseData: any;
        clientProfile: any;
        lawyerProfile: any;
        riskAssessment: any;
        historicalData: any;
    };
    documentSummarization?: {
        document: any;
    };
    predictiveAnalysis?: {
        caseData: any;
        historicalData: any;
    };
    legalResearch?: {
        query: string;
        jurisdiction: string;
    };
}
export interface MLJob {
    id: string;
    type: MLJobType;
    priority: MLJobPriority;
    status: MLJobStatus;
    data: MLJobData;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    cancelledAt?: Date;
    result?: any;
    error?: string;
    retryCount: number;
    maxRetries: number;
    userId?: string;
    organizationId?: string;
}
declare class MLJobQueue {
    private jobs;
    private processing;
    private maxConcurrentJobs;
    private currentJobs;
    addJob(job: Omit<MLJob, 'id' | 'status' | 'createdAt' | 'retryCount'>): string;
    private insertJobSorted;
    private startProcessing;
    private getNextPendingJob;
    private processJob;
    private executeJob;
    getJob(jobId: string): MLJob | undefined;
    getUserJobs(userId: string): MLJob[];
    getJobsByStatus(status: MLJobStatus): MLJob[];
    getStats(): {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
        cancelled: number;
    };
    stop(): void;
    private generateJobId;
    private sleep;
}
export declare const mlJobQueue: MLJobQueue;
export declare const addCaseRiskAssessmentJob: (caseData: any, clientData: any, historicalData: any, priority?: MLJobPriority, userId?: string, organizationId?: string) => string;
export declare const addStrategyRecommendationsJob: (caseData: any, clientProfile: any, lawyerProfile: any, riskAssessment: any, historicalData: any, priority?: MLJobPriority, userId?: string, organizationId?: string) => string;
export declare const addDocumentSummarizationJob: (document: any, priority?: MLJobPriority, userId?: string, organizationId?: string) => string;
export default mlJobQueue;
