import { logger } from '../utils/logger';
import { Alert, AlertSeverity, AlertConfig } from './kms/AlertManager';
import { SlackService } from './SlackService';
import { PagerDutyService } from './PagerDutyService';
import { EmailService } from './EmailService';
import { SecurityAlert } from './SecurityMonitoringService';
import { AlertCorrelationEngine } from './AlertCorrelationEngine';

/**
 * Microsoft Teams Service für Benachrichtigungen
 */
export class TeamsService {
  private webhookUrl: string | null;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || null;
  }

  /**
   * Sendet einen Alert an einen Microsoft Teams Channel
   */
  async sendAlert(alert: Alert): Promise<void> {
    if (!this.webhookUrl) {
      logger.warn('Teams webhook URL not configured, skipping Teams notification');
      return;
    }

    try {
      const payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": this.getAlertColor(alert.severity),
        "summary": alert.title,
        "sections": [{
          "activityTitle": alert.title,
          "activitySubtitle": `Severity: ${alert.severity}`,
          "activityImage": "https://raw.githubusercontent.com/microsoft/fluentui/master/packages/office-ui-fabric-react/src/components/Icon/icons/alert.svg",
          "facts": [
            {
              "name": "Timestamp",
              "value": alert.timestamp.toISOString()
            },
            {
              "name": "Message",
              "value": alert.message
            },
            ...(alert.metadata ? Object.entries(alert.metadata).map(([key, value]) => ({
              "name": key,
              "value": typeof value === 'object' ? JSON.stringify(value) : String(value)
            })) : [])
          ],
          "markdown": true
        }]
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Teams API returned ${response.status}: ${response.statusText}`);
      }

      logger.info(`Successfully sent alert to Teams: ${alert.title}`);
    } catch (error) {
      logger.error('Failed to send alert to Teams:', error);
      throw error;
    }
  }

  /**
   * Gibt die Farbe für den Alert-Typ zurück
   */
  private getAlertColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'e30613'; // Red
      case AlertSeverity.ERROR:
        return 'e30613'; // Red
      case AlertSeverity.WARNING:
        return 'f8a500'; // Orange
      case AlertSeverity.INFO:
        return '00a651'; // Green
      default:
        return '666666'; // Gray
    }
  }

  /**
   * Prüft, ob der Service korrekt konfiguriert ist
   */
  isConfigured(): boolean {
    return !!this.webhookUrl;
  }
}

/**
 * SMS Service für Benachrichtigungen via Twilio
 */
export class SMSService {
  private accountSid: string | null;
  private authToken: string | null;
  private fromNumber: string | null;

  constructor(accountSid?: string, authToken?: string, fromNumber?: string) {
    this.accountSid = accountSid || null;
    this.authToken = authToken || null;
    this.fromNumber = fromNumber || null;
  }

  /**
   * Sendet eine SMS-Benachrichtigung
   */
  async sendSMS(to: string, alert: Alert): Promise<void> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      logger.warn('Twilio credentials not configured, skipping SMS notification');
      return;
    }

    try {
      // Für kritische Alerts senden wir SMS
      if (alert.severity !== AlertSeverity.CRITICAL) {
        logger.info(`Skipping SMS notification for non-critical alert: ${alert.title}`);
        return;
      }

      const message = `ALERT: ${alert.title}\n${alert.message}\nSeverity: ${alert.severity}\nTime: ${alert.timestamp.toISOString()}`;

      const formData = new URLSearchParams();
      formData.append('To', to);
      formData.append('From', this.fromNumber);
      formData.append('Body', message);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Twilio API returned ${response.status}: ${errorText}`);
      }

      const responseData: any = await response.json();
      logger.info(`Successfully sent SMS alert: ${responseData.sid || 'unknown'}`);
    } catch (error) {
      logger.error('Failed to send SMS alert:', error);
      throw error;
    }
  }

  /**
   * Prüft, ob der Service korrekt konfiguriert ist
   */
  isConfigured(): boolean {
    return !!(this.accountSid && this.authToken && this.fromNumber);
  }
}

