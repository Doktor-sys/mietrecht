"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RotationCronJob = void 0;
exports.createRotationCronJob = createRotationCronJob;
const cron_1 = require("cron");
const logger_1 = require("../../utils/logger");
const KeyRotationManager_1 = require("./KeyRotationManager");
const AuditLogger_1 = require("./AuditLogger");
const config_1 = require("../../config/config");
/**
 * Rotation Cron Job
 *
 * Automatische Ausführung der Schlüsselrotation nach konfigurierbarem Zeitplan
 */
class RotationCronJob {
    constructor(rotationManager, auditLogger) {
        this.job = null;
        this.isRunning = false;
        this.rotationManager = rotationManager;
        this.auditLogger = auditLogger;
    }
    /**
     * Startet den Cron-Job
     *
     * @param cronExpression - Cron-Expression (Standard: täglich um 2 Uhr)
     */
    start(cronExpression = '0 2 * * *') {
        if (this.job) {
            logger_1.logger.warn('Rotation cron job is already running');
            return;
        }
        if (!config_1.config.kms.autoRotationEnabled) {
            logger_1.logger.info('Auto-rotation is disabled in configuration');
            return;
        }
        try {
            this.job = new cron_1.CronJob(cronExpression, async () => {
                await this.executeRotation();
            }, null, // onComplete
            true, // start immediately
            'Europe/Berlin' // timezone
            );
            logger_1.logger.info(`Rotation cron job started with schedule: ${cronExpression}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to start rotation cron job:', error);
            throw error;
        }
    }
    /**
     * Stoppt den Cron-Job
     */
    stop() {
        if (this.job) {
            this.job.stop();
            this.job = null;
            logger_1.logger.info('Rotation cron job stopped');
        }
    }
    /**
     * Gibt den Status des Cron-Jobs zurück
     */
    getStatus() {
        return {
            isRunning: this.job !== null && this.job.running,
            isExecuting: this.isRunning,
            nextExecution: this.job ? this.job.nextDate().toJSDate() : null
        };
    }
    /**
     * Führt die Rotation manuell aus (für Testing oder manuelle Trigger)
     */
    async executeRotation() {
        if (this.isRunning) {
            logger_1.logger.warn('Rotation is already running, skipping this execution');
            return;
        }
        this.isRunning = true;
        const startTime = Date.now();
        try {
            logger_1.logger.info('Starting scheduled key rotation check...');
            // Führe Rotation aus
            const report = await this.rotationManager.checkAndRotateExpiredKeys();
            // Protokolliere Ergebnis
            await this.auditLogger.logSecurityEvent({
                eventType: 'key_rotated',
                tenantId: 'system',
                action: 'scheduled_rotation',
                result: 'success',
                metadata: {
                    report,
                    duration: Date.now() - startTime
                }
            });
            logger_1.logger.info('Scheduled key rotation completed:', {
                rotatedKeys: report.rotatedKeys.length,
                failedKeys: report.failedKeys.length,
                duration: report.duration
            });
            // Warne bei Fehlern
            if (report.failedKeys.length > 0) {
                logger_1.logger.warn(`${report.failedKeys.length} keys failed to rotate:`, report.failedKeys);
            }
        }
        catch (error) {
            logger_1.logger.error('Scheduled key rotation failed:', error);
            // Protokolliere Fehler
            await this.auditLogger.logSecurityEvent({
                eventType: 'security_alert',
                tenantId: 'system',
                action: 'scheduled_rotation_failed',
                result: 'failure',
                metadata: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - startTime
                }
            });
        }
        finally {
            this.isRunning = false;
        }
    }
    /**
     * Aktualisiert den Cron-Schedule
     */
    updateSchedule(cronExpression) {
        this.stop();
        this.start(cronExpression);
        logger_1.logger.info(`Rotation schedule updated to: ${cronExpression}`);
    }
}
exports.RotationCronJob = RotationCronJob;
/**
 * Factory-Funktion zum Erstellen und Starten des Cron-Jobs
 */
function createRotationCronJob(prisma, cronExpression) {
    const rotationManager = new KeyRotationManager_1.KeyRotationManager(prisma);
    const auditLogger = new AuditLogger_1.AuditLogger(prisma);
    const cronJob = new RotationCronJob(rotationManager, auditLogger);
    if (config_1.config.kms.autoRotationEnabled) {
        cronJob.start(cronExpression);
    }
    return cronJob;
}
