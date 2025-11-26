import { logger } from '../../utils/logger';
import { AuditEventType } from '../../types/kms';
import { SlackService } from '../SlackService';
import { PagerDutyService } from '../PagerDutyService';
import { SecurityAlert } from '../SecurityMonitoringService';

/**
 * Alert-Typen
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Alert-Daten
 */
export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: Date;
}

/**
 * Alert-Konfiguration
 */
export interface AlertConfig {
  enabled: boolean;
  webhookUrl?: string;
  emailRecipients?: string[];
  slackChannel?: string;
  slackWebhookUrl?: string;
  pagerDutyIntegrationKey?: string;
  pagerDutyApiKey?: string;
}

/**
 * Alert Manager für KMS Security-Events
 * Verwaltet Alerts und Benachrichtigungen
 */
export class AlertManager {
  private alerts: Map<string, Alert>;
  private config: AlertConfig;
  private alertHandlers: Map<AlertSeverity, ((alert: Alert) => void)[]>;
  private slackService: SlackService;
  private pagerDutyService: PagerDutyService;

  constructor(config: AlertConfig = { enabled: true }) {
    this.alerts = new Map();
    this.config = config;
    this.alertHandlers = new Map();
    
    // Initialisiere Slack Service
    this.slackService = new SlackService(
      config.slackWebhookUrl,
      config.slackChannel
    );
    
    // Initialisiere PagerDuty Service
    this.pagerDutyService = new PagerDutyService(
      config.pagerDutyApiKey,
      config.pagerDutyIntegrationKey
    );
    
    // Initialisiere Handler-Arrays
    Object.values(AlertSeverity).forEach(severity => {
      this.alertHandlers.set(severity, []);
    });
  }

  /**
   * Registriert einen Alert-Handler
   */
  registerHandler(severity: AlertSeverity, handler: (alert: Alert) => void): void {
    const handlers = this.alertHandlers.get(severity) || [];
    handlers.push(handler);
    this.alertHandlers.set(severity, handlers);
  }

  /**
   * Erstellt einen neuen Alert
   */
  createAlert(
    severity: AlertSeverity,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Alert {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      title,
      message,
      timestamp: new Date(),
      metadata,
      resolved: false
    };

    this.alerts.set(alert.id, alert);

    // Logge Alert
    this.logAlert(alert);

    // Führe Handler aus
    if (this.config.enabled) {
      this.executeHandlers(alert);
    }

    return alert;
  }

  /**
   * Erstellt einen Alert aus einem SecurityAlert
   */
  createAlertFromSecurityAlert(securityAlert: SecurityAlert): Alert {
    // Konvertiere SecurityAlert severity zu AlertSeverity
    let severity: AlertSeverity;
    switch (securityAlert.severity) {
      case 'critical':
        severity = AlertSeverity.CRITICAL;
        break;
      case 'high':
        severity = AlertSeverity.ERROR;
        break;
      case 'medium':
        severity = AlertSeverity.WARNING;
        break;
      case 'low':
        severity = AlertSeverity.INFO;
        break;
      default:
        severity = AlertSeverity.INFO;
    }

    return this.createAlert(
      severity,
      securityAlert.type,
      securityAlert.description,
      {
        ...securityAlert,
        recommendations: securityAlert.recommendations
      }
    );
  }

  /**
   * Loggt einen Alert
   */
  private logAlert(alert: Alert): void {
    const logMessage = `[${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`;
    
    switch (alert.severity) {
      case AlertSeverity.CRITICAL:
      case AlertSeverity.ERROR:
        logger.error(logMessage, alert.metadata);
        break;
      case AlertSeverity.WARNING:
        logger.warn(logMessage, alert.metadata);
        break;
      case AlertSeverity.INFO:
        logger.info(logMessage, alert.metadata);
        break;
    }
  }