/**
 * Custom Webhook Service für Benachrichtigungen
 */
export class WebhookService {
  private urls: string[];

  constructor(urls: string[] = []) {
    this.urls = urls;
  }

  /**
   * Sendet einen Alert an alle konfigurierten Webhooks
   */
  async sendAlert(alert: Alert): Promise<void> {
    if (this.urls.length === 0) {
      logger.warn('No webhook URLs configured, skipping webhook notifications');
      return;
    }

    try {
      const payload = {
        id: alert.id,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp,
        metadata: alert.metadata,
        resolved: alert.resolved,
        resolvedAt: alert.resolvedAt
      };

      const promises = this.urls.map(async (url) => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(`Webhook ${url} returned ${response.status}: ${response.statusText}`);
          }

          logger.info(`Successfully sent alert to webhook: ${url}`);
        } catch (error) {
          logger.error(`Failed to send alert to webhook ${url}:`, error);
          throw error;
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      logger.error('Failed to send webhook alerts:', error);
      throw error;
    }
  }

  /**
   * Fügt eine neue Webhook-URL hinzu
   */
  addWebhook(url: string): void {
    if (!this.urls.includes(url)) {
      this.urls.push(url);
    }
  }

  /**
   * Entfernt eine Webhook-URL
   */
  removeWebhook(url: string): void {
    this.urls = this.urls.filter(u => u !== url);
  }

  /**
   * Gibt alle konfigurierten Webhook-URLs zurück
   */
  getWebhooks(): string[] {
    return [...this.urls];
  }
}

/**
 * Erweiterte Alert-Konfiguration
 */
export interface AdvancedAlertConfig extends AlertConfig {
  teamsWebhookUrl?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  twilioCriticalAlertNumbers?: string[];
  customWebhookUrls?: string[];
  emailRecipients?: string[];
  emailCriticalOnly?: boolean;
  alertDeduplicationWindowMs?: number; // Zeitfenster für Deduplikation in ms
  correlationEnabled?: boolean; // Aktiviert Alert-Korrelation
  correlationWindowMs?: number; // Zeitfenster für Korrelation in ms
}

/**
 * Erweiterte Alert-Manager für KMS Security-Events
 * Verwaltet Alerts und Benachrichtigungen über mehrere Kanäle
 */
export class AdvancedAlertManager {
  private alerts: Map<string, Alert>;
  private config: AdvancedAlertConfig;
  private alertHandlers: Map<AlertSeverity, ((alert: Alert) => void)[]>;
  private slackService: SlackService;
  private pagerDutyService: PagerDutyService;
  private emailService: EmailService;
  private teamsService: TeamsService;
  private smsService: SMSService;
  private webhookService: WebhookService;
  private alertHistory: Map<string, number>; // Für Deduplikation
  private correlationEngine: AlertCorrelationEngine | null = null;

