import { EventEmitter } from 'events';
export interface BulkJobOptions {
    organizationId: string;
    type: 'document_analysis' | 'chat_bulk' | 'template_generation';
    items: any[];
    metadata?: any;
    webhookUrl?: string;
    priority?: 'low' | 'normal' | 'high';
    maxRetries?: number;
    retryDelay?: number;
    batchSize?: number;
    timeoutPerItem?: number;
}
export interface BulkJobProgress {
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    totalItems: number;
    processedItems: number;
    successfulItems: number;
    failedItems: number;
    progress: number;
    estimatedTimeRemaining?: number;
    results?: any[];
    errors?: any[];
    performance?: {
        startedAt?: Date;
        averageProcessingTime?: number;
        throughput?: number;
        peakMemoryUsage?: number;
        currentMemoryUsage?: number;
    };
    retryInfo?: {
        maxRetries: number;
        currentRetries: number;
        retryableErrors: number;
    };
}
export interface DocumentBulkAnalysisItem {
    id: string;
    filename: string;
    content: Buffer;
    mimeType: string;
    documentType: string;
    metadata?: any;
}
export interface ChatBulkQueryItem {
    id: string;
    query: string;
    context?: any;
    sessionId?: string;
}
export declare class BulkProcessingService extends EventEmitter {
    private documentAnalysisService;
    private aiResponseGenerator;
    private activeJobs;
    constructor();
    /**
     * Startet einen neuen Bulk-Job
     */
    startBulkJob(options: BulkJobOptions): Promise<string>;
    /**
     * Ruft den Status eines Bulk-Jobs ab
     */
    getBulkJobStatus(jobId: string): Promise<BulkJobProgress | null>;
    /**
     * Bricht einen laufenden Bulk-Job ab
     */
    cancelBulkJob(jobId: string): Promise<boolean>;
    /**
     * Löscht abgeschlossene Bulk-Jobs (Cleanup)
     */
    cleanupCompletedJobs(olderThanDays?: number): Promise<number>;
    /**
     * Private Methode für asynchrone Job-Verarbeitung
     */
    private processJobAsync;
    /**
     * Verarbeitet ein einzelnes Dokument für Bulk-Analyse
     */
    private processDocumentAnalysis;
    /**
     * Verarbeitet eine Chat-Anfrage für Bulk-Verarbeitung
     */
    private processChatQuery;
    /**
     * Verarbeitet Template-Generierung für Bulk-Verarbeitung
     */
    private processTemplateGeneration;
    /**
     * Aktualisiert den Job-Progress in der Datenbank
     */
    private updateJobProgress;
    /**
     * Sendet Webhook-Benachrichtigung
     */
    private sendWebhookNotification;
    /**
     * Verarbeitet ein Item basierend auf dem Job-Typ
     */
    private processItemWithType;
    /**
     * Teilt Array in Chunks für Batch-Verarbeitung
     */
    private chunkArray;
    /**
     * Prüft ob ein Fehler retry-fähig ist
     */
    private isRetryableError;
    /**
     * Aktualisiert Job-Progress mit erweiterten Metriken
     */
    private updateJobProgressWithMetrics;
    /**
     * Ruft detaillierte Performance-Metriken für einen Job ab
     */
    getJobPerformanceMetrics(jobId: string): Promise<any>;
    /**
     * Ruft Bulk-Processing-Statistiken für eine Organisation ab
     */
    getBulkProcessingStats(organizationId: string, days?: number): Promise<any>;
    /**
     * Berechnet Trends für Bulk-Processing
     */
    private calculateBulkProcessingTrends;
}
