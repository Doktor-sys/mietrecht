import cron from 'node-cron';
import { KeyManagementService } from './KeyManagementService';
import { logger } from '../../utils/logger';

/**
 * Cron-Job für KMS-Monitoring
 * Aktualisiert regelmäßig Statistiken und prüft Health
 */
export class MonitoringCronJob {
  private kmsService: KeyManagementService;
  private statisticsJob?: cron.ScheduledTask;
  private healthCheckJob?: cron.ScheduledTask;
  private alertCleanupJob?: cron.ScheduledTask;

  constructor(kmsService: KeyManagementService) {
    this.kmsService = kmsService;
  }

  /**
   * Startet alle Monitoring-Jobs
   */
  start(): void {
    // Statistiken alle 5 Minuten aktualisieren
    this.statisticsJob = cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Running KMS statistics update...');
        await this.kmsService.updateKeyStatistics();
        logger.info('KMS statistics updated successfully');
      } catch (error) {
        logger.error('Failed to update KMS statistics:', error);
      }
    });

    // Health Check alle 2 Minuten
    this.healthCheckJob = cron.schedule('*/2 * * * *', async () => {
      try {
        const health = await this.kmsService.checkHealth();
        
        if (!health.healthy) {
          logger.warn('KMS health check failed:', health);
        }
      } catch (error) {
        logger.error('Health check failed:', error);
      }
    });

    // Alert-Bereinigung täglich um 2 Uhr
    this.alertCleanupJob = cron.schedule('0 2 * * *', () => {
      try {
        logger.info('Running alert cleanup...');
        const alerts = this.kmsService.getActiveAlerts();
        logger.info(`Alert cleanup completed. Active alerts: ${alerts.length}`);
      } catch (error) {
        logger.error('Alert cleanup failed:', error);
      }
    });

    logger.info('KMS monitoring cron jobs started');
  }

  /**
   * Stoppt alle Monitoring-Jobs
   */
  stop(): void {
    if (this.statisticsJob) {
      this.statisticsJob.stop();
    }
    if (this.healthCheckJob) {
      this.healthCheckJob.stop();
    }
    if (this.alertCleanupJob) {
      this.alertCleanupJob.stop();
    }
    
    logger.info('KMS monitoring cron jobs stopped');
  }

  /**
   * Gibt den Status der Jobs zurück
   */
  getStatus(): {
    statisticsJob: boolean;
    healthCheckJob: boolean;
    alertCleanupJob: boolean;
  } {
    return {
      statisticsJob: this.statisticsJob !== undefined,
      healthCheckJob: this.healthCheckJob !== undefined,
      alertCleanupJob: this.alertCleanupJob !== undefined
    };
  }
}
