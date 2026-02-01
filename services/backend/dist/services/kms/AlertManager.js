"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertManager = exports.AlertSeverity = void 0;
const logger_1 = require("../../utils/logger");
const SlackService_1 = require("../SlackService");
const PagerDutyService_1 = require("../PagerDutyService");
/**
 * Alert-Typen
 */
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "info";
    AlertSeverity["WARNING"] = "warning";
    AlertSeverity["ERROR"] = "error";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
/**
 * Alert Manager für KMS Security-Events
 * Verwaltet Alerts und Benachrichtigungen
 */
class AlertManager {
    constructor(config = { enabled: true }) {
        this.alerts = new Map();
        this.config = config;
        this.alertHandlers = new Map();
        // Initialisiere Slack Service
        this.slackService = new SlackService_1.SlackService(config.slackWebhookUrl, config.slackChannel);
        // Initialisiere PagerDuty Service
        this.pagerDutyService = new PagerDutyService_1.PagerDutyService(config.pagerDutyApiKey, config.pagerDutyIntegrationKey);
        // Initialisiere Handler-Arrays
        Object.values(AlertSeverity).forEach(severity => {
            this.alertHandlers.set(severity, []);
        });
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
    createAlertFromSecurityAlert(securityAlert) {
        // Konvertiere SecurityAlert severity zu AlertSeverity
        let severity;
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
            case AlertSeverity.CRITICAL:
            case AlertSeverity.ERROR:
                logger_1.logger.error(logMessage, alert.metadata);
                break;
            case AlertSeverity.WARNING:
                logger_1.logger.warn(logMessage, alert.metadata);
                break;
            case AlertSeverity.INFO:
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
        // Sende Benachrichtigungen für kritische Alerts
        if (alert.severity === AlertSeverity.CRITICAL) {
            this.sendNotifications(alert);
        }
    }
    /**
     * Sendet Benachrichtigungen über verschiedene Kanäle
     */
    async sendNotifications(alert) {
        try {
            // Slack-Benachrichtigung
            if (this.slackService.isConfigured()) {
                await this.slackService.sendAlert(alert);
            }
            // PagerDuty-Integration
            if (this.pagerDutyService.isConfigured()) {
                await this.pagerDutyService.createIncident(alert);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send notifications:', error);
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
     * Erstellt Alert für einen SecurityEvent
     */
    handleSecurityEvent(eventType, details) {
        let severity;
        let title;
        let message;
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
    handleRotationError(keyId, error) {
        this.createAlert(AlertSeverity.ERROR, 'Key Rotation Failed', `Failed to rotate key ${keyId}`, {
            keyId,
            error: error.message,
            stack: error.stack
        });
    }
    /**
     * Erstellt Alert für überfällige Rotationen
     */
    handleOverdueRotations(count, keyIds) {
        const severity = count > 10 ? AlertSeverity.ERROR : AlertSeverity.WARNING;
        this.createAlert(severity, 'Overdue Key Rotations', `${count} keys are overdue for rotation`, {
            count,
            keyIds: keyIds.slice(0, 10), // Nur erste 10 IDs
            totalOverdue: keyIds.length
        });
    }
    /**
     * Erstellt Alert für Health Check Fehler
     */
    handleHealthCheckFailure(component, error) {
        this.createAlert(AlertSeverity.CRITICAL, 'Health Check Failed', `${component} health check failed: ${error}`, {
            component,
            error
        });
    }
    /**
     * Erstellt Alert für Performance-Probleme
     */
    handlePerformanceIssue(metric, value, threshold) {
        this.createAlert(AlertSeverity.WARNING, 'Performance Degradation', `${metric} is ${value}, exceeding threshold of ${threshold}`, {
            metric,
            value,
            threshold
        });
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
exports.AlertManager = AlertManager;