  /**
   * Führt registrierte Handler aus
   */
  private executeHandlers(alert: Alert): void {
    const handlers = this.alertHandlers.get(alert.severity) || [];
    
    handlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        logger.error('Alert handler failed:', error);
      }
    });
    
    // Sende Benachrichtigungen für kritische Alerts
    if (alert.severity === AlertSeverity.CRITICAL) {
      this.sendNotifications(alert);
    }
  }

  /**
   * Sendet Benachrichtigungen über verschiedene Kanäle
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    try {
      // Slack-Benachrichtigung
      if (this.slackService.isConfigured()) {
        await this.slackService.sendAlert(alert);
      }
      
      // PagerDuty-Integration
      if (this.pagerDutyService.isConfigured()) {
        await this.pagerDutyService.createIncident(alert);
      }
    } catch (error) {
      logger.error('Failed to send notifications:', error);
    }
  }

  /**
   * Markiert einen Alert als gelöst
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    
    if (!alert) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    
    logger.info(`Alert resolved: ${alert.title}`);
    
    return true;
  }

  /**
   * Gibt alle aktiven Alerts zurück
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Gibt Alerts nach Severity zurück
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.severity === severity && !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Erstellt Alert für einen SecurityEvent
   */
  handleSecurityEvent(eventType: string, details: Record<string, any>): void {
    let severity: AlertSeverity;
    let title: string;
    let message: string;

    switch (eventType) {
      case 'unauthorized_access':
        severity = AlertSeverity.CRITICAL;
        title = 'Unauthorized Access Attempt';
        message = `Unauthorized access attempt for resource ${details.resourceId} by user ${details.userId}`;
        break;

      case 'rate_limit_exceeded':
        severity = AlertSeverity.ERROR;
        title = 'Rate Limit Exceeded';
        message = `Rate limit exceeded for ${details.userId ? `user ${details.userId}` : `IP ${details.ipAddress}`}`;
        break;

      case 'failed_login':
        severity = AlertSeverity.WARNING;
        title = 'Failed Login Attempt';
        message = `Failed login attempt for user ${details.userId}`;
        break;

      case 'suspicious_activity':
        severity = AlertSeverity.ERROR;
        title = 'Suspicious Activity Detected';
        message = `Suspicious activity detected: ${details.description}`;
        break;

      case 'data_export':
        severity = AlertSeverity.WARNING;
        title = 'Data Export Performed';
        message = `Data export performed by user ${details.userId}`;
        break;

      default:
        severity = AlertSeverity.INFO;
        title = 'Security Event';
        message = `Security event: ${eventType}`;
    }

    this.createAlert(severity, title, message, details);
  }

  /**
   * Erstellt Alert für Rotation-Fehler
   */
  handleRotationError(keyId: string, error: Error): void {
    this.createAlert(
      AlertSeverity.ERROR,
      'Key Rotation Failed',
      `Failed to rotate key ${keyId}`,
      {
        keyId,
        error: error.message,
        stack: error.stack
      }
    );
  }

  /**
   * Erstellt Alert für überfällige Rotationen
   */
  handleOverdueRotations(count: number, keyIds: string[]): void {
    const severity = count > 10 ? AlertSeverity.ERROR : AlertSeverity.WARNING;
    
    this.createAlert(
      severity,
      'Overdue Key Rotations',
      `${count} keys are overdue for rotation`,
      {
        count,
        keyIds: keyIds.slice(0, 10), // Nur erste 10 IDs
        totalOverdue: keyIds.length
      }
    );
  }

  /**
   * Erstellt Alert für Health Check Fehler
   */
  handleHealthCheckFailure(component: string, error: string): void {
    this.createAlert(
      AlertSeverity.CRITICAL,
      'Health Check Failed',
      `${component} health check failed: ${error}`,
      {
        component,
        error
      }
    );
  }

  /**
   * Erstellt Alert für Performance-Probleme
   */
  handlePerformanceIssue(metric: string, value: number, threshold: number): void {
    this.createAlert(
      AlertSeverity.WARNING,
      'Performance Degradation',
      `${metric} is ${value}, exceeding threshold of ${threshold}`,
      {
        metric,
        value,
        threshold
      }
    );
  }

  /**
   * Bereinigt alte gelöste Alerts
   */
  cleanupOldAlerts(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.resolvedAt) {
        const age = now - alert.resolvedAt.getTime();
        if (age > maxAgeMs) {
          this.alerts.delete(id);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} old alerts`);
    }

    return cleaned;
  }

  /**
   * Gibt Alert-Statistiken zurück
   */
  getStatistics(): {
    total: number;
    active: number;
    resolved: number;
    bySeverity: Record<AlertSeverity, number>;
  } {
    const alerts = Array.from(this.alerts.values());
    
    const stats = {
      total: alerts.length,
      active: alerts.filter(a => !a.resolved).length,
      resolved: alerts.filter(a => a.resolved).length,
      bySeverity: {
        [AlertSeverity.INFO]: 0,
        [AlertSeverity.WARNING]: 0,
        [AlertSeverity.ERROR]: 0,
        [AlertSeverity.CRITICAL]: 0
      }
    };

    alerts.forEach(alert => {
      if (!alert.resolved) {
        stats.bySeverity[alert.severity]++;
      }
    });

    return stats;
  }
}
