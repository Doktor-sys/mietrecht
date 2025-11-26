import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { logger } from '../../utils/logger';
import {
  AuditLogEntry,
  AuditLogFilters,
  AuditEventType,
  SecurityEvent,
  KeyStatus,
  KeyManagementError,
  KeyManagementErrorCode
} from '../../types/kms';

/**
 * Audit Logger
 * 
 * Vollständige Protokollierung aller Schlüsseloperationen
 * mit HMAC-Signierung für Integritätsprüfung
 */
export class AuditLogger {
  private prisma: PrismaClient;
  private hmacKey: string;

  constructor(prisma: PrismaClient, hmacKey?: string) {
    this.prisma = prisma;
    this.hmacKey = hmacKey || process.env.KMS_AUDIT_HMAC_KEY || this.generateHmacKey();
  }

  /**
   * Protokolliert Schlüsselerstellung
   */
  async logKeyCreation(
    keyId: string,
    tenantId: string,
    metadata: any
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.KEY_CREATED,
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
  async logKeyAccess(
    keyId: string,
    tenantId: string,
    serviceId: string
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.KEY_ACCESSED,
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
  async logKeyRotation(
    oldKeyId: string,
    newKeyId: string,
    tenantId: string
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.KEY_ROTATED,
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
  async logKeyStatusChange(
    keyId: string,
    tenantId: string,
    oldStatus: KeyStatus,
    newStatus: KeyStatus,
    reason?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.KEY_STATUS_CHANGED,
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
  async logKeyDeletion(
    keyId: string,
    tenantId: string,
    force: boolean
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.KEY_DELETED,
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
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    await this.logEvent(event);
    
    // Bei kritischen Security-Events zusätzlich warnen
    if (event.eventType === AuditEventType.UNAUTHORIZED_ACCESS ||
        event.eventType === AuditEventType.SECURITY_ALERT) {
      logger.warn('Security event logged:', {
        eventType: event.eventType,
        tenantId: event.tenantId,
        action: event.action
      });
    }
  }

  /**
   * Protokolliert fehlgeschlagene Operation
   */
  async logFailure(
    eventType: AuditEventType,
    keyId: string | undefined,
    tenantId: string,
    action: string,
    error: Error
  ): Promise<void> {
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
  async queryAuditLog(filters: AuditLogFilters): Promise<AuditLogEntry[]> {
    try {
      const where: any = {};

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
        eventType: log.eventType as AuditEventType,
        keyId: log.keyId,
        tenantId: log.tenantId,
        serviceId: log.serviceId || undefined,
        userId: log.userId || undefined,
        action: log.action,
        result: log.result as 'success' | 'failure',
        metadata: log.metadata as Record<string, any> || undefined,
        ipAddress: log.ipAddress || undefined,
        hmacSignature: log.hmacSignature
      }));
    } catch (error) {
      logger.error('Failed to query audit log:', error);
      throw new KeyManagementError(
        'Failed to query audit log',
        KeyManagementErrorCode.AUDIT_LOG_ERROR
      );
    }
  }

  /**
   * Verifiziert HMAC-Signatur eines Log-Eintrags
   */
  verifyLogEntry(entry: AuditLogEntry): boolean {
    try {
      const data = this.serializeLogEntry(entry);
      const expectedHmac = this.createHmac(data);
      
      return crypto.timingSafeEqual(
        Buffer.from(entry.hmacSignature, 'hex'),
        Buffer.from(expectedHmac, 'hex')
      );
    } catch (error) {
      logger.error('Failed to verify log entry:', error);
      return false;
    }
  }

  /**
   * Zählt Audit-Log-Einträge nach Event-Typ
   */
  async countByEventType(
    tenantId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<AuditEventType, number>> {
    try {
      const where: any = {};

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

      const result: Record<string, number> = {};
      for (const eventType of Object.values(AuditEventType)) {
        result[eventType] = 0;
      }

      counts.forEach(count => {
        result[count.eventType] = count._count;
      });

      return result as Record<AuditEventType, number>;
    } catch (error) {
      logger.error('Failed to count by event type:', error);
      return {} as Record<AuditEventType, number>;
    }
  }

  /**
   * Findet verdächtige Aktivitäten
   */
  async findSuspiciousActivity(
    tenantId: string,
    timeWindowMinutes: number = 60
  ): Promise<AuditLogEntry[]> {
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
            in: [AuditEventType.SECURITY_ALERT, AuditEventType.UNAUTHORIZED_ACCESS]
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
        eventType: log.eventType as AuditEventType,
        keyId: log.keyId,
        tenantId: log.tenantId,
        serviceId: log.serviceId || undefined,
        userId: log.userId || undefined,
        action: log.action,
        result: log.result as 'success' | 'failure',
        metadata: log.metadata as Record<string, any> || undefined,
        ipAddress: log.ipAddress || undefined,
        hmacSignature: log.hmacSignature
      }));
    } catch (error) {
      logger.error('Failed to find suspicious activity:', error);
      return [];
    }
  }

  /**
   * Bereinigt alte Audit-Logs (für Retention-Policy)
   */
  async cleanupOldLogs(retentionDays: number = 2555): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const result = await this.prisma.keyAuditLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      logger.info(`Cleaned up ${result.count} old audit log entries`);
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup old logs:', error);
      return 0;
    }
  }

  /**
   * Interne Methode: Protokolliert ein Event
   */
  private async logEvent(event: SecurityEvent): Promise<void> {
    try {
      const logEntry: Omit<AuditLogEntry, 'id' | 'timestamp'> = {
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
      const data = this.serializeLogEntry(logEntry as AuditLogEntry);
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
          metadata: logEntry.metadata as any,
          hmacSignature
        }
      });

      logger.debug(`Audit log entry created: ${event.eventType} for key ${event.keyId}`);
    } catch (error) {
      logger.error('Failed to log event:', error);
      // Audit-Log-Fehler sollten nicht die Hauptoperation blockieren
      // aber wir sollten sie trotzdem tracken
    }
  }

  /**
   * Hilfsmethode: Serialisiert Log-Eintrag für HMAC
   */
  private serializeLogEntry(entry: AuditLogEntry): string {
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
  private createHmac(data: string): string {
    return crypto
      .createHmac('sha256', this.hmacKey)
      .update(data, 'utf8')
      .digest('hex');
  }

  /**
   * Hilfsmethode: Generiert HMAC-Key
   */
  private generateHmacKey(): string {
    const key = crypto.randomBytes(32).toString('hex');
    logger.warn('Generated new HMAC key - this should be set in environment variables');
    return key;
  }

  /**
   * Exportiert Audit-Logs für Compliance-Reports
   */
  async exportLogs(
    filters: AuditLogFilters,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const logs = await this.queryAuditLog(filters);

      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      } else {
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
    } catch (error) {
      logger.error('Failed to export logs:', error);
      throw new KeyManagementError(
        'Failed to export audit logs',
        KeyManagementErrorCode.AUDIT_LOG_ERROR
      );
    }
  }
}
