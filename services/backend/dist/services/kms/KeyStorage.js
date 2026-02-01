"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyStorage = void 0;
const logger_1 = require("../../utils/logger");
const kms_1 = require("../../types/kms");
/**
 * Key Storage Layer
 *
 * Verwaltet die Speicherung verschlüsselter Schlüssel in PostgreSQL
 * mit Tenant-Isolation und Envelope Encryption
 */
class KeyStorage {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Speichert einen verschlüsselten Schlüssel
     */
    async saveKey(keyData) {
        try {
            await this.prisma.encryptionKey.create({
                data: {
                    id: keyData.id,
                    tenantId: keyData.tenantId,
                    purpose: keyData.purpose,
                    algorithm: keyData.algorithm,
                    encryptedKey: keyData.encryptedKey,
                    iv: keyData.iv,
                    authTag: keyData.authTag,
                    version: keyData.version,
                    status: keyData.status,
                    expiresAt: keyData.expiresAt,
                    metadata: keyData.metadata || {}
                }
            });
            logger_1.logger.info(`Key saved: ${keyData.id} for tenant ${keyData.tenantId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to save key:', error);
            throw new kms_1.KeyManagementError('Failed to save encryption key', kms_1.KeyManagementErrorCode.ENCRYPTION_FAILED, keyData.id, keyData.tenantId);
        }
    }
    /**
     * Ruft einen verschlüsselten Schlüssel ab (mit Tenant-Isolation)
     */
    async getKey(keyId, tenantId) {
        try {
            const key = await this.prisma.encryptionKey.findFirst({
                where: {
                    id: keyId,
                    tenantId: tenantId
                }
            });
            if (!key) {
                return null;
            }
            return {
                id: key.id,
                tenantId: key.tenantId,
                encryptedKey: key.encryptedKey,
                iv: key.iv,
                authTag: key.authTag,
                version: key.version,
                status: key.status,
                purpose: key.purpose,
                algorithm: key.algorithm,
                createdAt: key.createdAt,
                updatedAt: key.updatedAt,
                expiresAt: key.expiresAt || undefined,
                metadata: key.metadata || undefined
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get key:', error);
            throw new kms_1.KeyManagementError('Failed to retrieve encryption key', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND, keyId, tenantId);
        }
    }
    /**
     * Ruft den aktuellsten Schlüssel für einen bestimmten Purpose ab
     */
    async getLatestKeyForPurpose(tenantId, purpose) {
        try {
            const key = await this.prisma.encryptionKey.findFirst({
                where: {
                    tenantId: tenantId,
                    purpose: purpose,
                    status: kms_1.KeyStatus.ACTIVE
                },
                orderBy: {
                    version: 'desc'
                }
            });
            if (!key) {
                return null;
            }
            return {
                id: key.id,
                tenantId: key.tenantId,
                encryptedKey: key.encryptedKey,
                iv: key.iv,
                authTag: key.authTag,
                version: key.version,
                status: key.status,
                purpose: key.purpose,
                algorithm: key.algorithm,
                createdAt: key.createdAt,
                updatedAt: key.updatedAt,
                expiresAt: key.expiresAt || undefined,
                metadata: key.metadata || undefined
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get latest key for purpose:', error);
            throw new kms_1.KeyManagementError('Failed to retrieve latest encryption key', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND, undefined, tenantId);
        }
    }
    /**
     * Aktualisiert den Status eines Schlüssels
     */
    async updateKeyStatus(keyId, tenantId, status) {
        try {
            await this.prisma.encryptionKey.updateMany({
                where: {
                    id: keyId,
                    tenantId: tenantId
                },
                data: {
                    status: status,
                    updatedAt: new Date()
                }
            });
            logger_1.logger.info(`Key status updated: ${keyId} -> ${status}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to update key status:', error);
            throw new kms_1.KeyManagementError('Failed to update key status', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND, keyId, tenantId);
        }
    }
    /**
     * Aktualisiert die lastUsedAt Zeit eines Schlüssels
     */
    async updateLastUsed(keyId, tenantId) {
        try {
            await this.prisma.encryptionKey.updateMany({
                where: {
                    id: keyId,
                    tenantId: tenantId
                },
                data: {
                    lastUsedAt: new Date()
                }
            });
        }
        catch (error) {
            // Fehler beim Update von lastUsedAt sollten nicht kritisch sein
            logger_1.logger.warn(`Failed to update lastUsedAt for key ${keyId}:`, error);
        }
    }
    /**
     * Aktualisiert Metadaten eines Schlüssels
     */
    async updateKeyMetadata(keyId, tenantId, metadata) {
        try {
            await this.prisma.encryptionKey.updateMany({
                where: {
                    id: keyId,
                    tenantId: tenantId
                },
                data: {
                    expiresAt: metadata.expiresAt,
                    metadata: metadata.metadata,
                    updatedAt: new Date()
                }
            });
            logger_1.logger.info(`Key metadata updated: ${keyId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to update key metadata:', error);
            throw new kms_1.KeyManagementError('Failed to update key metadata', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND, keyId, tenantId);
        }
    }
    /**
     * Listet Schlüssel mit Filteroptionen
     */
    async listKeys(tenantId, filters) {
        try {
            const where = {
                tenantId: tenantId
            };
            if (filters?.status) {
                where.status = filters.status;
            }
            if (filters?.purpose) {
                where.purpose = filters.purpose;
            }
            if (filters?.expiresAfter) {
                where.expiresAt = {
                    ...where.expiresAt,
                    gte: filters.expiresAfter
                };
            }
            if (filters?.expiresBefore) {
                where.expiresAt = {
                    ...where.expiresAt,
                    lte: filters.expiresBefore
                };
            }
            const keys = await this.prisma.encryptionKey.findMany({
                where,
                orderBy: {
                    createdAt: 'desc'
                },
                take: filters?.limit || 100,
                skip: filters?.offset || 0
            });
            return keys.map(key => ({
                id: key.id,
                tenantId: key.tenantId,
                purpose: key.purpose,
                algorithm: key.algorithm,
                version: key.version,
                status: key.status,
                createdAt: key.createdAt,
                updatedAt: key.updatedAt,
                expiresAt: key.expiresAt || undefined,
                lastUsedAt: key.lastUsedAt || undefined,
                metadata: key.metadata || undefined
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to list keys:', error);
            throw new kms_1.KeyManagementError('Failed to list encryption keys', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND, undefined, tenantId);
        }
    }
    /**
     * Löscht einen Schlüssel (physisch aus der Datenbank)
     */
    async deleteKey(keyId, tenantId) {
        try {
            await this.prisma.encryptionKey.deleteMany({
                where: {
                    id: keyId,
                    tenantId: tenantId
                }
            });
            logger_1.logger.info(`Key deleted: ${keyId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to delete key:', error);
            throw new kms_1.KeyManagementError('Failed to delete encryption key', kms_1.KeyManagementErrorCode.KEY_NOT_FOUND, keyId, tenantId);
        }
    }
    /**
     * Zählt Schlüssel nach Status
     */
    async countKeysByStatus(tenantId) {
        try {
            const counts = await this.prisma.encryptionKey.groupBy({
                by: ['status'],
                where: {
                    tenantId: tenantId
                },
                _count: true
            });
            const result = {};
            for (const status of Object.values(kms_1.KeyStatus)) {
                result[status] = 0;
            }
            counts.forEach(count => {
                result[count.status] = count._count;
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to count keys by status:', error);
            return {};
        }
    }
    /**
     * Findet abgelaufene Schlüssel
     */
    async findExpiredKeys(tenantId) {
        try {
            const where = {
                expiresAt: {
                    lte: new Date()
                },
                status: kms_1.KeyStatus.ACTIVE
            };
            if (tenantId) {
                where.tenantId = tenantId;
            }
            const keys = await this.prisma.encryptionKey.findMany({
                where
            });
            return keys.map(key => ({
                id: key.id,
                tenantId: key.tenantId,
                purpose: key.purpose,
                algorithm: key.algorithm,
                version: key.version,
                status: key.status,
                createdAt: key.createdAt,
                updatedAt: key.updatedAt,
                expiresAt: key.expiresAt || undefined,
                lastUsedAt: key.lastUsedAt || undefined,
                metadata: key.metadata || undefined
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to find expired keys:', error);
            return [];
        }
    }
}
exports.KeyStorage = KeyStorage;
