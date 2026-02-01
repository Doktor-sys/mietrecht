"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogger = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../utils/logger");
const kms_1 = require("../../types/kms");
/**
 * Audit Logger
 *
 * Vollständige Protokollierung aller Schlüsseloperationen
 * mit HMAC-Signierung für Integritätsprüfung
 */
class AuditLogger {
    constructor(prisma, hmacKey) {
        this.prisma = prisma;
        this.hmacKey = hmacKey || process.env.KMS_AUDIT_HMAC_KEY || this.generateHmacKey();
    }
    /**
     * Protokolliert Schlüsselerstellung
     */
    async logKeyCreation(keyId, tenantId, metadata) {
        await this.logEvent({
            eventType: kms_1.AuditEventType.KEY_CREATED,
            keyId,
            tenantId,
            action: 'create_key',
            result: 'success',
            metadata
        });
    }
    /**
     * Protokolliert Schlüsselzugriff
     */
    async logKeyAccess(keyId, tenantId, serviceId) {
        await this.logEvent({
            eventType: kms_1.AuditEventType.KEY_ACCESSED,
            keyId,
            tenantId,
            serviceId,
            action: 'access_key',
            result: 'success'
        });
    }
    /**
     * Protokolliert Schlüsselrotation
     */
    async logKeyRotation(oldKeyId, newKeyId, tenantId) {
        await this.logEvent({
            eventType: kms_1.AuditEventType.KEY_ROTATED,
            keyId: newKeyId,
            tenantId,
            action: 'rotate_key',
            result: 'success',
            metadata: { oldKeyId, newKeyId }
        });
    }
    /**
     * Protokolliert Status-Änderung
     */
    async logKeyStatusChange(keyId, tenantId, oldStatus, newStatus, reason) {
        await this.logEvent({
            eventType: kms_1.AuditEventType.KEY_STATUS_CHANGED,
            keyId,
            tenantId,
            action: 'change_status',
            result: 'success',
            metadata: { oldStatus, newStatus, reason }
        });
    }
    /**
     * Protokolliert Schlüssellöschung
     */
    async logKeyDeletion(keyId, tenantId, force) {
        await this.logEvent({
            eventType: kms_1.AuditEventType.KEY_DELETED,
            keyId,
            tenantId,
            action: 'delete_key',
            result: 'success',
            metadata: { force }
        });
    }
    /**
     * Protokolliert Sicherheitsvorfall
     */
    async logSecurityEvent(event) {
        await this.logEvent(event);
        // Bei kritischen Security-Events zusätzlich warnen
        if (event.eventType === kms_1.AuditEventType.UNAUTHORIZED_ACCESS ||
            event.eventType === kms_1.AuditEventType.SECURITY_ALERT) {
            logger_1.logger.warn('Security event logged:', {
                eventType: event.eventType,
                tenantId: event.tenantId,
                action: event.action
            });
        }
    }
    /**
     * Protokolliert fehlgeschlagene Operation
     */
    async logFailure(eventType, keyId, tenantId, action, error) {
        await this.logEvent({
            eventType,
            keyId,
            tenantId,
            action,
            result: 'failure',
            metadata: {
                error: error.message,
                errorType: error.name
            }
        });
    }
    /**
     * Fragt Audit-Logs ab
     */
    async queryAuditLog(filters) {
        try {
            const where = {};
            if (filters.tenantId) {
                where.tenantId = filters.tenantId;
            }
            if (filters.keyId) {
                where.keyId = filters.keyId;
            }
            if (filters.eventType) {
                where.eventType = filters.eventType;
            }
            if (filters.serviceId) {
                where.serviceId = filters.serviceId;
            }
            if (filters.userId) {
                where.userId = filters.userId;
            }
            if (filters.result) {
                where.result = filters.result;
            }
            if (filters.startDate || filters.endDate) {
                where.timestamp = {};
                if (filters.startDate) {
                    where.timestamp.gte = filters.startDate;
                }
                if (filters.endDate) {
                    where.timestamp.lte = filters.endDate;
                }
            }
            const logs = await this.prisma.keyAuditLog.findMany({
                where,
                orderBy: {
                    timestamp: 'desc'
                },
                take: filters.limit || 100,
                skip: filters.offset || 0
            });
            return logs.map(log => ({
                id: log.id,
                timestamp: log.timestamp,
                eventType: log.eventType,
                keyId: log.keyId,
                tenantId: log.tenantId,
                serviceId: log.serviceId || undefined,
                userId: log.userId || undefined,
                action: log.action,
                result: log.result,
                metadata: log.metadata || undefined,
                ipAddress: log.ipAddress || undefined,
                hmacSignature: log.hmacSignature
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to query audit log:', error);
            throw new kms_1.KeyManagementError('Failed to query audit log', kms_1.KeyManagementErrorCode.AUDIT_LOG_ERROR);
        }
    }
    /**
     * Verifiziert HMAC-Signatur eines Log-Eintrags
     */
    verifyLogEntry(entry) {
        try {
            const data = this.serializeLogEntry(entry);
            const expectedHmac = this.createHmac(data);
            return crypto_1.default.timingSafeEqual(Buffer.from(entry.hmacSignature, 'hex'), Buffer.from(expectedHmac, 'hex'));
        }
        catch (error) {
            logger_1.logger.error('Failed to verify log entry:', error);
            return false;
        }
    }
    /**
     * Zählt Audit-Log-Einträge nach Event-Typ
     */
    async countByEventType(tenantId, startDate, endDate) {
        try {
            const where = {};
            if (tenantId) {
                where.tenantId = tenantId;
            }
            if (startDate || endDate) {
                where.timestamp = {};
                if (startDate) {
                    where.timestamp.gte = startDate;
                }
                if (endDate) {
                    where.timestamp.lte = endDate;
                }
            }
            const counts = await this.prisma.keyAuditLog.groupBy({
                by: ['eventType'],
                where,
                _count: true
            });
            const result = {};
            for (const eventType of Object.values(kms_1.AuditEventType)) {
                result[eventType] = 0;
            }
            counts.forEach(count => {
                result[count.eventType] = count._count;
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to count by event type:', error);
            return {};
        }
    }
    /**
     * Findet verdächtige Aktivitäten
     */
    async findSuspiciousActivity(tenantId, timeWindowMinutes = 60) {
        try {
            const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
            // Finde fehlgeschlagene Zugriffe
            const failedAccesses = await this.prisma.keyAuditLog.findMany({
                where: {
                    tenantId,
                    result: 'failure',
                    timestamp: {
                        gte: since
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                }
            });
            // Finde Security-Alerts
            const securityAlerts = await this.prisma.keyAuditLog.findMany({
                where: {
                    tenantId,
                    eventType: {
                        in: [kms_1.AuditEventType.SECURITY_ALERT, kms_1.AuditEventType.UNAUTHORIZED_ACCESS]
                    },
                    timestamp: {
                        gte: since
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                }
            });
            const allSuspicious = [...failedAccesses, ...securityAlerts];
            return allSuspicious.map(log => ({
                id: log.id,
                timestamp: log.timestamp,
                eventType: log.eventType,
                keyId: log.keyId,
                tenantId: log.tenantId,
                serviceId: log.serviceId || undefined,
                userId: log.userId || undefined,
                action: log.action,
                result: log.result,
                metadata: log.metadata || undefined,
                ipAddress: log.ipAddress || undefined,
                hmacSignature: log.hmacSignature
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to find suspicious activity:', error);
            return [];
        }
    }
    /**
     * Bereinigt alte Audit-Logs (für Retention-Policy)
     */
    async cleanupOldLogs(retentionDays = 2555) {
        try {
            const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
            const result = await this.prisma.keyAuditLog.deleteMany({
                where: {
                    timestamp: {
                        lt: cutoffDate
                    }
                }
            });
            logger_1.logger.info(`Cleaned up ${result.count} old audit log entries`);
            return result.count;
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup old logs:', error);
            return 0;
        }
    }
    /**
     * Interne Methode: Protokolliert ein Event
     */
    async logEvent(event) {
        try {
            const logEntry = {
                eventType: event.eventType,
                keyId: event.keyId || '',
                tenantId: event.tenantId,
                serviceId: event.serviceId,
                userId: event.userId,
                action: event.action,
                result: event.result,
                metadata: event.metadata,
                ipAddress: event.ipAddress,
                hmacSignature: '' // Wird unten gesetzt
            };
            // Erstelle HMAC-Signatur
            const data = this.serializeLogEntry(logEntry);
            const hmacSignature = this.createHmac(data);
            // Speichere Log-Eintrag
            await this.prisma.keyAuditLog.create({
                data: {
                    keyId: logEntry.keyId,
                    tenantId: logEntry.tenantId,
                    eventType: logEntry.eventType,
                    action: logEntry.action,
                    result: logEntry.result,
                    serviceId: logEntry.serviceId,
                    userId: logEntry.userId,
                    ipAddress: logEntry.ipAddress,
                    metadata: logEntry.metadata,
                    hmacSignature
                }
            });
            logger_1.logger.debug(`Audit log entry created: ${event.eventType} for key ${event.keyId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to log event:', error);
            // Audit-Log-Fehler sollten nicht die Hauptoperation blockieren
            // aber wir sollten sie trotzdem tracken
        }
    }
    /**
     * Hilfsmethode: Serialisiert Log-Eintrag für HMAC
     */
    serializeLogEntry(entry) {
        return JSON.stringify({
            eventType: entry.eventType,
            keyId: entry.keyId,
            tenantId: entry.tenantId,
            action: entry.action,
            result: entry.result,
            serviceId: entry.serviceId,
            userId: entry.userId,
            metadata: entry.metadata,
            timestamp: entry.timestamp
        });
    }
    /**
     * Hilfsmethode: Erstellt HMAC-Signatur
     */
    createHmac(data) {
        return crypto_1.default
            .createHmac('sha256', this.hmacKey)
            .update(data, 'utf8')
            .digest('hex');
    }
    /**
     * Hilfsmethode: Generiert HMAC-Key
     */
    generateHmacKey() {
        const key = crypto_1.default.randomBytes(32).toString('hex');
        logger_1.logger.warn('Generated new HMAC key - this should be set in environment variables');
        return key;
    }
    /**
     * Exportiert Audit-Logs für Compliance-Reports
     */
    async exportLogs(filters, format = 'json') {
        try {
            const logs = await this.queryAuditLog(filters);
            if (format === 'json') {
                return JSON.stringify(logs, null, 2);
            }
            else {
                // CSV-Format
                const headers = [
                    'timestamp',
                    'eventType',
                    'keyId',
                    'tenantId',
                    'action',
                    'result',
                    'serviceId',
                    'userId'
                ];
                const rows = logs.map(log => [
                    log.timestamp.toISOString(),
                    log.eventType,
                    log.keyId,
                    log.tenantId,
                    log.action,
                    log.result,
                    log.serviceId || '',
                    log.userId || ''
                ]);
                return [
                    headers.join(','),
                    ...rows.map(row => row.join(','))
                ].join('\n');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to export logs:', error);
            throw new kms_1.KeyManagementError('Failed to export audit logs', kms_1.KeyManagementErrorCode.AUDIT_LOG_ERROR);
        }
    }
}
exports.AuditLogger = AuditLogger;
