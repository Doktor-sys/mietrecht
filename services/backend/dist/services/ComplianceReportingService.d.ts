import { PrismaClient } from '@prisma/client';
import { AuditService, ComplianceReport } from './AuditService';
import { SecurityMonitoringService, SecurityMetrics } from './SecurityMonitoringService';
import { AlertManager } from './kms/AlertManager';
/**
 * Compliance Reporting Service
 *
 * Erstellt umfassende Compliance-Reports für Datenschutz-Audits und regulatorische Anforderungen
 */
export interface DetailedComplianceReport extends ComplianceReport {
    securityMetrics: SecurityMetrics;
    gdprCompliance: GDPRComplianceStatus;
    dataProtectionMeasures: DataProtectionMeasures;
    incidentSummary: IncidentSummary;
    userActivitySummary: UserActivitySummary;
}
export interface GDPRComplianceStatus {
    dataSubjectRequests: {
        total: number;
        accessRequests: number;
        deletionRequests: number;
        correctionRequests: number;
        averageResponseTime: number;
    };
    consentManagement: {
        totalConsents: number;
        activeConsents: number;
        revokedConsents: number;
    };
    dataBreaches: {
        total: number;
        reported: number;
        resolved: number;
    };
    complianceScore: number;
}
export interface DataProtectionMeasures {
    encryption: {
        documentsEncrypted: number;
        totalDocuments: number;
        encryptionRate: number;
    };
    accessControls: {
        totalUsers: number;
        usersWithMFA: number;
        mfaAdoptionRate: number;
    };
    auditLogging: {
        totalLogs: number;
        integrityVerified: boolean;
        retentionCompliant: boolean;
    };
}
export interface IncidentSummary {
    totalIncidents: number;
    criticalIncidents: number;
    highSeverityIncidents: number;
    mediumSeverityIncidents: number;
    lowSeverityIncidents: number;
    resolvedIncidents: number;
    averageResolutionTime: number;
    incidentsByType: Record<string, number>;
}
export interface UserActivitySummary {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    deletedUsers: number;
    averageSessionDuration: number;
    topActivities: Array<{
        activity: string;
        count: number;
    }>;
}
export declare class ComplianceReportingService {
    private prisma;
    private auditService;
    private securityMonitoring;
    private alertManager;
    constructor(prisma: PrismaClient, auditService: AuditService, securityMonitoring: SecurityMonitoringService, alertManager: AlertManager);
    /**
     * Generiert einen detaillierten Compliance-Report
     */
    generateDetailedReport(startDate: Date, endDate: Date, tenantId?: string): Promise<DetailedComplianceReport>;
    /**
     * Generiert einen kritischen Alert bei schwerwiegenden Compliance-Verstößen
     */
    private checkForCriticalComplianceViolations;
    /**
     * Bewertet DSGVO-Compliance
     */
    private assessGDPRCompliance;
    /**
     * Bewertet Datenschutzmaßnahmen
     */
    private assessDataProtectionMeasures;
    /**
     * Generiert Incident-Zusammenfassung
     */
    private generateIncidentSummary;
    /**
     * Generiert Nutzeraktivitäts-Zusammenfassung
     */
    private generateUserActivitySummary;
    /**
     * Exportiert Report als PDF (Platzhalter für PDF-Generierung)
     */
    exportReportAsPDF(report: DetailedComplianceReport): Promise<Buffer>;
    /**
     * Exportiert Report als CSV
     */
    exportReportAsCSV(report: DetailedComplianceReport): Promise<string>;
    /**
     * Sendet Report per E-Mail (Platzhalter)
     */
    sendReportByEmail(report: DetailedComplianceReport, recipients: string[]): Promise<void>;
}
