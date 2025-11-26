import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import {
  EncryptedKeyData,
  KeyMetadata,
  KeyStatus,
  KeyPurpose,
  KeyFilters,
  KeyManagementError,
  KeyManagementErrorCode
} from '../../types/kms';

/**
 * Key Storage Layer
 * 
 * Verwaltet die Speicherung verschlüsselter Schlüssel in PostgreSQL
 * mit Tenant-Isolation und Envelope Encryption
 */
export class KeyStorage {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Speichert einen verschlüsselten Schlüssel
   */
  async saveKey(keyData: EncryptedKeyData): Promise<void> {
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

      logger.info(`Key saved: ${keyData.id} for tenant ${keyData.tenantId}`);
    } catch (error) {
      logger.error('Failed to save key:', error);
      throw new KeyManagementError(
        'Failed to save encryption key',
        KeyManagementErrorCode.ENCRYPTION_FAILED,
        keyData.id,
        keyData.tenantId
      );
    }
  }

  /**
   * Ruft einen verschlüsselten Schlüssel ab (mit Tenant-Isolation)
   */
  async getKey(keyId: string, tenantId: string): Promise<EncryptedKeyData | null> {
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
        status: key.status as KeyStatus,
        purpose: key.purpose as KeyPurpose,
        algorithm: key.algorithm,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
        expiresAt: key.expiresAt || undefined,
        metadata: key.metadata as Record<string, any> || undefined
      };
    } catch (error) {
      logger.error('Failed to get key:', error);
      throw new KeyManagementError(
        'Failed to retrieve encryption key',
        KeyManagementErrorCode.KEY_NOT_FOUND,
        keyId,
        tenantId
      );
    }
  }

  /**
   * Ruft den aktuellsten Schlüssel für einen bestimmten Purpose ab
   */
  async getLatestKeyForPurpose(tenantId: string, purpose: KeyPurpose): Promise<EncryptedKeyData | null> {
    try {
      const key = await this.prisma.encryptionKey.findFirst({
        where: {
          tenantId: tenantId,
          purpose: purpose,
          status: KeyStatus.ACTIVE
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
        status: key.status as KeyStatus,
        purpose: key.purpose as KeyPurpose,
        algorithm: key.algorithm,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
        expiresAt: key.expiresAt || undefined,
        metadata: key.metadata as Record<string, any> || undefined
      };
    } catch (error) {
      logger.error('Failed to get latest key for purpose:', error);
      throw new KeyManagementError(
        'Failed to retrieve latest encryption key',
        KeyManagementErrorCode.KEY_NOT_FOUND,
        undefined,
        tenantId
      );
    }
  }

  /**
   * Aktualisiert den Status eines Schlüssels
   */
  async updateKeyStatus(keyId: string, tenantId: string, status: KeyStatus): Promise<void> {
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

      logger.info(`Key status updated: ${keyId} -> ${status}`);
    } catch (error) {
      logger.error('Failed to update key status:', error);
      throw new KeyManagementError(
        'Failed to update key status',
        KeyManagementErrorCode.KEY_NOT_FOUND,
        keyId,
        tenantId
      );
    }
  }

  /**
   * Aktualisiert die lastUsedAt Zeit eines Schlüssels
   */
  async updateLastUsed(keyId: string, tenantId: string): Promise<void> {
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
    } catch (error) {
      // Fehler beim Update von lastUsedAt sollten nicht kritisch sein
      logger.warn(`Failed to update lastUsedAt for key ${keyId}:`, error);
    }
  }

  /**
   * Aktualisiert Metadaten eines Schlüssels
   */
  async updateKeyMetadata(
    keyId: string,
    tenantId: string,
    metadata: Partial<KeyMetadata>
  ): Promise<void> {
    try {
      await this.prisma.encryptionKey.updateMany({
        where: {
          id: keyId,
          tenantId: tenantId
        },
        data: {
          expiresAt: metadata.expiresAt,
          metadata: metadata.metadata as any,
          updatedAt: new Date()
        }
      });

      logger.info(`Key metadata updated: ${keyId}`);
    } catch (error) {
      logger.error('Failed to update key metadata:', error);
      throw new KeyManagementError(
        'Failed to update key metadata',
        KeyManagementErrorCode.KEY_NOT_FOUND,
        keyId,
        tenantId
      );
    }
  }

  /**
   * Listet Schlüssel mit Filteroptionen
   */
  async listKeys(tenantId: string, filters?: KeyFilters): Promise<KeyMetadata[]> {
    try {
      const where: any = {
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
        purpose: key.purpose as KeyPurpose,
        algorithm: key.algorithm,
        version: key.version,
        status: key.status as KeyStatus,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
        expiresAt: key.expiresAt || undefined,
        lastUsedAt: key.lastUsedAt || undefined,
        metadata: key.metadata as Record<string, any> || undefined
      }));
    } catch (error) {
      logger.error('Failed to list keys:', error);
      throw new KeyManagementError(
        'Failed to list encryption keys',
        KeyManagementErrorCode.KEY_NOT_FOUND,
        undefined,
        tenantId
      );
    }
  }

  /**
   * Löscht einen Schlüssel (physisch aus der Datenbank)
   */
  async deleteKey(keyId: string, tenantId: string): Promise<void> {
    try {
      await this.prisma.encryptionKey.deleteMany({
        where: {
          id: keyId,
          tenantId: tenantId
        }
      });

      logger.info(`Key deleted: ${keyId}`);
    } catch (error) {
      logger.error('Failed to delete key:', error);
      throw new KeyManagementError(
        'Failed to delete encryption key',
        KeyManagementErrorCode.KEY_NOT_FOUND,
        keyId,
        tenantId
      );
    }
  }

  /**
   * Zählt Schlüssel nach Status
   */
  async countKeysByStatus(tenantId: string): Promise<Record<KeyStatus, number>> {
    try {
      const counts = await this.prisma.encryptionKey.groupBy({
        by: ['status'],
        where: {
          tenantId: tenantId
        },
        _count: true
      });

      const result: Record<string, number> = {};
      for (const status of Object.values(KeyStatus)) {
        result[status] = 0;
      }

      counts.forEach(count => {
        result[count.status] = count._count;
      });

      return result as Record<KeyStatus, number>;
    } catch (error) {
      logger.error('Failed to count keys by status:', error);
      return {} as Record<KeyStatus, number>;
    }
  }

  /**
   * Findet abgelaufene Schlüssel
   */
  async findExpiredKeys(tenantId?: string): Promise<KeyMetadata[]> {
    try {
      const where: any = {
        expiresAt: {
          lte: new Date()
        },
        status: KeyStatus.ACTIVE
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
        purpose: key.purpose as KeyPurpose,
        algorithm: key.algorithm,
        version: key.version,
        status: key.status as KeyStatus,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
        expiresAt: key.expiresAt || undefined,
        lastUsedAt: key.lastUsedAt || undefined,
        metadata: key.metadata as Record<string, any> || undefined
      }));
    } catch (error) {
      logger.error('Failed to find expired keys:', error);
      return [];
    }
  }
}
