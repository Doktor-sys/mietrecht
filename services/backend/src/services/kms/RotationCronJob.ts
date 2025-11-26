import { CronJob } from 'cron';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { KeyRotationManager } from './KeyRotationManager';
import { AuditLogger } from './AuditLogger';
import { config } from '../../config/config';

/**
 * Rotation Cron Job
 * 
 * Automatische Ausführung der Schlüsselrotation nach konfigurierbarem Zeitplan
 */
export class RotationCronJob {
  private job: CronJob | null = null;
  private rotationManager: KeyRotationManager;
  private auditLogger: AuditLogger;
  private isRunning: boolean = false;

  constructor(
    rotationManager: KeyRotationManager,
    auditLogger: AuditLogger
  ) {
    this.rotationManager = rotationManager;
    this.auditLogger = auditLogger;
  }

  /**
   * Startet den Cron-Job
   * 
   * @param cronExpression - Cron-Expression (Standard: täglich um 2 Uhr)
   */
  start(cronExpression: string = '0 2 * * *'): void {
    if (this.job) {
      logger.warn('Rotation cron job is already running');
      return;
    }

    if (!config.kms.autoRotationEnabled) {
      logger.info('Auto-rotation is disabled in configuration');
      return;
    }

    try {
      this.job = new CronJob(
        cronExpression,
        async () => {
          await this.executeRotation();
        },
        null, // onComplete
        true, // start immediately
        'Europe/Berlin' // timezone
      );

      logger.info(`Rotation cron job started with schedule: ${cronExpression}`);
    } catch (error) {
      logger.error('Failed to start rotation cron job:', error);
      throw error;
    }
  }

  /**
   * Stoppt den Cron-Job
   */
  stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
      logger.info('Rotation cron job stopped');
    }
  }

  /**
   * Gibt den Status des Cron-Jobs zurück
   */
  getStatus(): {
    isRunning: boolean;
    isExecuting: boolean;
    nextExecution: Date | null;
  } {
    return {
      isRunning: this.job !== null && this.job.running,
      isExecuting: this.isRunning,
      nextExecution: this.job ? this.job.nextDate().toJSDate() : null
    };
  }

  /**
   * Führt die Rotation manuell aus (für Testing oder manuelle Trigger)
   */
  async executeRotation(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Rotation is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting scheduled key rotation check...');

      // Führe Rotation aus
      const report = await this.rotationManager.checkAndRotateExpiredKeys();

      // Protokolliere Ergebnis
      await this.auditLogger.logSecurityEvent({
        eventType: 'key_rotated' as any,
        tenantId: 'system',
        action: 'scheduled_rotation',
        result: 'success',
        metadata: {
          report,
          duration: Date.now() - startTime
        }
      });

      logger.info('Scheduled key rotation completed:', {
        rotatedKeys: report.rotatedKeys.length,
        failedKeys: report.failedKeys.length,
        duration: report.duration
      });

      // Warne bei Fehlern
      if (report.failedKeys.length > 0) {
        logger.warn(`${report.failedKeys.length} keys failed to rotate:`, report.failedKeys);
      }
    } catch (error) {
      logger.error('Scheduled key rotation failed:', error);

      // Protokolliere Fehler
      await this.auditLogger.logSecurityEvent({
        eventType: 'security_alert' as any,
        tenantId: 'system',
        action: 'scheduled_rotation_failed',
        result: 'failure',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime
        }
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Aktualisiert den Cron-Schedule
   */
  updateSchedule(cronExpression: string): void {
    this.stop();
    this.start(cronExpression);
    logger.info(`Rotation schedule updated to: ${cronExpression}`);
  }
}

/**
 * Factory-Funktion zum Erstellen und Starten des Cron-Jobs
 */
export function createRotationCronJob(
  prisma: PrismaClient,
  cronExpression?: string
): RotationCronJob {
  const rotationManager = new KeyRotationManager(prisma);
  const auditLogger = new AuditLogger(prisma);
  
  const cronJob = new RotationCronJob(rotationManager, auditLogger);
  
  if (config.kms.autoRotationEnabled) {
    cronJob.start(cronExpression);
  }
  
  return cronJob;
}
