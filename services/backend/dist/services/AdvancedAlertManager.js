"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedAlertManager = exports.WebhookService = exports.SMSService = exports.TeamsService = void 0;
const logger_1 = require("../utils/logger");
const AlertManager_1 = require("./kms/AlertManager");
const SlackService_1 = require("./SlackService");
const PagerDutyService_1 = require("./PagerDutyService");
const EmailService_1 = require("./EmailService");
const AlertCorrelationEngine_1 = require("./AlertCorrelationEngine");
/**
 * Microsoft Teams Service für Benachrichtigungen
 */
class TeamsService {
    constructor(webhookUrl) {
        this.webhookUrl = webhookUrl || null;
    }
    /**
     * Sendet einen Alert an einen Microsoft Teams Channel
     */
    async sendAlert(alert) {
        if (!this.webhookUrl) {
            logger_1.logger.warn('Teams webhook URL not configured, skipping Teams notification');
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
            logger_1.logger.info(`Successfully sent alert to Teams: ${alert.title}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to send alert to Teams:', error);
            throw error;
        }
    }
    /**
     * Gibt die Farbe für den Alert-Typ zurück
     */
    getAlertColor(severity) {
        switch (severity) {
            case AlertManager_1.AlertSeverity.CRITICAL:
                return 'e30613'; // Red
            case AlertManager_1.AlertSeverity.ERROR:
                return 'e30613'; // Red
            case AlertManager_1.AlertSeverity.WARNING:
                return 'f8a500'; // Orange
            case AlertManager_1.AlertSeverity.INFO:
                return '00a651'; // Green
            default:
                return '666666'; // Gray
        }
    }
    /**
     * Prüft, ob der Service korrekt konfiguriert ist
     */
    isConfigured() {
        return !!this.webhookUrl;
    }
}
exports.TeamsService = TeamsService;
/**
 * SMS Service für Benachrichtigungen via Twilio
 */
class SMSService {
    constructor(accountSid, authToken, fromNumber) {
        this.accountSid = accountSid || null;
        this.authToken = authToken || null;
        this.fromNumber = fromNumber || null;
    }
    /**
     * Sendet eine SMS-Benachrichtigung
     */
    async sendSMS(to, alert) {
        if (!this.accountSid || !this.authToken || !this.fromNumber) {
            logger_1.logger.warn('Twilio credentials not configured, skipping SMS notification');
            return;
        }
        try {
            // Für kritische Alerts senden wir SMS
            if (alert.severity !== AlertManager_1.AlertSeverity.CRITICAL) {
                logger_1.logger.info(`Skipping SMS notification for non-critical alert: ${alert.title}`);
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
            const responseData = await response.json();
            logger_1.logger.info(`Successfully sent SMS alert: ${responseData.sid || 'unknown'}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to send SMS alert:', error);
            throw error;
        }
    }
    /**
     * Prüft, ob der Service korrekt konfiguriert ist
     */
    isConfigured() {
        return !!(this.accountSid && this.authToken && this.fromNumber);
    }
}
exports.SMSService = SMSService;
/**
 * Custom Webhook Service für Benachrichtigungen
 */
class WebhookService {
    constructor(urls = []) {
        this.urls = urls;
    }
    /**
     * Sendet einen Alert an alle konfigurierten Webhooks
     */
    async sendAlert(alert) {
        if (this.urls.length === 0) {
            logger_1.logger.warn('No webhook URLs configured, skipping webhook notifications');
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
                    logger_1.logger.info(`Successfully sent alert to webhook: ${url}`);
                }
                catch (error) {
                    logger_1.logger.error(`Failed to send alert to webhook ${url}:`, error);
                    throw error;
                }
            });
            await Promise.allSettled(promises);
        }
        catch (error) {
            logger_1.logger.error('Failed to send webhook alerts:', error);
            throw error;
        }
    }
    /**
     * Fügt eine neue Webhook-URL hinzu
     */
    addWebhook(url) {
        if (!this.urls.includes(url)) {
            this.urls.push(url);
        }
    }
    /**
     * Entfernt eine Webhook-URL
     */
    removeWebhook(url) {
        this.urls = this.urls.filter(u => u !== url);
    }
    /**
     * Gibt alle konfigurierten Webhook-URLs zurück
     */
    getWebhooks() {
        return [...this.urls];
    }
}
exports.WebhookService = WebhookService;
/**
 * Erweiterte Alert-Manager für KMS Security-Events
 * Verwaltet Alerts und Benachrichtigungen über mehrere Kanäle
 */
