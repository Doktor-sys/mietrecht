"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyManagementService = void 0;
const logger_1 = require("../../utils/logger");
const kms_1 = require("../../types/kms");
const AlertManager_1 = require("./AlertManager");
const crypto_1 = __importDefault(require("crypto"));
class KeyManagementService {
    constructor(prisma, redis, encryptionService) {
        this.prisma = prisma;
        this.redis = redis;
        this.encryptionService = encryptionService;
        this.alertManager = new AlertManager_1.AlertManager();
    }
    /**
     * Erstellt einen neuen Verschlüsselungsschlüssel
     */
    async createKey(options) {
        try {
            // Generiere neuen Schlüssel
            const keyBuffer = crypto_1.default.randomBytes(32);
            const keyId = crypto_1.default.randomBytes(16).toString('hex');
            // Hole Master Key für die Verschlüsselung des neuen Schlüssels
            // In einer echten Implementierung würde dies vom Master Key Service kommen
            const masterKey = this.encryptionService.generateKey();
            const encryptedKeyData = this.encryptionService.encrypt(keyBuffer.toString('hex'), masterKey);
            // Erstelle Rotationsschedule wenn autoRotate aktiviert ist
            let rotationSchedule;
            if (options.autoRotate && options.rotationIntervalDays) {
                const nextRotationAt = new Date();
                nextRotationAt.setDate(nextRotationAt.getDate() + options.rotationIntervalDays);
                rotationSchedule = {
                    enabled: true,
                    intervalDays: options.rotationIntervalDays,
                    nextRotationAt,
                    lastRotationAt: undefined
                };
            }
            // Erstelle HMAC-Signatur für Audit-Log
            const auditData = JSON.stringify({
                eventType: kms_1.AuditEventType.KEY_CREATED,
                tenantId: options.tenantId,
                action: 'create_key',
                result: 'success',
                timestamp: new Date().toISOString()
            });
            const hmacSignature = this.encryptionService.createHMAC(auditData, masterKey);
            // Speichere den verschlüsselten Schlüssel in der Datenbank
            const keyRecord = await this.prisma.encryptionKey.create({
                data: {
                    id: keyId,
                    tenantId: options.tenantId,
                    encryptedKey: encryptedKeyData.encryptedData,
                    iv: encryptedKeyData.iv,
                    authTag: encryptedKeyData.authTag,
                    purpose: options.purpose,
                    algorithm: options.algorithm || 'aes-256-gcm',
                    version: 1,
                    status: kms_1.KeyStatus.ACTIVE,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    expiresAt: options.expiresAt,
                    metadata: options.metadata,
                    rotationSchedule: rotationSchedule ? {
                        create: {
                            enabled: rotationSchedule.enabled,
                            intervalDays: rotationSchedule.intervalDays,
                            nextRotationAt: rotationSchedule.nextRotationAt,
                            lastRotationAt: rotationSchedule.lastRotationAt
                        }
                    } : undefined
                }
            });
            // Speichere den Schlüssel auch im Cache
            const cacheKey = `kms:key:${keyId}`;
            const cacheData = {
                id: keyRecord.id,
                tenantId: keyRecord.tenantId,
                purpose: keyRecord.purpose,
                algorithm: keyRecord.algorithm,
                version: keyRecord.version,
                status: keyRecord.status,
                createdAt: keyRecord.createdAt,
                updatedAt: keyRecord.updatedAt,
                expiresAt: keyRecord.expiresAt || undefined,
                rotationSchedule,
                metadata: keyRecord.metadata
            };
            await this.redis.setEx(cacheKey, 3600, // 1 Stunde Cache
            JSON.stringify(cacheData));
            // Erstelle Audit Log
            await this.prisma.auditLog.create({
                data: {
                    id: `audit-${crypto_1.default.randomUUID()}`,
                    timestamp: new Date(),
                    eventType: kms_1.AuditEventType.KEY_CREATED,
                    tenantId: options.tenantId,
                    action: 'create_key',
                    result: 'success',
                    metadata: {
                        purpose: options.purpose,
                        algorithm: options.algorithm || 'aes-256-gcm'
                    },
                    hmacSignature
                }
            });
            return cacheData;
        }
        catch (error) {
            logger_1.logger.error(`Failed to create encryption key:`, error);
            // Erstelle HMAC-Signatur für Fehler-Audit-Log
            const masterKey = this.encryptionService.generateKey();
            const errorAuditData = JSON.stringify({
                eventType: kms_1.AuditEventType.KEY_CREATED,
                tenantId: options.tenantId,
                action: 'create_key',
                result: 'failure',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            const errorHmacSignature = this.encryptionService.createHMAC(errorAuditData, masterKey);
            // Erstelle Audit Log für Fehler
            try {
                await this.prisma.auditLog.create({
                    data: {
                        id: `audit-${crypto_1.default.randomUUID()}`,
                        timestamp: new Date(),
                        eventType: kms_1.AuditEventType.KEY_CREATED,
                        tenantId: options.tenantId,
                        action: 'create_key',
                        result: 'failure',
                        metadata: {
                            error: error instanceof Error ? error.message : 'Unknown error'
                        },
                        hmacSignature: errorHmacSignature
                    }
                });
            }
            catch (auditError) {
                logger_1.logger.error('Failed to create audit log for key creation error:', auditError);
            }
            throw new kms_1.KeyManagementError('Failed to create encryption key', kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
        }
    }
    /**
     * Ruft Metadaten eines Schlüssels ab
     */
    async getKeyMetadata(keyId, tenantId) {
        try {
            // Prüfe zuerst den Cache
            const cacheKey = `kms:key:${keyId}`;
            const cachedData = await this.redis.get(cacheKey);
            if (cachedData) {
                const keyMetadata = JSON.parse(cachedData);
                // Aktualisiere lastUsedAt
                keyMetadata.lastUsedAt = new Date();
                await this.redis.setEx(cacheKey, 3600, JSON.stringify(keyMetadata));
                // Erstelle HMAC-Signatur für Audit-Log
                const masterKey = this.encryptionService.generateKey();
                const auditData = JSON.stringify({
                    eventType: kms_1.AuditEventType.KEY_ACCESSED,
                    tenantId: tenantId,
                    action: 'get_key_metadata',
                    result: 'success',
                    timestamp: new Date().toISOString()
                });
                const hmacSignature = this.encryptionService.createHMAC(auditData, masterKey);
                // Erstelle Audit Log
                await this.prisma.auditLog.create({
                    data: {
                        id: `audit-${crypto_1.default.randomUUID()}`,
                        timestamp: new Date(),
                        eventType: kms_1.AuditEventType.KEY_ACCESSED,
                        tenantId: tenantId,
                        action: 'get_key_metadata',
                        result: 'success',
                        hmacSignature
                    }
                });
                return keyMetadata;
            }
            // Hole den Schlüssel aus der Datenbank
            const keyRecord = await this.prisma.encryptionKey.findUnique({
                where: {
                    id: keyId,
                    tenantId: tenantId
                },
                include: {
                    rotationSchedule: true
                }
            });
            if (!keyRecord) {
                // Erstelle HMAC-Signatur für Fehler-Audit-Log
                const masterKey = this.encryptionService.generateKey();
                const errorAuditData = JSON.stringify({
                    eventType: kms_1.AuditEventType.KEY_ACCESSED,
                    tenantId: tenantId,
                    action: 'get_key_metadata',
                    result: 'failure',
                    timestamp: new Date().toISOString(),
                    error: 'Encryption key not found'
                });
                const errorHmacSignature = this.encryptionService.createHMAC(errorAuditData, masterKey);
                // Erstelle Audit Log für Fehler
                await this.prisma.auditLog.create({
                    data: {
                        id: `audit-${crypto_1.default.randomUUID()}`,
                        timestamp: new Date(),
                        eventType: kms_1.AuditEventType.KEY_ACCESSED,
                        tenantId: tenantId,
                        action: 'get_key_metadata',
                        result: 'failure',
                        metadata: {
                            error: 'Encryption key not found'
                        },
                        hmacSignature: errorHmacSignature
                    }
                });
                throw new kms_1.KeyManagementError('Encryption key not found', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND);
            }
            // Konvertiere Rotation Schedule
            let rotationSchedule;
            if (keyRecord.rotationSchedule) {
                rotationSchedule = {
                    enabled: keyRecord.rotationSchedule.enabled,
                    intervalDays: keyRecord.rotationSchedule.intervalDays,
                    nextRotationAt: keyRecord.rotationSchedule.nextRotationAt,
                    lastRotationAt: keyRecord.rotationSchedule.lastRotationAt || undefined
                };
            }
            const keyMetadata = {
                id: keyRecord.id,
                tenantId: keyRecord.tenantId,
                purpose: keyRecord.purpose,
                algorithm: keyRecord.algorithm,
                version: keyRecord.version,
                status: keyRecord.status,
                createdAt: keyRecord.createdAt,
                updatedAt: keyRecord.updatedAt,
                expiresAt: keyRecord.expiresAt || undefined,
                lastUsedAt: new Date(),
                rotationSchedule,
                metadata: keyRecord.metadata
            };
            // Speichere im Cache
            await this.redis.setEx(cacheKey, 3600, JSON.stringify(keyMetadata));
            // Erstelle HMAC-Signatur für Audit-Log
            const masterKey = this.encryptionService.generateKey();
            const auditData = JSON.stringify({
                eventType: kms_1.AuditEventType.KEY_ACCESSED,
                tenantId: tenantId,
                action: 'get_key_metadata',
                result: 'success',
                timestamp: new Date().toISOString()
            });
            const hmacSignature = this.encryptionService.createHMAC(auditData, masterKey);
            // Erstelle Audit Log
            await this.prisma.auditLog.create({
                data: {
                    id: `audit-${crypto_1.default.randomUUID()}`,
                    timestamp: new Date(),
                    eventType: kms_1.AuditEventType.KEY_ACCESSED,
                    tenantId: tenantId,
                    action: 'get_key_metadata',
                    result: 'success',
                    hmacSignature
                }
            });
            return keyMetadata;
        }
        catch (error) {
            if (error instanceof kms_1.KeyManagementError) {
                throw error;
            }
            logger_1.logger.error(`Failed to get key metadata for ${keyId}:`, error);
            throw new kms_1.KeyManagementError(`Failed to get key metadata: ${error instanceof Error ? error.message : 'Unknown error'}`, kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
        }
    }
    /**
     * Markiert einen Schlüssel als kompromittiert
     */
    async compromiseKey(keyId, tenantId) {
        try {
            // Aktualisiere den Schlüssel-Status
            await this.prisma.encryptionKey.update({
                where: {
                    id: keyId,
                    tenantId: tenantId
                },
                data: {
                    status: kms_1.KeyStatus.COMPROMISED,
                    updatedAt: new Date()
                }
            });
            // Lösche den Schlüssel aus dem Cache
            await this.redis.del(`kms:key:${keyId}`);
            // Erstelle einen Alert
            if (this.alertManager) {
                this.alertManager.handleSecurityEvent('key_compromised', {
                    keyId,
                    tenantId,
                    timestamp: new Date(),
                    description: `Encryption key ${keyId} has been marked as compromised`
                });
            }
            logger_1.logger.warn(`Key ${keyId} marked as compromised for tenant ${tenantId}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to compromise key ${keyId}:`, error);
            throw new kms_1.KeyManagementError('Failed to compromise key', kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
        }
    }
    /**
     * Rotiert einen Schlüssel
     */
    async rotateKey(keyId, tenantId) {
        try {
            // Hole den aktuellen Schlüssel
            const currentKey = await this.prisma.encryptionKey.findUnique({
                where: {
                    id: keyId,
                    tenantId: tenantId
                },
                include: {
                    rotationSchedule: true
                }
            });
            if (!currentKey) {
                throw new kms_1.KeyManagementError('Key not found', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND);
            }
            if (currentKey.status !== kms_1.KeyStatus.ACTIVE) {
                throw new kms_1.KeyManagementError('Only active keys can be rotated', kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
            }
            // Erstelle einen neuen Schlüssel
            const newKey = await this.createKey({
                tenantId,
                purpose: currentKey.purpose,
                algorithm: currentKey.algorithm,
                expiresAt: currentKey.expiresAt ? new Date(currentKey.expiresAt) : undefined,
                autoRotate: currentKey.rotationSchedule?.enabled,
                rotationIntervalDays: currentKey.rotationSchedule?.intervalDays,
                metadata: currentKey.metadata
            });
            // Markiere den alten Schlüssel als deprecated
            await this.prisma.encryptionKey.update({
                where: {
                    id: keyId,
                    tenantId: tenantId
                },
                data: {
                    status: kms_1.KeyStatus.DEPRECATED,
                    updatedAt: new Date()
                }
            });
            // Lösche den alten Schlüssel aus dem Cache
            await this.redis.del(`kms:key:${keyId}`);
            // Erstelle einen Alert für die Rotation
            if (this.alertManager) {
                this.alertManager.handleSecurityEvent('key_rotation', {
                    oldKeyId: keyId,
                    newKeyId: newKey.id,
                    tenantId,
                    timestamp: new Date(),
                    description: `Key rotated from ${keyId} to ${newKey.id}`
                });
            }
            logger_1.logger.info(`Key ${keyId} rotated to ${newKey.id} for tenant ${tenantId}`);
            return newKey;
        }
        catch (error) {
            logger_1.logger.error(`Failed to rotate key ${keyId}:`, error);
            // Erstelle einen Alert für den Fehler
            if (this.alertManager) {
                this.alertManager.handleSecurityEvent('key_rotation_failed', {
                    keyId,
                    tenantId,
                    timestamp: new Date(),
                    description: `Failed to rotate key ${keyId}: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            if (error instanceof kms_1.KeyManagementError) {
                throw error;
            }
            throw new kms_1.KeyManagementError(`Failed to rotate key: ${error instanceof Error ? error.message : 'Unknown error'}`, kms_1.KeyManagementErrorCode.ROTATION_FAILED);
        }
    }
    /**
     * Gets the active key for a specific purpose
     */
    async getActiveKeyForPurpose(tenantId, purpose) {
        try {
            // Check cache first
            const cacheKey = `kms:active_key:${tenantId}:${purpose}`;
            const cachedData = await this.redis.get(cacheKey);
            if (cachedData) {
                const keyMetadata = JSON.parse(cachedData);
                // Create HMAC signature for audit log
                const masterKey = this.encryptionService.generateKey();
                const auditData = JSON.stringify({
                    eventType: kms_1.AuditEventType.KEY_ACCESSED,
                    tenantId: tenantId,
                    action: 'get_active_key_for_purpose',
                    result: 'success',
                    timestamp: new Date().toISOString()
                });
                const hmacSignature = this.encryptionService.createHMAC(auditData, masterKey);
                // Create audit log
                await this.prisma.keyAuditLog.create({
                    data: {
                        id: `audit-${crypto_1.default.randomUUID()}`,
                        keyId: keyMetadata.id,
                        timestamp: new Date(),
                        eventType: kms_1.AuditEventType.KEY_ACCESSED,
                        tenantId: tenantId,
                        action: 'get_active_key_for_purpose',
                        result: 'success',
                        metadata: {
                            purpose: purpose
                        },
                        hmacSignature
                    }
                });
                return keyMetadata;
            }
            // Get the active key from database
            const keyRecord = await this.prisma.encryptionKey.findFirst({
                where: {
                    tenantId: tenantId,
                    purpose: purpose,
                    status: kms_1.KeyStatus.ACTIVE
                },
                orderBy: {
                    version: 'desc' // Get the latest version
                },
                include: {
                    rotationSchedule: true
                }
            });
            if (!keyRecord) {
                // If no active key found, create a new one
                const newKey = await this.createKey({
                    tenantId: tenantId,
                    purpose: purpose,
                    algorithm: 'aes-256-gcm'
                });
                return newKey;
            }
            // Convert rotation schedule
            let rotationSchedule;
            if (keyRecord.rotationSchedule) {
                rotationSchedule = {
                    enabled: keyRecord.rotationSchedule.enabled,
                    intervalDays: keyRecord.rotationSchedule.intervalDays,
                    nextRotationAt: keyRecord.rotationSchedule.nextRotationAt,
                    lastRotationAt: keyRecord.rotationSchedule.lastRotationAt || undefined
                };
            }
            const keyMetadata = {
                id: keyRecord.id,
                tenantId: keyRecord.tenantId,
                purpose: keyRecord.purpose,
                algorithm: keyRecord.algorithm,
                version: keyRecord.version,
                status: keyRecord.status,
                createdAt: keyRecord.createdAt,
                updatedAt: keyRecord.updatedAt,
                expiresAt: keyRecord.expiresAt || undefined,
                lastUsedAt: new Date(),
                rotationSchedule,
                metadata: keyRecord.metadata
            };
            // Store in cache
            await this.redis.setEx(cacheKey, 3600, JSON.stringify(keyMetadata));
            // Create HMAC signature for audit log
            const masterKey = this.encryptionService.generateKey();
            const auditData = JSON.stringify({
                eventType: kms_1.AuditEventType.KEY_ACCESSED,
                tenantId: tenantId,
                action: 'get_active_key_for_purpose',
                result: 'success',
                timestamp: new Date().toISOString()
            });
            const hmacSignature = this.encryptionService.createHMAC(auditData, masterKey);
            // Create audit log
            await this.prisma.keyAuditLog.create({
                data: {
                    id: `audit-${crypto_1.default.randomUUID()}`,
                    keyId: keyRecord.id,
                    timestamp: new Date(),
                    eventType: kms_1.AuditEventType.KEY_ACCESSED,
                    tenantId: tenantId,
                    action: 'get_active_key_for_purpose',
                    result: 'success',
                    metadata: {
                        purpose: purpose
                    },
                    hmacSignature
                }
            });
            return keyMetadata;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get active key for purpose ${purpose}:`, error);
            throw new kms_1.KeyManagementError(`Failed to get active key for purpose: ${error instanceof Error ? error.message : 'Unknown error'}`, kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
        }
    }
    /**
     * Gets a key by ID and decrypts it
     */
    async getKey(keyId, tenantId, serviceId) {
        try {
            // Check cache first
            const cacheKey = `kms:decrypted_key:${keyId}:${tenantId}`;
            const cachedData = await this.redis.get(cacheKey);
            if (cachedData) {
                // Update lastUsedAt
                await this.prisma.encryptionKey.update({
                    where: {
                        id: keyId,
                        tenantId: tenantId
                    },
                    data: {
                        lastUsedAt: new Date()
                    }
                });
                // Create HMAC signature for audit log
                const masterKey = this.encryptionService.generateKey();
                const auditData = JSON.stringify({
                    eventType: kms_1.AuditEventType.KEY_ACCESSED,
                    tenantId: tenantId,
                    serviceId: serviceId,
                    action: 'get_key',
                    result: 'success',
                    timestamp: new Date().toISOString()
                });
                const hmacSignature = this.encryptionService.createHMAC(auditData, masterKey);
                // Create audit log
                await this.prisma.keyAuditLog.create({
                    data: {
                        id: `audit-${crypto_1.default.randomUUID()}`,
                        keyId: keyId,
                        timestamp: new Date(),
                        eventType: kms_1.AuditEventType.KEY_ACCESSED,
                        tenantId: tenantId,
                        serviceId: serviceId,
                        action: 'get_key',
                        result: 'success',
                        metadata: {
                            keyId: keyId
                        },
                        hmacSignature
                    }
                });
                return cachedData;
            }
            // Get the key from database
            const keyRecord = await this.prisma.encryptionKey.findUnique({
                where: {
                    id: keyId,
                    tenantId: tenantId
                }
            });
            if (!keyRecord) {
                // Create HMAC signature for error audit log
                const masterKey = this.encryptionService.generateKey();
                const errorAuditData = JSON.stringify({
                    eventType: kms_1.AuditEventType.KEY_ACCESSED,
                    tenantId: tenantId,
                    serviceId: serviceId,
                    action: 'get_key',
                    result: 'failure',
                    timestamp: new Date().toISOString(),
                    error: 'Encryption key not found'
                });
                const errorHmacSignature = this.encryptionService.createHMAC(errorAuditData, masterKey);
                // Create audit log for error
                await this.prisma.keyAuditLog.create({
                    data: {
                        id: `audit-${crypto_1.default.randomUUID()}`,
                        keyId: keyId, // Use the provided keyId even though it wasn't found
                        timestamp: new Date(),
                        eventType: kms_1.AuditEventType.KEY_ACCESSED,
                        tenantId: tenantId,
                        serviceId: serviceId,
                        action: 'get_key',
                        result: 'failure',
                        metadata: {
                            error: 'Encryption key not found',
                            keyId: keyId
                        },
                        hmacSignature: errorHmacSignature
                    }
                });
                throw new kms_1.KeyManagementError('Encryption key not found', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND);
            }
            // Check if key is active
            if (keyRecord.status !== kms_1.KeyStatus.ACTIVE && keyRecord.status !== kms_1.KeyStatus.DEPRECATED) {
                // Create HMAC signature for error audit log
                const masterKey = this.encryptionService.generateKey();
                const errorAuditData = JSON.stringify({
                    eventType: kms_1.AuditEventType.KEY_ACCESSED,
                    tenantId: tenantId,
                    serviceId: serviceId,
                    action: 'get_key',
                    result: 'failure',
                    timestamp: new Date().toISOString(),
                    error: `Key status is ${keyRecord.status}`
                });
                const errorHmacSignature = this.encryptionService.createHMAC(errorAuditData, masterKey);
                // Create audit log for error
                await this.prisma.keyAuditLog.create({
                    data: {
                        id: `audit-${crypto_1.default.randomUUID()}`,
                        keyId: keyId,
                        timestamp: new Date(),
                        eventType: kms_1.AuditEventType.KEY_ACCESSED,
                        tenantId: tenantId,
                        serviceId: serviceId,
                        action: 'get_key',
                        result: 'failure',
                        metadata: {
                            error: `Key status is ${keyRecord.status}`,
                            keyId: keyId,
                            status: keyRecord.status
                        },
                        hmacSignature: errorHmacSignature
                    }
                });
                throw new kms_1.KeyManagementError(`Key is not active: ${keyRecord.status}`, kms_1.KeyManagementErrorCode.KEY_DISABLED);
            }
            // In a real implementation, we would decrypt the key using the master key
            // For now, we'll just return a placeholder - in a real system, this would
            // involve decrypting the encryptedKey field with the master key
            const decryptedKey = "placeholder_decrypted_key_" + keyId;
            // Store in cache
            await this.redis.setEx(cacheKey, 300, decryptedKey); // 5 minutes cache
            // Update lastUsedAt
            await this.prisma.encryptionKey.update({
                where: {
                    id: keyId,
                    tenantId: tenantId
                },
                data: {
                    lastUsedAt: new Date()
                }
            });
            // Create HMAC signature for audit log
            const masterKey = this.encryptionService.generateKey();
            const auditData = JSON.stringify({
                eventType: kms_1.AuditEventType.KEY_ACCESSED,
                tenantId: tenantId,
                serviceId: serviceId,
                action: 'get_key',
                result: 'success',
                timestamp: new Date().toISOString()
            });
            const hmacSignature = this.encryptionService.createHMAC(auditData, masterKey);
            // Create audit log
            await this.prisma.keyAuditLog.create({
                data: {
                    id: `audit-${crypto_1.default.randomUUID()}`,
                    keyId: keyId,
                    timestamp: new Date(),
                    eventType: kms_1.AuditEventType.KEY_ACCESSED,
                    tenantId: tenantId,
                    serviceId: serviceId,
                    action: 'get_key',
                    result: 'success',
                    metadata: {
                        keyId: keyId
                    },
                    hmacSignature
                }
            });
            return decryptedKey;
        }
        catch (error) {
            if (error instanceof kms_1.KeyManagementError) {
                throw error;
            }
            logger_1.logger.error(`Failed to get key ${keyId}:`, error);
            throw new kms_1.KeyManagementError(`Failed to get key: ${error instanceof Error ? error.message : 'Unknown error'}`, kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
        }
    }
}
exports.KeyManagementService = KeyManagementService;
