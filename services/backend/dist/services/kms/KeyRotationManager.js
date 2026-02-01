"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyRotationManager = void 0;
const logger_1 = require("../../utils/logger");
const kms_1 = require("../../types/kms");
/**
 * Key Rotation Manager
 *
 * Verwaltet automatische und manuelle Schlüsselrotation
 * mit Re-Encryption von Daten
 */
class KeyRotationManager {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Rotiert einen Schlüssel manuell
     * Erstellt eine neue Version und markiert die alte als deprecated
     */
    async rotateKey(keyId, tenantId) {
        try {
            // Hole aktuellen Schlüssel
            const currentKey = await this.prisma.encryptionKey.findFirst({
                where: {
                    id: keyId,
                    tenantId: tenantId
                }
            });
            if (!currentKey) {
                throw new kms_1.KeyManagementError('Key not found for rotation', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND, keyId, tenantId);
            }
            // Prüfe ob Schlüssel rotiert werden kann
            if (currentKey.status !== kms_1.KeyStatus.ACTIVE) {
                throw new kms_1.KeyManagementError(`Cannot rotate key with status ${currentKey.status}`, kms_1.KeyManagementErrorCode.ROTATION_FAILED, keyId, tenantId);
            }
            // Markiere alten Schlüssel als deprecated
            await this.prisma.encryptionKey.update({
                where: { id: keyId },
                data: {
                    status: kms_1.KeyStatus.DEPRECATED,
                    updatedAt: new Date()
                }
            });
            logger_1.logger.info(`Key ${keyId} marked as deprecated for rotation`);
            // Neue Version wird vom KeyManagementService erstellt
            // Hier geben wir nur die Metadaten des alten Schlüssels zurück
            return {
                id: currentKey.id,
                tenantId: currentKey.tenantId,
                purpose: currentKey.purpose,
                algorithm: currentKey.algorithm,
                version: currentKey.version,
                status: kms_1.KeyStatus.DEPRECATED,
                createdAt: currentKey.createdAt,
                updatedAt: new Date(),
                expiresAt: currentKey.expiresAt || undefined,
                lastUsedAt: currentKey.lastUsedAt || undefined,
                metadata: currentKey.metadata
            };
        }
        catch (error) {
            if (error instanceof kms_1.KeyManagementError) {
                throw error;
            }
            logger_1.logger.error('Failed to rotate key:', error);
            throw new kms_1.KeyManagementError('Key rotation failed', kms_1.KeyManagementErrorCode.ROTATION_FAILED, keyId, tenantId);
        }
    }
    /**
     * Plant automatische Rotation für einen Schlüssel
     */
    async scheduleRotation(keyId, schedule) {
        try {
            // Prüfe ob Schlüssel existiert
            const key = await this.prisma.encryptionKey.findUnique({
                where: { id: keyId }
            });
            if (!key) {
                throw new kms_1.KeyManagementError('Key not found for scheduling rotation', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND, keyId);
            }
            // Erstelle oder aktualisiere Rotation Schedule
            await this.prisma.rotationSchedule.upsert({
                where: { keyId },
                create: {
                    keyId,
                    enabled: schedule.enabled,
                    intervalDays: schedule.intervalDays,
                    nextRotationAt: schedule.nextRotationAt,
                    lastRotationAt: schedule.lastRotationAt
                },
                update: {
                    enabled: schedule.enabled,
                    intervalDays: schedule.intervalDays,
                    nextRotationAt: schedule.nextRotationAt,
                    lastRotationAt: schedule.lastRotationAt,
                    updatedAt: new Date()
                }
            });
            logger_1.logger.info(`Rotation scheduled for key ${keyId}: every ${schedule.intervalDays} days`);
        }
        catch (error) {
            if (error instanceof kms_1.KeyManagementError) {
                throw error;
            }
            logger_1.logger.error('Failed to schedule rotation:', error);
            throw new kms_1.KeyManagementError('Failed to schedule key rotation', kms_1.KeyManagementErrorCode.ROTATION_FAILED, keyId);
        }
    }
    /**
     * Prüft und rotiert abgelaufene Schlüssel
     * Sollte regelmäßig per Cron-Job ausgeführt werden
     */
    async checkAndRotateExpiredKeys() {
        const startTime = Date.now();
        const rotatedKeys = [];
        const failedKeys = [];
        try {
            // Finde alle Schedules, die zur Rotation fällig sind
            const dueSchedules = await this.prisma.rotationSchedule.findMany({
                where: {
                    enabled: true,
                    nextRotationAt: {
                        lte: new Date()
                    }
                },
                include: {
                    key: true
                }
            });
            logger_1.logger.info(`Found ${dueSchedules.length} keys due for rotation`);
            for (const schedule of dueSchedules) {
                try {
                    // Rotiere Schlüssel
                    await this.rotateKey(schedule.key.id, schedule.key.tenantId);
                    rotatedKeys.push(schedule.key.id);
                    // Aktualisiere Schedule
                    const nextRotation = new Date();
                    nextRotation.setDate(nextRotation.getDate() + schedule.intervalDays);
                    await this.prisma.rotationSchedule.update({
                        where: { id: schedule.id },
                        data: {
                            lastRotationAt: new Date(),
                            nextRotationAt: nextRotation,
                            updatedAt: new Date()
                        }
                    });
                }
                catch (error) {
                    logger_1.logger.error(`Failed to rotate key ${schedule.key.id}:`, error);
                    failedKeys.push(schedule.key.id);
                }
            }
            // Finde auch manuell abgelaufene Schlüssel
            const expiredKeys = await this.prisma.encryptionKey.findMany({
                where: {
                    status: kms_1.KeyStatus.ACTIVE,
                    expiresAt: {
                        lte: new Date()
                    }
                }
            });
            for (const key of expiredKeys) {
                try {
                    await this.rotateKey(key.id, key.tenantId);
                    rotatedKeys.push(key.id);
                }
                catch (error) {
                    logger_1.logger.error(`Failed to rotate expired key ${key.id}:`, error);
                    failedKeys.push(key.id);
                }
            }
            const duration = Date.now() - startTime;
            const report = {
                rotatedKeys,
                failedKeys,
                totalProcessed: rotatedKeys.length + failedKeys.length,
                duration
            };
            logger_1.logger.info('Rotation check completed:', report);
            return report;
        }
        catch (error) {
            logger_1.logger.error('Failed to check and rotate expired keys:', error);
            return {
                rotatedKeys,
                failedKeys,
                totalProcessed: rotatedKeys.length + failedKeys.length,
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * Re-Encryption von Daten mit neuem Schlüssel
     *
     * Diese Methode koordiniert die Re-Encryption von Daten nach einer Schlüsselrotation.
     * Die tatsächliche Verschlüsselung wird vom EncryptionService durchgeführt.
     *
     * @param oldKeyId - ID des alten Schlüssels
     * @param newKeyId - ID des neuen Schlüssels
     * @param dataRefs - Referenzen zu den zu re-encryptenden Daten
     * @param encryptionCallback - Callback-Funktion für die tatsächliche Re-Encryption
     */
    async reEncryptData(oldKeyId, newKeyId, dataRefs, encryptionCallback) {
        try {
            logger_1.logger.info(`Starting re-encryption: ${oldKeyId} -> ${newKeyId}`);
            logger_1.logger.info(`Data references to re-encrypt: ${dataRefs.length}`);
            if (!encryptionCallback) {
                logger_1.logger.warn('No encryption callback provided - re-encryption skipped');
                logger_1.logger.warn('Re-encryption must be handled by the calling service');
                return;
            }
            let totalRecords = 0;
            let successfulRecords = 0;
            let failedRecords = 0;
            for (const ref of dataRefs) {
                try {
                    logger_1.logger.debug(`Re-encrypting ${ref.table}.${ref.column} for ${ref.ids.length} records`);
                    totalRecords += ref.ids.length;
                    // Rufe Callback für Re-Encryption auf
                    await encryptionCallback(oldKeyId, newKeyId, ref.table, ref.column, ref.ids);
                    successfulRecords += ref.ids.length;
                    logger_1.logger.info(`Successfully re-encrypted ${ref.ids.length} records in ${ref.table}.${ref.column}`);
                }
                catch (error) {
                    failedRecords += ref.ids.length;
                    logger_1.logger.error(`Failed to re-encrypt ${ref.table}.${ref.column}:`, error);
                    // Fahre mit nächster Referenz fort, aber tracke Fehler
                }
            }
            logger_1.logger.info('Re-encryption completed:', {
                totalRecords,
                successfulRecords,
                failedRecords,
                successRate: totalRecords > 0 ? (successfulRecords / totalRecords * 100).toFixed(2) + '%' : '0%'
            });
            if (failedRecords > 0) {
                throw new kms_1.KeyManagementError(`Re-encryption partially failed: ${failedRecords}/${totalRecords} records failed`, kms_1.KeyManagementErrorCode.ROTATION_FAILED, newKeyId);
            }
        }
        catch (error) {
            if (error instanceof kms_1.KeyManagementError) {
                throw error;
            }
            logger_1.logger.error('Failed to re-encrypt data:', error);
            throw new kms_1.KeyManagementError('Data re-encryption failed', kms_1.KeyManagementErrorCode.ROTATION_FAILED, newKeyId);
        }
    }
    /**
     * Gibt Rotation-Schedule für einen Schlüssel zurück
     */
    async getRotationSchedule(keyId) {
        try {
            const schedule = await this.prisma.rotationSchedule.findUnique({
                where: { keyId }
            });
            if (!schedule) {
                return null;
            }
            return {
                enabled: schedule.enabled,
                intervalDays: schedule.intervalDays,
                nextRotationAt: schedule.nextRotationAt,
                lastRotationAt: schedule.lastRotationAt || undefined
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get rotation schedule:', error);
            return null;
        }
    }
    /**
     * Deaktiviert automatische Rotation für einen Schlüssel
     */
    async disableAutoRotation(keyId) {
        try {
            await this.prisma.rotationSchedule.update({
                where: { keyId },
                data: {
                    enabled: false,
                    updatedAt: new Date()
                }
            });
            logger_1.logger.info(`Auto-rotation disabled for key ${keyId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to disable auto-rotation:', error);
            throw new kms_1.KeyManagementError('Failed to disable auto-rotation', kms_1.KeyManagementErrorCode.ROTATION_FAILED, keyId);
        }
    }
    /**
     * Aktiviert automatische Rotation für einen Schlüssel
     */
    async enableAutoRotation(keyId) {
        try {
            const schedule = await this.prisma.rotationSchedule.findUnique({
                where: { keyId }
            });
            if (!schedule) {
                throw new kms_1.KeyManagementError('No rotation schedule found for key', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND, keyId);
            }
            await this.prisma.rotationSchedule.update({
                where: { keyId },
                data: {
                    enabled: true,
                    updatedAt: new Date()
                }
            });
            logger_1.logger.info(`Auto-rotation enabled for key ${keyId}`);
        }
        catch (error) {
            if (error instanceof kms_1.KeyManagementError) {
                throw error;
            }
            logger_1.logger.error('Failed to enable auto-rotation:', error);
            throw new kms_1.KeyManagementError('Failed to enable auto-rotation', kms_1.KeyManagementErrorCode.ROTATION_FAILED, keyId);
        }
    }
    /**
     * Listet alle Schlüssel mit aktivierter Auto-Rotation
     */
    async listAutoRotationKeys(tenantId) {
        try {
            const where = {
                enabled: true
            };
            if (tenantId) {
                where.key = {
                    tenantId: tenantId
                };
            }
            const schedules = await this.prisma.rotationSchedule.findMany({
                where,
                include: {
                    key: true
                },
                orderBy: {
                    nextRotationAt: 'asc'
                }
            });
            return schedules.map(schedule => ({
                keyId: schedule.keyId,
                tenantId: schedule.key.tenantId,
                nextRotation: schedule.nextRotationAt,
                intervalDays: schedule.intervalDays
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to list auto-rotation keys:', error);
            return [];
        }
    }
    /**
     * Gibt Statistiken über Rotationen zurück
     */
    async getRotationStats(tenantId) {
        try {
            const where = {};
            if (tenantId) {
                where.key = {
                    tenantId: tenantId
                };
            }
            const totalScheduled = await this.prisma.rotationSchedule.count({ where });
            const activeSchedules = await this.prisma.rotationSchedule.count({
                where: {
                    ...where,
                    enabled: true
                }
            });
            const now = new Date();
            const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const upcomingRotations = await this.prisma.rotationSchedule.count({
                where: {
                    ...where,
                    enabled: true,
                    nextRotationAt: {
                        gte: now,
                        lte: in7Days
                    }
                }
            });
            const overdueRotations = await this.prisma.rotationSchedule.count({
                where: {
                    ...where,
                    enabled: true,
                    nextRotationAt: {
                        lt: now
                    }
                }
            });
            return {
                totalScheduled,
                activeSchedules,
                upcomingRotations,
                overdueRotations
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get rotation stats:', error);
            return {
                totalScheduled: 0,
                activeSchedules: 0,
                upcomingRotations: 0,
                overdueRotations: 0
            };
        }
    }
}
exports.KeyRotationManager = KeyRotationManager;
