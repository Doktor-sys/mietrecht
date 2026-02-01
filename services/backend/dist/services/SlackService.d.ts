import { Alert } from './kms/AlertManager';
/**
 * Slack Service für Benachrichtigungen
 */
export declare class SlackService {
    private webhookUrl;
    private channel;
    constructor(webhookUrl?: string, channel?: string);
    /**
     * Sendet einen Alert an einen Slack-Channel
     */
    sendAlert(alert: Alert): Promise<void>;
    /**
     * Gibt die Farbe für den Alert-Typ zurück
     */
    private getAlertColor;
    /**
     * Prüft, ob der Service korrekt konfiguriert ist
     */
    isConfigured(): boolean;
}