  constructor(config: AdvancedAlertConfig = { enabled: true }) {
    this.alerts = new Map();
    this.config = config;
    this.alertHandlers = new Map();
    this.alertHistory = new Map();
    
    // Initialisiere Services
    this.slackService = new SlackService(
      config.slackWebhookUrl,
      config.slackChannel
    );
    
    this.pagerDutyService = new PagerDutyService(
      config.pagerDutyApiKey,
      config.pagerDutyIntegrationKey
    );
    
    this.emailService = new EmailService();
    
    this.teamsService = new TeamsService(
      config.teamsWebhookUrl
    );
    
    this.smsService = new SMSService(
      config.twilioAccountSid,
      config.twilioAuthToken,
      config.twilioFromNumber
    );
    
    this.webhookService = new WebhookService(
      config.customWebhookUrls || []
    );
    
    // Initialisiere Handler-Arrays
    Object.values(AlertSeverity).forEach(severity => {
      this.alertHandlers.set(severity as AlertSeverity, []);
    });
    
    // Initialisiere Correlation Engine wenn aktiviert
    if (config.correlationEnabled) {
      this.correlationEngine = new AlertCorrelationEngine(config.correlationWindowMs || 300000); // 5 Minuten default
    } else {
      this.correlationEngine = null;
    }
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
    // Prüfe auf Duplikate
    if (this.isDuplicateAlert(severity, title, message)) {
      logger.info(`Skipping duplicate alert: ${title}`);
      return {
        id: 'duplicate',
        severity,
        title,
        message,
        timestamp: new Date(),
        metadata,
        resolved: true
      };
    }

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
    this.recordAlert(alert);

    // Logge Alert
    this.logAlert(alert);

    // Korreliere Alert wenn aktiviert
    if (this.correlationEngine && this.config.correlationEnabled) {
      try {
        const correlatedGroup = this.correlationEngine.processAlert(alert);
        if (correlatedGroup) {
          logger.info(`Alert correlated: ${correlatedGroup.id} with confidence ${correlatedGroup.confidence}`);
          
          // Bei hoher Konfidenz oder bekannten Mustern zusätzliche Maßnahmen
          if (correlatedGroup.confidence > 0.7 || correlatedGroup.pattern) {
            logger.warn(`High confidence alert correlation detected: ${correlatedGroup.pattern?.name || 'Unknown pattern'}`);
            
            // Füge Metadaten zum Alert hinzu
            alert.metadata = {
              ...alert.metadata,
              correlatedGroupId: correlatedGroup.id,
              correlationConfidence: correlatedGroup.confidence,
              correlationPattern: correlatedGroup.pattern?.name || null
            };
          }
        }
      } catch (error) {
        logger.error('Failed to correlate alert:', error);
      }
    }

    // Führe Handler aus
    if (this.config.enabled) {
      this.executeHandlers(alert);
    }

    return alert;
  }

