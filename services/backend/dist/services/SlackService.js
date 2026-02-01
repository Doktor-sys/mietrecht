"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackService = void 0;
const logger_1 = require("../utils/logger");
/**
 * Slack Service für Benachrichtigungen
 */
class SlackService {
    constructor(webhookUrl, channel) {
        this.webhookUrl = webhookUrl || null;
        this.channel = channel || null;
    }
    /**
     * Sendet einen Alert an einen Slack-Channel
     */
    async sendAlert(alert) {
        if (!this.webhookUrl) {
            logger_1.logger.warn('Slack webhook URL not configured, skipping Slack notification');
            return;
        }
        try {
            const payload = {
                channel: this.channel,
                username: 'SmartLaw Alert Bot',
                icon_emoji: ':rotating_light:',
                text: `*${alert.title}*`,
                attachments: [
                    {
                        color: this.getAlertColor(alert.severity),
                        fields: [
                            {
                                title: 'Severity',
                                value: alert.severity,
                                short: true
                            },
                            {
                                title: 'Timestamp',
                                value: alert.timestamp.toISOString(),
                                short: true
                            },
                            {
                                title: 'Message',
                                value: alert.message,
                                short: false
                            }
                        ],
                        footer: 'SmartLaw Security Monitoring',
                        ts: Math.floor(alert.timestamp.getTime() / 1000)
                    }
                ]
            };
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`Slack API returned ${response.status}: ${response.statusText}`);
            }
            logger_1.logger.info(`Successfully sent alert to Slack: ${alert.title}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to send alert to Slack:', error);
            throw error;
        }
    }
    /**
     * Gibt die Farbe für den Alert-Typ zurück
     */
    getAlertColor(severity) {
        switch (severity) {
            case 'critical':
                return 'danger';
            case 'error':
                return 'danger';
            case 'warning':
                return 'warning';
            case 'info':
                return 'good';
            default:
                return '#cccccc';
        }
    }
    /**
     * Prüft, ob der Service korrekt konfiguriert ist
     */
    isConfigured() {
        return !!this.webhookUrl;
    }
}
exports.SlackService = SlackService;
