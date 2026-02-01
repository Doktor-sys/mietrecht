import { KeyManagementService } from './KeyManagementService';
/**
 * Cron-Job für KMS-Monitoring
 * Aktualisiert regelmäßig Statistiken und prüft Health
 */
export declare class MonitoringCronJob {
    private kmsService;
    private statisticsJob?;
    private healthCheckJob?;
    private alertCleanupJob?;
    constructor(kmsService: KeyManagementService);
    /**
     * Startet alle Monitoring-Jobs
     */
    start(): void;
    /**
     * Stoppt alle Monitoring-Jobs
     */
    stop(): void;
    /**
     * Gibt den Status der Jobs zurück
     */
    getStatus(): {
        statisticsJob: boolean;
        healthCheckJob: boolean;
        alertCleanupJob: boolean;
    };
}