  /**
   * Prüft, ob ein Alert ein Duplikat ist
   */
  private isDuplicateAlert(severity: AlertSeverity, title: string, message: string): boolean {
    if (!this.config.alertDeduplicationWindowMs) {
      return false;
    }

    const key = `${severity}:${title}:${message}`;
    const lastTimestamp = this.alertHistory.get(key);
    
    if (lastTimestamp) {
      const now = Date.now();
      const timeDiff = now - lastTimestamp;
      
      if (timeDiff < this.config.alertDeduplicationWindowMs) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Zeichnet einen Alert für Deduplikation auf
   */
  private recordAlert(alert: Alert): void {
    if (!this.config.alertDeduplicationWindowMs) {
      return;
    }

    const key = `${alert.severity}:${alert.title}:${alert.message}`;
    this.alertHistory.set(key, alert.timestamp.getTime());
    
    // Bereinige alte Einträge
    const cutoffTime = Date.now() - this.config.alertDeduplicationWindowMs! * 2;
    for (const [key, timestamp] of this.alertHistory.entries()) {
      if (timestamp < cutoffTime) {
        this.alertHistory.delete(key);
      }
    }
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
    
    // Sende Benachrichtigungen
    this.sendNotifications(alert);
  }

  /**
   * Sendet Benachrichtigungen über verschiedene Kanäle
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    try {
      // E-Mail-Benachrichtigung
      if (this.emailService && this.config.emailRecipients && this.config.emailRecipients.length > 0) {
        // Für kritische Alerts oder wenn emailCriticalOnly deaktiviert ist
        if (!this.config.emailCriticalOnly || alert.severity === AlertSeverity.CRITICAL) {
          await this.sendEmailAlert(alert);
        }
      }
      
      // Slack-Benachrichtigung
      if (this.slackService.isConfigured()) {
        await this.slackService.sendAlert(alert);
      }
      
      // Teams-Benachrichtigung
      if (this.teamsService.isConfigured()) {
        await this.teamsService.sendAlert(alert);
      }
      
      // PagerDuty-Integration
      if (this.pagerDutyService.isConfigured()) {
        await this.pagerDutyService.createIncident(alert);
      }
      
      // SMS-Benachrichtigung (nur für kritische Alerts)
      if (this.smsService.isConfigured() && this.config.twilioCriticalAlertNumbers) {
        if (alert.severity === AlertSeverity.CRITICAL) {
          for (const phoneNumber of this.config.twilioCriticalAlertNumbers) {
            try {
              await this.smsService.sendSMS(phoneNumber, alert);
            } catch (error) {
              logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
            }
          }
        }
      }
      
      // Custom Webhooks
      if (this.webhookService) {
        await this.webhookService.sendAlert(alert);
      }
    } catch (error) {
      logger.error('Failed to send notifications:', error);
    }
  }

  /**
   * Sendet eine E-Mail-Benachrichtigung
   */
  private async sendEmailAlert(alert: Alert): Promise<void> {
    if (!this.config.emailRecipients || this.config.emailRecipients.length === 0) {
      return;
    }

    try {
      const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Security Alert</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${this.getAlertColor(alert.severity)}; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .metadata { background: #f0f9ff; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Security Alert</h1>
              <p>${alert.title}</p>
            </div>
            <div class="content">
              <h2>Alert Details</h2>
              <p><strong>Severity:</strong> ${alert.severity}</p>
              <p><strong>Message:</strong> ${alert.message}</p>
              <p><strong>Timestamp:</strong> ${alert.timestamp.toISOString()}</p>
              
              ${alert.metadata ? `
                <div class="metadata">
                  <h3>Additional Information</h3>
                  <ul>
                    ${Object.entries(alert.metadata).map(([key, value]) => 
                      `<li><strong>${key}:</strong> ${typeof value === 'object' ? JSON.stringify(value) : String(value)}</li>`
                    ).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>This is an automated security alert from SmartLaw Mietrecht System</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
Security Alert: ${alert.title}

Severity: ${alert.severity}
Message: ${alert.message}
Timestamp: ${alert.timestamp.toISOString()}

${alert.metadata ? `Additional Information:
${Object.entries(alert.metadata).map(([key, value]) => 
  `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`
).join('\n')}` : ''}
      `;

      // Sende E-Mail an alle Empfänger
      const promises = this.config.emailRecipients!.map(async (recipient) => {
        try {
          await this.emailService.sendEmail({
            to: recipient,
            subject: subject,
            html: html,
            text: text
          });
        } catch (error) {
          logger.error(`Failed to send email to ${recipient}:`, error);
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      logger.error('Failed to send email alert:', error);
    }
  }

  /**
   * Gibt die Farbe für den Alert-Typ zurück
   */
  private getAlertColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '#e30613'; // Red
      case AlertSeverity.ERROR:
        return '#e30613'; // Red
      case AlertSeverity.WARNING:
        return '#f8a500'; // Orange
      case AlertSeverity.INFO:
        return '#00a651'; // Green
      default:
        return '#666666'; // Gray
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

  /**
   * Gibt Correlation-Statistiken zurück
   */
  getCorrelationStatistics(): {
    totalGroups: number;
    activeGroups: number;
    resolvedGroups: number;
    patternMatches: number;
    averageConfidence: number;
  } | null {
    if (!this.correlationEngine || !this.config.correlationEnabled) {
      return null;
    }
    
    return this.correlationEngine.getStatistics();
  }

  /**
   * Gibt bekannte Alert-Muster zurück
   */
  getKnownPatterns(): any[] {
    if (!this.correlationEngine || !this.config.correlationEnabled) {
      return [];
    }
    
    return this.correlationEngine.getPatterns();
  }

  /**
   * Fügt ein neues Alert-Muster hinzu
   */
  addPattern(pattern: any): void {
    if (!this.correlationEngine || !this.config.correlationEnabled) {
      return;
    }
    
    this.correlationEngine.addPattern(pattern);
  }

  /**
   * Entfernt ein Alert-Muster
   */
  removePattern(patternId: string): boolean {
    if (!this.correlationEngine || !this.config.correlationEnabled) {
      return false;
    }
    
    return this.correlationEngine.removePattern(patternId);
  }

  /**
   * Markiert eine korrelierte Alert-Gruppe als gelöst
   */
  resolveCorrelatedGroup(groupId: string): boolean {
    if (!this.correlationEngine || !this.config.correlationEnabled) {
      return false;
    }
    
    return this.correlationEngine.resolveGroup(groupId);
  }
}