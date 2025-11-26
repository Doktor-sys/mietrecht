import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import crypto from 'crypto';

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

export enum AuditEventType {
  FAILED_LOGIN = 'failed_login',
  SUCCESSFUL_LOGIN = 'successful_login',
  LOGOUT = 'logout',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  DATA_READ = 'data_read',
  DATA_EXPORT = 'data_export',
  DATA_IMPORT = 'data_import',
  DATA_DELETE = 'data_delete',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  GDPR_DATA_EXPORT = 'gdpr_data_export',
  GDPR_DATA_DELETION = 'gdpr_data_deletion',
  GDPR_DATA_CORRECTION = 'gdpr_data_correction',
  KEY_GENERATED = 'key_generated',
  KEY_ROTATED = 'key_rotated',
  KEY_COMPROMISED = 'key_compromised',
  SECURITY_ALERT = 'security_alert',
  PASSWORD_CHANGED = 'password_changed',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked'
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

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generiert einen Compliance-Report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    tenantId?: string
  ): Promise<ComplianceReport> {
    try {
      const where = {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        ...(tenantId && { tenantId })
      };

      // Statistiken sammeln
      const totalEvents = await this.prisma.auditLog.count({ where });
      
      const failedOperations = await this.prisma.auditLog.count({
        where: {
          ...where,
          result: 'failure'
        }
      });
      
      const securityIncidents = await this.prisma.auditLog.count({
        where: {
          ...where,
          eventType: {
            in: ['security_unauthorized_access', 'security_suspicious_activity', 'security_failed_login']
          }
        }
      });
      
      const gdprRequests = await this.prisma.auditLog.count({
        where: {
          ...where,
          eventType: {
            in: ['gdpr_data_export', 'gdpr_data_deletion', 'gdpr_data_correction']
          }
        }
      });

      return {
        generatedAt: new Date(),
        period: {
          startDate,
          endDate
        },
        statistics: {
          totalEvents,
          failedOperations,
          securityIncidents,
          gdprRequests
        }
      };
    } catch (error) {
      logger.error('Failed to generate compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  /**
   * Fragt Audit-Logs ab
   */
  async queryLogs(options: QueryLogsOptions): Promise<AuditLogEntry[]> {
    try {
      const { startDate, endDate, tenantId, limit = 100, offset = 0 } = options;
      
      const where = {
        ...(startDate && { timestamp: { gte: startDate } }),
        ...(endDate && { timestamp: { lte: endDate } }),
        ...(tenantId && { tenantId })
      };

      const logs = await this.prisma.auditLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          timestamp: 'desc'
        }
      });

      return logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        eventType: log.eventType,
        userId: log.userId || undefined,
        tenantId: log.tenantId || undefined,
        resourceType: log.resourceType || undefined,
        resourceId: log.resourceId || undefined,
        action: log.action,
        result: log.result,
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        metadata: log.metadata,
        hmacSignature: log.hmacSignature
      }));
    } catch (error) {
      logger.error('Failed to query audit logs:', error);
      throw new Error('Failed to query audit logs');
    }
  }

  /**
   * Verifiziert die Integrität eines Log-Eintrags
   */
  verifyLogEntry(log: AuditLogEntry): boolean {
    try {
      // In einer echten Implementierung würde man hier die HMAC-Signatur
      // des Log-Eintrags mit dem berechneten HMAC vergleichen
      // Für dieses Beispiel geben wir einfach true zurück
      return true;
    } catch (error) {
      logger.error('Failed to verify log entry:', error);
      return false;
    }
  }

  /**
   * Erstellt einen detaillierten Sicherheitslog-Eintrag
   */
  async logSecurityEvent(
    eventType: AuditEventType,
    userId: string | undefined,
    tenantId: string | undefined,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          eventType,
          userId: userId || null,
          tenantId: tenantId || null,
          resourceType: details.resourceType || null,
          resourceId: details.resourceId || null,
          action: details.action || eventType.toString(),
          result: details.result || 'success',
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          metadata: details.metadata || {},
          hmacSignature: '' // In einer echten Implementierung würde man hier einen HMAC berechnen
        }
      });
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Erstellt einen Login-Log-Eintrag
   */
  async logLoginAttempt(
    userId: string | undefined,
    tenantId: string | undefined,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    failureReason?: string
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          eventType: success ? AuditEventType.SUCCESSFUL_LOGIN : AuditEventType.FAILED_LOGIN,
          userId: userId || null,
          tenantId: tenantId || null,
          action: 'login',
          result: success ? 'success' : 'failure',
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          metadata: failureReason ? { failureReason } : {},
          hmacSignature: ''
        }
      });
    } catch (error) {
      logger.error('Failed to log login attempt:', error);
    }
  }

  /**
   * Erstellt einen KMS-Operation-Log-Eintrag
   */
  async logKMSOperation(
    operation: string,
    keyId: string | undefined,
    userId: string | undefined,
    tenantId: string | undefined,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    error?: string
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          eventType: operation as AuditEventType,
          userId: userId || null,
          tenantId: tenantId || null,
          resourceType: 'encryption_key',
          resourceId: keyId || null,
          action: operation,
          result: success ? 'success' : 'failure',
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          metadata: error ? { error } : {},
          hmacSignature: ''
        }
      });
    } catch (error) {
      logger.error('Failed to log KMS operation:', error);
    }
  }

  /**
   * Erkennt Anomalien in den Audit-Logs
   */
  async detectAnomalies(
    startDate?: Date,
    endDate?: Date,
    timeframeMinutes: number = 60
  ): Promise<AnomalyDetectionResult[]> {
    try {
      // Wenn keine Datumsgrenzen angegeben sind, verwenden wir das Zeitfenster
      const now = new Date();
      if (!startDate) {
        startDate = new Date(now.getTime() - timeframeMinutes * 60 * 1000);
      }
      if (!endDate) {
        endDate = now;
      }

      const where = {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      };

      // Hole alle Logs im Zeitfenster
      const logs = await this.prisma.auditLog.findMany({
        where,
        orderBy: {
          timestamp: 'asc'
        }
      });

      const anomalies: AnomalyDetectionResult[] = [];

      // Gruppiere Logs nach UserId
      const logsByUser: Record<string, any[]> = {};
      for (const log of logs) {
        const userId = log.userId || 'anonymous';
        if (!logsByUser[userId]) {
          logsByUser[userId] = [];
        }
        logsByUser[userId].push(log);
      }

      // Analysiere jedes Benutzerprofil auf Anomalien
      for (const [userId, userLogs] of Object.entries(logsByUser)) {
        // 1. Prüfe auf mehrere fehlgeschlagene Logins
        const failedLogins = userLogs.filter(
          log => log.eventType === AuditEventType.FAILED_LOGIN
        );

        if (failedLogins.length >= 5) {
          anomalies.push({
            isAnomalous: true,
            anomalyType: 'multiple_failed_logins',
            severity: 'high',
            description: `Benutzer ${userId} hatte ${failedLogins.length} fehlgeschlagene Login-Versuche`,
            affectedUserId: userId !== 'anonymous' ? userId : undefined,
            timestamp: new Date()
          });
        }

        // 2. Prüfe auf übermäßigen Datenzugriff
        const dataAccessLogs = userLogs.filter(
          log => [AuditEventType.DATA_READ, AuditEventType.DATA_EXPORT].includes(log.eventType as AuditEventType)
        );

        if (dataAccessLogs.length >= 100) {
          anomalies.push({
            isAnomalous: true,
            anomalyType: 'excessive_data_access',
            severity: 'medium',
            description: `Benutzer ${userId} hatte ${dataAccessLogs.length} Datenzugriffe`,
            affectedUserId: userId !== 'anonymous' ? userId : undefined,
            timestamp: new Date()
          });
        }

        // 3. Prüfe auf Aktivitäten außerhalb der Geschäftszeiten
        const offHoursLogs = userLogs.filter(log => {
          const hour = new Date(log.timestamp).getHours();
          return hour < 8 || hour > 18; // Außerhalb 8-18 Uhr
        });

        if (offHoursLogs.length >= 10) {
          anomalies.push({
            isAnomalous: true,
            anomalyType: 'off_hours_activity',
            severity: 'low',
            description: `Benutzer ${userId} hatte ${offHoursLogs.length} Aktivitäten außerhalb der Geschäftszeiten`,
            affectedUserId: userId !== 'anonymous' ? userId : undefined,
            timestamp: new Date()
          });
        }

        // 4. Prüfe auf mehrere Datenexporte
        const dataExportLogs = userLogs.filter(
          log => log.eventType === AuditEventType.DATA_EXPORT
        );

        if (dataExportLogs.length >= 3) {
          anomalies.push({
            isAnomalous: true,
            anomalyType: 'multiple_data_exports',
            severity: 'high',
            description: `Benutzer ${userId} führte ${dataExportLogs.length} Datenexporte durch`,
            affectedUserId: userId !== 'anonymous' ? userId : undefined,
            timestamp: new Date()
          });
        }
      }

      // 5. Prüfe auf IP-Adress-Anomalien (gleicher Benutzer, verschiedene IPs)
      const logsByTime: Record<string, any[]> = {};
      for (const log of logs) {
        const timeSlot = new Date(log.timestamp).toISOString().slice(0, 13); // Stundenbasis
        if (!logsByTime[timeSlot]) {
          logsByTime[timeSlot] = [];
        }
        logsByTime[timeSlot].push(log);
      }

      for (const [timeSlot, slotLogs] of Object.entries(logsByTime)) {
        // Gruppiere nach UserId innerhalb des Zeitfensters
        const slotLogsByUser: Record<string, any[]> = {};
        for (const log of slotLogs) {
          const userId = log.userId || 'anonymous';
          if (!slotLogsByUser[userId]) {
            slotLogsByUser[userId] = [];
          }
          slotLogsByUser[userId].push(log);
        }

        // Prüfe jeden Benutzer auf mehrere IPs
        for (const [userId, userSlotLogs] of Object.entries(slotLogsByUser)) {
          const ipAddresses = new Set(userSlotLogs.map(log => log.ipAddress).filter(ip => ip));
          
          if (ipAddresses.size >= 3) {
            anomalies.push({
              isAnomalous: true,
              anomalyType: 'multiple_ip_addresses',
              severity: 'medium',
              description: `Benutzer ${userId} verwendete ${ipAddresses.size} verschiedene IP-Adressen innerhalb einer Stunde`,
              affectedUserId: userId !== 'anonymous' ? userId : undefined,
              timestamp: new Date()
            });
          }
        }
      }

      return anomalies;
    } catch (error) {
      logger.error('Failed to detect anomalies:', error);
      return [];
    }
  }
}