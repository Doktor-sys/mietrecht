import { Alert } from './kms/AlertManager';
/**
 * PagerDuty Service für Incident Management
 */
export declare class PagerDutyService {
    private apiKey;
    private integrationKey;
    constructor(apiKey?: string, integrationKey?: string);
    /**
     * Erstellt einen Incident in PagerDuty
     */
    createIncident(alert: Alert): Promise<void>;
    /**
     * Löst einen bestehenden Incident auf
     */
    resolveIncident(alertId: string): Promise<void>;
    /**
     * Prüft, ob der Service korrekt konfiguriert ist
     */
    isConfigured(): boolean;
}