class AdvancedAlertManager {
    constructor(config = { enabled: true }) {
        this.correlationEngine = null;
        this.alerts = new Map();
        this.config = config;
        this.alertHandlers = new Map();
        this.alertHistory = new Map();
        // Initialisiere Services
        this.slackService = new SlackService_1.SlackService(config.slackWebhookUrl, config.slackChannel);
        this.pagerDutyService = new PagerDutyService_1.PagerDutyService(config.pagerDutyApiKey, config.pagerDutyIntegrationKey);
        this.emailService = new EmailService_1.EmailService();
        this.teamsService = new TeamsService(config.teamsWebhookUrl);
        this.smsService = new SMSService(config.twilioAccountSid, config.twilioAuthToken, config.twilioFromNumber);
        this.webhookService = new WebhookService(config.customWebhookUrls || []);
        // Initialisiere Handler-Arrays
        Object.values(AlertManager_1.AlertSeverity).forEach(severity => {
            this.alertHandlers.set(severity, []);
        });
        // Initialisiere Correlation Engine wenn aktiviert
        if (config.correlationEnabled) {
            this.correlationEngine = new AlertCorrelationEngine_1.AlertCorrelationEngine(config.correlationWindowMs || 300000); // 5 Minuten default
        }
        else {
            this.correlationEngine = null;
        }
    }
    /**
     * Registriert einen Alert-Handler
     */
    registerHandler(severity, handler) {
        const handlers = this.alertHandlers.get(severity) || [];
        handlers.push(handler);
        this.alertHandlers.set(severity, handlers);
    }
    /**
     * Erstellt einen neuen Alert
     */
    createAlert(severity, title, message, metadata) {
        // Prüfe auf Duplikate
        if (this.isDuplicateAlert(severity, title, message)) {
            logger_1.logger.info(`Skipping duplicate alert: ${title}`);
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
        const alert = {
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
                    logger_1.logger.info(`Alert correlated: ${correlatedGroup.id} with confidence ${correlatedGroup.confidence}`);
                    // Bei hoher Konfidenz oder bekannten Mustern zusätzliche Maßnahmen
                    if (correlatedGroup.confidence > 0.7 || correlatedGroup.pattern) {
                        logger_1.logger.warn(`High confidence alert correlation detected: ${correlatedGroup.pattern?.name || 'Unknown pattern'}`);
                        // Füge Metadaten zum Alert hinzu
                        alert.metadata = {
                            ...alert.metadata,
                            correlatedGroupId: correlatedGroup.id,
                            correlationConfidence: correlatedGroup.confidence,
                            correlationPattern: correlatedGroup.pattern?.name || null
                        };
                    }
                }
            }
            catch (error) {
                logger_1.logger.error('Failed to correlate alert:', error);
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
    isDuplicateAlert(severity, title, message) {
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
    recordAlert(alert) {
        if (!this.config.alertDeduplicationWindowMs) {
            return;
        }
        const key = `${alert.severity}:${alert.title}:${alert.message}`;
        this.alertHistory.set(key, alert.timestamp.getTime());
        // Bereinige alte Einträge
        const cutoffTime = Date.now() - this.config.alertDeduplicationWindowMs * 2;
        for (const [key, timestamp] of this.alertHistory.entries()) {
            if (timestamp < cutoffTime) {
                this.alertHistory.delete(key);
            }
        }
    }
    /**
     * Erstellt einen Alert aus einem SecurityAlert
     */
    createAlertFromSecurityAlert(securityAlert) {
        // Konvertiere SecurityAlert severity zu AlertSeverity
        let severity;
        switch (securityAlert.severity) {
            case 'critical':
                severity = AlertManager_1.AlertSeverity.CRITICAL;
                break;
            case 'high':
                severity = AlertManager_1.AlertSeverity.ERROR;
                break;
            case 'medium':
                severity = AlertManager_1.AlertSeverity.WARNING;
                break;
            case 'low':
                severity = AlertManager_1.AlertSeverity.INFO;
                break;
            default:
                severity = AlertManager_1.AlertSeverity.INFO;
        }
        return this.createAlert(severity, securityAlert.type, securityAlert.description, {
            ...securityAlert,
            recommendations: securityAlert.recommendations
        });
    }
    /**
     * Loggt einen Alert
     */
    logAlert(alert) {
        const logMessage = `[${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`;
        switch (alert.severity) {
            case AlertManager_1.AlertSeverity.CRITICAL:
            case AlertManager_1.AlertSeverity.ERROR:
                logger_1.logger.error(logMessage, alert.metadata);
                break;
            case AlertManager_1.AlertSeverity.WARNING:
                logger_1.logger.warn(logMessage, alert.metadata);
                break;
            case AlertManager_1.AlertSeverity.INFO:
                logger_1.logger.info(logMessage, alert.metadata);
                break;
        }
    }
    /**
     * Führt registrierte Handler aus
     */
    executeHandlers(alert) {
        const handlers = this.alertHandlers.get(alert.severity) || [];
        handlers.forEach(handler => {
            try {
                handler(alert);
            }
            catch (error) {
                logger_1.logger.error('Alert handler failed:', error);
            }
        });
        // Sende Benachrichtigungen
        this.sendNotifications(alert);
    }
    /**
     * Sendet Benachrichtigungen über verschiedene Kanäle
     */
    async sendNotifications(alert) {
        try {
            // E-Mail-Benachrichtigung
            if (this.emailService && this.config.emailRecipients && this.config.emailRecipients.length > 0) {
                // Für kritische Alerts oder wenn emailCriticalOnly deaktiviert ist
                if (!this.config.emailCriticalOnly || alert.severity === AlertManager_1.AlertSeverity.CRITICAL) {
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
                if (alert.severity === AlertManager_1.AlertSeverity.CRITICAL) {
                    for (const phoneNumber of this.config.twilioCriticalAlertNumbers) {
                        try {
                            await this.smsService.sendSMS(phoneNumber, alert);
                        }
                        catch (error) {
                            logger_1.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
                        }
                    }
                }
            }
            // Custom Webhooks
            if (this.webhookService) {
                await this.webhookService.sendAlert(alert);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send notifications:', error);
        }
    }
    /**
     * Sendet eine E-Mail-Benachrichtigung
     */
    async sendEmailAlert(alert) {
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
                    ${Object.entries(alert.metadata).map(([key, value]) => `<li><strong>${key}:</strong> ${typeof value === 'object' ? JSON.stringify(value) : String(value)}</li>`).join('')}
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
${Object.entries(alert.metadata).map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`).join('\n')}` : ''}
      `;
            // Sende E-Mail an alle Empfänger
            const promises = this.config.emailRecipients.map(async (recipient) => {
                try {
                    await this.emailService.sendEmail({
                        to: recipient,
                        subject: subject,
                        html: html,
                        text: text
                    });
                }
                catch (error) {
                    logger_1.logger.error(`Failed to send email to ${recipient}:`, error);
                }
            });
            await Promise.allSettled(promises);
        }
        catch (error) {
            logger_1.logger.error('Failed to send email alert:', error);
        }
    }
    /**
     * Gibt die Farbe für den Alert-Typ zurück
     */
    getAlertColor(severity) {
        switch (severity) {
            case AlertManager_1.AlertSeverity.CRITICAL:
                return '#e30613'; // Red
            case AlertManager_1.AlertSeverity.ERROR:
                return '#e30613'; // Red
            case AlertManager_1.AlertSeverity.WARNING:
                return '#f8a500'; // Orange
            case AlertManager_1.AlertSeverity.INFO:
                return '#00a651'; // Green
            default:
                return '#666666'; // Gray
        }
    }
    /**
     * Markiert einen Alert als gelöst
     */
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (!alert) {
            return false;
        }
        alert.resolved = true;
        alert.resolvedAt = new Date();
        logger_1.logger.info(`Alert resolved: ${alert.title}`);
        return true;
    }
    /**
     * Gibt alle aktiven Alerts zurück
     */
    getActiveAlerts() {
        return Array.from(this.alerts.values())
            .filter(alert => !alert.resolved)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Gibt Alerts nach Severity zurück
     */
    getAlertsBySeverity(severity) {
        return Array.from(this.alerts.values())
            .filter(alert => alert.severity === severity && !alert.resolved)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Bereinigt alte gelöste Alerts
     */
    cleanupOldAlerts(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
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
            logger_1.logger.info(`Cleaned up ${cleaned} old alerts`);
        }
        return cleaned;
    }
    /**
     * Gibt Alert-Statistiken zurück
     */
    getStatistics() {
        const alerts = Array.from(this.alerts.values());
        const stats = {
            total: alerts.length,
            active: alerts.filter(a => !a.resolved).length,
            resolved: alerts.filter(a => a.resolved).length,
            bySeverity: {
                [AlertManager_1.AlertSeverity.INFO]: 0,
                [AlertManager_1.AlertSeverity.WARNING]: 0,
                [AlertManager_1.AlertSeverity.ERROR]: 0,
                [AlertManager_1.AlertSeverity.CRITICAL]: 0
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
    getCorrelationStatistics() {
        if (!this.correlationEngine || !this.config.correlationEnabled) {
            return null;
        }
        return this.correlationEngine.getStatistics();
    }
    /**
     * Gibt bekannte Alert-Muster zurück
     */
    getKnownPatterns() {
        if (!this.correlationEngine || !this.config.correlationEnabled) {
            return [];
        }
        return this.correlationEngine.getPatterns();
    }
    /**
     * Fügt ein neues Alert-Muster hinzu
     */
    addPattern(pattern) {
        if (!this.correlationEngine || !this.config.correlationEnabled) {
            return;
        }
        this.correlationEngine.addPattern(pattern);
    }
    /**
     * Entfernt ein Alert-Muster
     */
    removePattern(patternId) {
        if (!this.correlationEngine || !this.config.correlationEnabled) {
            return false;
        }
        return this.correlationEngine.removePattern(patternId);
    }
    /**
     * Markiert eine korrelierte Alert-Gruppe als gelöst
     */
    resolveCorrelatedGroup(groupId) {
        if (!this.correlationEngine || !this.config.correlationEnabled) {
            return false;
        }
        return this.correlationEngine.resolveGroup(groupId);
    }
}
exports.AdvancedAlertManager = AdvancedAlertManager;
