"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringCronJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("../../utils/logger");
/**
 * Cron-Job für KMS-Monitoring
 * Aktualisiert regelmäßig Statistiken und prüft Health
 */
class MonitoringCronJob {
    constructor(kmsService) {
        this.kmsService = kmsService;
    }
    /**
     * Startet alle Monitoring-Jobs
     */
    start() {
        // Statistiken alle 5 Minuten aktualisieren
        this.statisticsJob = node_cron_1.default.schedule('*/5 * * * *', async () => {
            try {
                logger_1.logger.info('Running KMS statistics update...');
                await this.kmsService.updateKeyStatistics();
                logger_1.logger.info('KMS statistics updated successfully');
            }
            catch (error) {
                logger_1.logger.error('Failed to update KMS statistics:', error);
            }
        });
        // Health Check alle 2 Minuten
        this.healthCheckJob = node_cron_1.default.schedule('*/2 * * * *', async () => {
            try {
                const health = await this.kmsService.checkHealth();
                if (!health.healthy) {
                    logger_1.logger.warn('KMS health check failed:', health);
                }
            }
            catch (error) {
                logger_1.logger.error('Health check failed:', error);
            }
        });
        // Alert-Bereinigung täglich um 2 Uhr
        this.alertCleanupJob = node_cron_1.default.schedule('0 2 * * *', () => {
            try {
                logger_1.logger.info('Running alert cleanup...');
                const alerts = this.kmsService.getActiveAlerts();
                logger_1.logger.info(`Alert cleanup completed. Active alerts: ${alerts.length}`);
            }
            catch (error) {
                logger_1.logger.error('Alert cleanup failed:', error);
            }
        });
        logger_1.logger.info('KMS monitoring cron jobs started');
    }
    /**
     * Stoppt alle Monitoring-Jobs
     */
    stop() {
        if (this.statisticsJob) {
            this.statisticsJob.stop();
        }
        if (this.healthCheckJob) {
            this.healthCheckJob.stop();
        }
        if (this.alertCleanupJob) {
            this.alertCleanupJob.stop();
        }
        logger_1.logger.info('KMS monitoring cron jobs stopped');
    }
    /**
     * Gibt den Status der Jobs zurück
     */
    getStatus() {
        return {
            statisticsJob: this.statisticsJob !== undefined,
            healthCheckJob: this.healthCheckJob !== undefined,
            alertCleanupJob: this.alertCleanupJob !== undefined
        };
    }
}
exports.MonitoringCronJob = MonitoringCronJob;
