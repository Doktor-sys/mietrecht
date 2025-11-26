import { logger } from '../utils/logger';
import { Alert } from './kms/AlertManager';

/**
 * PagerDuty Service für Incident Management
 */
export class PagerDutyService {
  private apiKey: string | null;
  private integrationKey: string | null;

  constructor(apiKey?: string, integrationKey?: string) {
    this.apiKey = apiKey || null;
    this.integrationKey = integrationKey || null;
  }

  /**
   * Erstellt einen Incident in PagerDuty
   */
  async createIncident(alert: Alert): Promise<void> {
    if (!this.integrationKey) {
      logger.warn('PagerDuty integration key not configured, skipping PagerDuty notification');
      return;
    }

    try {
      // Für kritische Alerts erstellen wir einen Incident
      if (alert.severity !== 'critical') {
        logger.info(`Skipping PagerDuty incident creation for non-critical alert: ${alert.title}`);
        return;
      }

      const payload = {
        payload: {
          summary: `${alert.title}: ${alert.message}`,
          source: 'smartlaw-backend',
          severity: 'critical',
          timestamp: alert.timestamp.toISOString(),
          custom_details: {
            ...alert.metadata,
            alertId: alert.id
          }
        },
        routing_key: this.integrationKey,
        event_action: 'trigger',
        dedup_key: `alert-${alert.id}`
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (this.apiKey) {
        headers['Authorization'] = `Token token=${this.apiKey}`;
      }

      const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`PagerDuty API returned ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const responseData: any = await response.json();
        // Type assertion für responseData
        const dedupKey = responseData.dedup_key || 'unknown';
        logger.info(`Successfully created PagerDuty incident: ${dedupKey}`);
      } else {
        logger.info(`Successfully created PagerDuty incident for alert: ${alert.id}`);
      }
    } catch (error) {
      logger.error('Failed to create PagerDuty incident:', error);
      throw error;
    }
  }

  /**
   * Löst einen bestehenden Incident auf
   */
  async resolveIncident(alertId: string): Promise<void> {
    if (!this.integrationKey) {
      logger.warn('PagerDuty integration key not configured, skipping PagerDuty resolve');
      return;
    }

    try {
      const payload = {
        payload: {
          summary: `Alert resolved`,
          source: 'smartlaw-backend',
          severity: 'info',
          timestamp: new Date().toISOString()
        },
        routing_key: this.integrationKey,
        event_action: 'resolve',
        dedup_key: `alert-${alertId}`
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (this.apiKey) {
        headers['Authorization'] = `Token token=${this.apiKey}`;
      }

      const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`PagerDuty API returned ${response.status}: ${response.statusText}`);
      }

      logger.info(`Successfully resolved PagerDuty incident for alert: ${alertId}`);
    } catch (error) {
      logger.error('Failed to resolve PagerDuty incident:', error);
      throw error;
    }
  }

  /**
   * Prüft, ob der Service korrekt konfiguriert ist
   */
  isConfigured(): boolean {
    return !!this.integrationKey;
  }
}