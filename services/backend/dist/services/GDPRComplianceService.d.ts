import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './EncryptionService';
export interface ConsentManagement {
    userId: string;
    dataProcessing: boolean;
    analytics: boolean;
    marketing: boolean;
    thirdPartySharing: boolean;
    updatedAt: Date;
}
export interface DataExportRequest {
    userId: string;
    format: 'json' | 'csv' | 'pdf';
    includeDocuments?: boolean;
    includeMessages?: boolean;
    includeAnalytics?: boolean;
}
export interface DataDeletionRequest {
    userId: string;
    reason?: string;
    immediate?: boolean;
}
export declare class GDPRComplianceService {
    private prisma;
    private encryptionService?;
    constructor(prisma: PrismaClient, encryptionService?: EncryptionService | undefined);
    /**
     * Fordert Datenexport gemäß Art. 20 DSGVO an
     */
    requestDataExport(request: DataExportRequest): Promise<string>;
    /**
     * Fordert Datenlöschung gemäß Art. 17 DSGVO an
     */
    requestDataDeletion(request: DataDeletionRequest): Promise<void>;
    /**
     * Verwaltet Einwilligungen gemäß Art. 7 DSGVO
     */
    manageConsent(userId: string, consent: Omit<ConsentManagement, 'userId' | 'updatedAt'>): Promise<ConsentManagement>;
    /**
     * Ruft aktuelle Einwilligungen ab
     */
    getConsent(userId: string): Promise<ConsentManagement | null>;
    /**
     * Prüft ob Nutzer Einwilligung für bestimmte Verarbeitung gegeben hat
     */
    hasConsent(userId: string, type: keyof Omit<ConsentManagement, 'userId' | 'updatedAt'>): Promise<boolean>;
    /**
     * Private Hilfsmethoden
     */
    private collectUserData;
    private formatExportData;
    private convertToCSV;
    private generatePDFReport;
    private performImmediateDeletion;
    private scheduleDeletion;
    private anonymizeUserData;
    private logDataExport;
    private logDataDeletion;
    private logConsentChange;
    private generateHmacSignature;
    /**
     * Berechnet die Consent-Rate (Prozentsatz der Nutzer mit aktiver Einwilligung)
     */
    private calculateConsentRate;
    /**
     * Generiert GDPR-Compliance-Report
     */
    generateComplianceReport(organizationId?: string): Promise<any>;
}
