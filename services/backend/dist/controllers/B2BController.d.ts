import { Response } from 'express';
import { ApiKeyRequest } from '../middleware/apiKeyAuth';
/**
 * B2B Controller für die Enterprise-API
 * Stellt alle B2B-Funktionen für externe Partner bereit
 */
export declare class B2BController {
    private chatService;
    private documentAnalysisService;
    private templateService;
    private lawyerMatchingService;
    private bulkProcessingService;
    private analyticsService;
    private partnershipService;
    constructor();
    /**
     * Einzeldokument analysieren
     */
    analyzeDocument: (req: ApiKeyRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Batch-Analyse mehrerer Dokumente
     */
    batchAnalyze: (req: ApiKeyRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * KI-Chat-Anfrage
     */
    chatQuery: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Musterdokument generieren
     */
    generateTemplate: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Anwaltssuche
     */
    searchLawyers: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Nutzungsstatistiken abrufen
     */
    getUsageAnalytics: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Webhook konfigurieren
     */
    configureWebhook: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * API-Status und Limits abrufen
     */
    getApiStatus: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Bulk Chat-Anfragen verarbeiten
     */
    bulkChatQuery: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Bulk-Job-Status abrufen
     */
    getBulkJobStatus: (req: ApiKeyRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Bulk-Job abbrechen
     */
    cancelBulkJob: (req: ApiKeyRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Erweiterte Analytics abrufen
     */
    getAdvancedAnalytics: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Nutzungsbericht generieren
     */
    generateUsageReport: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Analytics exportieren
     */
    exportAnalytics: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Alle Bulk-Jobs für Organisation auflisten
     */
    listBulkJobs: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Performance-Metriken für einen Bulk-Job abrufen
     */
    getBulkJobPerformance: (req: ApiKeyRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Bulk-Processing-Statistiken für Organisation abrufen
     */
    getBulkProcessingStats: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Optimierte Bulk-Analyse mit erweiterten Optionen
     */
    optimizedBatchAnalyze: (req: ApiKeyRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Create a new partnership
     */
    createPartnership: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Get all partnerships for an organization
     */
    getPartnerships: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Get a specific partnership by ID
     */
    getPartnershipById: (req: ApiKeyRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Update a partnership
     */
    updatePartnership: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Delete a partnership
     */
    deletePartnership: (req: ApiKeyRequest, res: Response) => Promise<void>;
    /**
     * Get partnership interactions
     */
    getPartnershipInteractions: (req: ApiKeyRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
}
