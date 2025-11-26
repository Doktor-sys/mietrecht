import { logger } from '../utils/logger';
import { Alert } from './kms/AlertManager';

/**
 * Slack Service für Benachrichtigungen
 */
export class SlackService {
  private webhookUrl: string | null;
  private channel: string | null;

  constructor(webhookUrl?: string, channel?: string) {
    this.webhookUrl = webhookUrl || null;
    this.channel = channel || null;
  }

  /**
   * Sendet einen Alert an einen Slack-Channel
   */
  async sendAlert(alert: Alert): Promise<void> {
    if (!this.webhookUrl) {
      logger.warn('Slack webhook URL not configured, skipping Slack notification');
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

      logger.info(`Successfully sent alert to Slack: ${alert.title}`);
    } catch (error) {
      logger.error('Failed to send alert to Slack:', error);
      throw error;
    }
  }

  /**
   * Gibt die Farbe für den Alert-Typ zurück
   */
  private getAlertColor(severity: string): string {
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
  isConfigured(): boolean {
    return !!this.webhookUrl;
  }
}