import { PrismaClient } from '@prisma/client';
import { AuditService } from './AuditService';
export interface DSGVODataSubjectRequest {
    id: string;
    userId: string;
    requestId: string;
    requestType: 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability';
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    requestData: any;
    response?: any;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
    rejectionReason?: string;
}
export interface DSGVOComplianceReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    dataSubjectRequests: {
        total: number;
        byType: Record<string, number>;
        averageResponseTime: number;
        fulfillmentRate: number;
    };
    consentManagement: {
        totalConsents: number;
        activeConsents: number;
        revokedConsents: number;
        consentTypes: Record<string, number>;
    };
    dataBreaches: {
        total: number;
        reported: number;
        resolved: number;
        averageResolutionTime: number;
    };
    dataProtectionImpactAssessments: {
        total: number;
        completed: number;
        pending: number;
    };
    complianceScore: number;
}
export interface ConsentRecord {
    id: string;
    userId: string;
    consentType: string;
    givenAt: Date;
    withdrawnAt?: Date;
    consentText: string;
    version: string;
}
export declare class EnhancedDSGVOComplianceService {
    private prisma;
    private auditService;
    private emailService;
    constructor(prisma: PrismaClient, auditService: AuditService);
    /**
     * Erstellt eine neue Datensubjektanfrage
     */
    createDataSubjectRequest(userId: string, requestType: DSGVODataSubjectRequest['requestType'], requestData: any): Promise<DSGVODataSubjectRequest>;
    /**
     * Verarbeitet eine Datensubjektanfrage
     */
    processDataSubjectRequest(requestId: string, response: any): Promise<DSGVODataSubjectRequest>;
    /**
     * Lehnt eine Datensubjektanfrage ab
     */
    rejectDataSubjectRequest(requestId: string, reason: string): Promise<DSGVODataSubjectRequest>;
    /**
     * Benachrichtigt den Benutzer über die Abschluss einer Anfrage
     */
    private notifyUserAboutRequestCompletion;
    /**
     * Benachrichtigt den Benutzer über die Ablehnung einer Anfrage
     */
    private notifyUserAboutRequestRejection;
    /**
     * Gibt alle Datensubjektanfragen eines Benutzers zurück
     */
    getDataSubjectRequestsForUser(userId: string): Promise<DSGVODataSubjectRequest[]>;
    /**
     * Gibt alle ausstehenden Datensubjektanfragen zurück
     */
    getPendingDataSubjectRequests(): Promise<DSGVODataSubjectRequest[]>;
    /**
     * Erteilt eine Einwilligung
     */
    giveConsent(userId: string, consentType: string, consentText: string, version: string): Promise<ConsentRecord>;
    /**
     * Widerruft eine Einwilligung
     */
    withdrawConsent(consentId: string): Promise<ConsentRecord>;
    /**
     * Gibt alle Einwilligungen eines Benutzers zurück
     */
    getConsentsForUser(userId: string): Promise<ConsentRecord[]>;
    /**
     * Meldet eine Datenschutzverletzung
     */
    reportDataBreach(description: string, affectedUsers: number, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    /**
     * Benachrichtigt den Datenschutzbeauftragten über eine Datenschutzverletzung
     */
    private notifyDataProtectionOfficer;
    /**
     * Erstellt einen erweiterten DSGVO-Compliance-Bericht
     */
    generateEnhancedDSGVOComplianceReport(startDate: Date, endDate: Date): Promise<DSGVOComplianceReport>;
}
