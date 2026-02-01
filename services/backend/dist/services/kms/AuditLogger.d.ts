import { PrismaClient } from '@prisma/client';
import { AuditLogEntry, AuditLogFilters, AuditEventType, SecurityEvent, KeyStatus } from '../../types/kms';
/**
 * Audit Logger
 *
 * Vollständige Protokollierung aller Schlüsseloperationen
 * mit HMAC-Signierung für Integritätsprüfung
 */
export declare class AuditLogger {
    private prisma;
    private hmacKey;
    constructor(prisma: PrismaClient, hmacKey?: string);
    /**
     * Protokolliert Schlüsselerstellung
     */
    logKeyCreation(keyId: string, tenantId: string, metadata: any): Promise<void>;
    /**
     * Protokolliert Schlüsselzugriff
     */
    logKeyAccess(keyId: string, tenantId: string, serviceId: string): Promise<void>;
    /**
     * Protokolliert Schlüsselrotation
     */
    logKeyRotation(oldKeyId: string, newKeyId: string, tenantId: string): Promise<void>;
    /**
     * Protokolliert Status-Änderung
     */
    logKeyStatusChange(keyId: string, tenantId: string, oldStatus: KeyStatus, newStatus: KeyStatus, reason?: string): Promise<void>;
    /**
     * Protokolliert Schlüssellöschung
     */
    logKeyDeletion(keyId: string, tenantId: string, force: boolean): Promise<void>;
    /**
     * Protokolliert Sicherheitsvorfall
     */
    logSecurityEvent(event: SecurityEvent): Promise<void>;
    /**
     * Protokolliert fehlgeschlagene Operation
     */
    logFailure(eventType: AuditEventType, keyId: string | undefined, tenantId: string, action: string, error: Error): Promise<void>;
    /**
     * Fragt Audit-Logs ab
     */
    queryAuditLog(filters: AuditLogFilters): Promise<AuditLogEntry[]>;
    /**
     * Verifiziert HMAC-Signatur eines Log-Eintrags
     */
    verifyLogEntry(entry: AuditLogEntry): boolean;
    /**
     * Zählt Audit-Log-Einträge nach Event-Typ
     */
    countByEventType(tenantId?: string, startDate?: Date, endDate?: Date): Promise<Record<AuditEventType, number>>;
    /**
     * Findet verdächtige Aktivitäten
     */
    findSuspiciousActivity(tenantId: string, timeWindowMinutes?: number): Promise<AuditLogEntry[]>;
    /**
     * Bereinigt alte Audit-Logs (für Retention-Policy)
     */
    cleanupOldLogs(retentionDays?: number): Promise<number>;
    /**
     * Interne Methode: Protokolliert ein Event
     */
    private logEvent;
    /**
     * Hilfsmethode: Serialisiert Log-Eintrag für HMAC
     */
    private serializeLogEntry;
    /**
     * Hilfsmethode: Erstellt HMAC-Signatur
     */
    private createHmac;
    /**
     * Hilfsmethode: Generiert HMAC-Key
     */
    private generateHmacKey;
    /**
     * Exportiert Audit-Logs für Compliance-Reports
     */
    exportLogs(filters: AuditLogFilters, format?: 'json' | 'csv'): Promise<string>;
}
