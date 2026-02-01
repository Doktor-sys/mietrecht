import { PrismaClient } from '@prisma/client';
export interface ComplianceReport {
    generatedAt: Date;
    period: {
        startDate: Date;
        endDate: Date;
    };
    statistics: {
        totalEvents: number;
        failedOperations: number;
        securityIncidents: number;
        gdprRequests: number;
    };
}
export declare enum AuditEventType {
    FAILED_LOGIN = "failed_login",
    SUCCESSFUL_LOGIN = "successful_login",
    LOGOUT = "logout",
    UNAUTHORIZED_ACCESS = "unauthorized_access",
    SUSPICIOUS_ACTIVITY = "suspicious_activity",
    BRUTE_FORCE_ATTEMPT = "brute_force_attempt",
    DATA_READ = "data_read",
    DATA_EXPORT = "data_export",
    DATA_IMPORT = "data_import",
    DATA_DELETE = "data_delete",
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
    GDPR_DATA_EXPORT = "gdpr_data_export",
    GDPR_DATA_DELETION = "gdpr_data_deletion",
    GDPR_DATA_CORRECTION = "gdpr_data_correction",
    KEY_GENERATED = "key_generated",
    KEY_ROTATED = "key_rotated",
    KEY_COMPROMISED = "key_compromised",
    SECURITY_ALERT = "security_alert",
    PASSWORD_CHANGED = "password_changed",
    ACCOUNT_LOCKED = "account_locked",
    ACCOUNT_UNLOCKED = "account_unlocked"
}
export interface AnomalyDetectionResult {
    isAnomalous: boolean;
    anomalyType?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedUserId?: string;
    affectedTenantId?: string;
    timestamp: Date;
}
export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    eventType: string;
    userId?: string;
    tenantId?: string;
    resourceType?: string;
    resourceId?: string;
    action: string;
    result: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
    hmacSignature: string;
}
export interface QueryLogsOptions {
    startDate?: Date;
    endDate?: Date;
    tenantId?: string;
    limit?: number;
    offset?: number;
}
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Generiert einen Compliance-Report
     */
    generateComplianceReport(startDate: Date, endDate: Date, tenantId?: string): Promise<ComplianceReport>;
    /**
     * Exportiert Audit-Logs in verschiedenen Formaten
     */
    exportLogs(options: QueryLogsOptions, format?: 'json' | 'csv'): Promise<string | Buffer>;
    /**
     * Fragt Audit-Logs ab
     */
    queryLogs(options: QueryLogsOptions): Promise<AuditLogEntry[]>;
    /**
     * Verifiziert die Integrität eines Log-Eintrags
     */
    verifyLogEntry(log: AuditLogEntry): boolean;
    /**
     * Erstellt einen detaillierten Sicherheitslog-Eintrag
     */
    logSecurityEvent(eventType: AuditEventType, userId: string | undefined, tenantId: string | undefined, details: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Erstellt einen Login-Log-Eintrag
     */
    logLoginAttempt(userId: string | undefined, tenantId: string | undefined, success: boolean, ipAddress?: string, userAgent?: string, failureReason?: string): Promise<void>;
    /**
     * Erstellt einen KMS-Operation-Log-Eintrag
     */
    logKMSOperation(operation: string, keyId: string | undefined, userId: string | undefined, tenantId: string | undefined, success: boolean, ipAddress?: string, userAgent?: string, error?: string): Promise<void>;
    /**
     * Erkennt Anomalien in den Audit-Logs
     */
    detectAnomalies(startDate?: Date, endDate?: Date, timeframeMinutes?: number): Promise<AnomalyDetectionResult[]>;
}
