import { PrismaClient } from '@prisma/client';
import { RedisClientType } from 'redis';
import { EncryptionService } from '../EncryptionService';
import { logger } from '../../utils/logger';
import {
  KeyMetadata,
  KeyStatus,
  KeyPurpose,
  AuditEventType,
  KeyManagementError,
  KeyManagementErrorCode,
  RotationSchedule,
  CreateKeyOptions
} from '../../types/kms';
import { AlertManager } from './AlertManager';
import crypto from 'crypto';

export class KeyManagementService {
  private prisma: PrismaClient;
  private redis: RedisClientType;
  private encryptionService: EncryptionService;
  private alertManager: AlertManager;

  constructor(
    prisma: PrismaClient,
    redis: RedisClientType,
    encryptionService: EncryptionService
  ) {
    this.prisma = prisma;
    this.redis = redis;
    this.encryptionService = encryptionService;
    this.alertManager = new AlertManager();
  }

  /**
   * Erstellt einen neuen Verschlüsselungsschlüssel
   */
  async createKey(options: CreateKeyOptions): Promise<KeyMetadata> {
    try {
      // Generiere neuen Schlüssel
      const keyBuffer = crypto.randomBytes(32);
      const keyId = crypto.randomBytes(16).toString('hex');
      
      // Hole Master Key für die Verschlüsselung des neuen Schlüssels
      // In einer echten Implementierung würde dies vom Master Key Service kommen
      const masterKey = this.encryptionService.generateKey();
      const encryptedKeyData = this.encryptionService.encrypt(keyBuffer.toString('hex'), masterKey);
      
      // Erstelle Rotationsschedule wenn autoRotate aktiviert ist
      let rotationSchedule: RotationSchedule | undefined;
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
        eventType: AuditEventType.KEY_CREATED,
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
          status: KeyStatus.ACTIVE,
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
      const cacheData: KeyMetadata = {
        id: keyRecord.id,
        tenantId: keyRecord.tenantId,
        purpose: keyRecord.purpose as KeyPurpose,
        algorithm: keyRecord.algorithm,
        version: keyRecord.version,
        status: keyRecord.status as KeyStatus,
        createdAt: keyRecord.createdAt,
        updatedAt: keyRecord.updatedAt,
        expiresAt: keyRecord.expiresAt || undefined,
        rotationSchedule,
        metadata: keyRecord.metadata as Record<string, any> | undefined
      };
      
      await this.redis.setEx(
        cacheKey,
        3600, // 1 Stunde Cache
        JSON.stringify(cacheData)
      );
      
      // Erstelle Audit Log
      await this.prisma.auditLog.create({
        data: {
          id: `audit-${crypto.randomUUID()}`,
          timestamp: new Date(),
          eventType: AuditEventType.KEY_CREATED,
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
    } catch (error) {
      logger.error(`Failed to create encryption key:`, error);
      
      // Erstelle HMAC-Signatur für Fehler-Audit-Log
      const masterKey = this.encryptionService.generateKey();
      const errorAuditData = JSON.stringify({
        eventType: AuditEventType.KEY_CREATED,
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
            id: `audit-${crypto.randomUUID()}`,
            timestamp: new Date(),
            eventType: AuditEventType.KEY_CREATED,
            tenantId: options.tenantId,
            action: 'create_key',
            result: 'failure',
            metadata: {
              error: error instanceof Error ? error.message : 'Unknown error'
            },
            hmacSignature: errorHmacSignature
          }
        });
      } catch (auditError) {
        logger.error('Failed to create audit log for key creation error:', auditError);
      }
      
      throw new KeyManagementError(
        'Failed to create encryption key',
        KeyManagementErrorCode.MASTER_KEY_ERROR
      );
    }
  }

  /**
   * Ruft Metadaten eines Schlüssels ab
   */
  async getKeyMetadata(keyId: string, tenantId: string): Promise<KeyMetadata> {
    try {
      // Prüfe zuerst den Cache
      const cacheKey = `kms:key:${keyId}`;
      const cachedData = await this.redis.get(cacheKey);
      
      if (cachedData) {
        const keyMetadata: KeyMetadata = JSON.parse(cachedData);
        // Aktualisiere lastUsedAt
        keyMetadata.lastUsedAt = new Date();
        await this.redis.setEx(cacheKey, 3600, JSON.stringify(keyMetadata));
        
        // Erstelle HMAC-Signatur für Audit-Log
        const masterKey = this.encryptionService.generateKey();
        const auditData = JSON.stringify({
          eventType: AuditEventType.KEY_ACCESSED,
          tenantId: tenantId,
          action: 'get_key_metadata',
          result: 'success',
          timestamp: new Date().toISOString()
        });
        const hmacSignature = this.encryptionService.createHMAC(auditData, masterKey);
        
        // Erstelle Audit Log
        await this.prisma.auditLog.create({
          data: {
            id: `audit-${crypto.randomUUID()}`,
            timestamp: new Date(),
            eventType: AuditEventType.KEY_ACCESSED,
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
          eventType: AuditEventType.KEY_ACCESSED,
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
            id: `audit-${crypto.randomUUID()}`,
            timestamp: new Date(),
            eventType: AuditEventType.KEY_ACCESSED,
            tenantId: tenantId,
            action: 'get_key_metadata',
            result: 'failure',
            metadata: {
              error: 'Encryption key not found'
            },
            hmacSignature: errorHmacSignature
          }
        });
        
        throw new KeyManagementError(
          'Encryption key not found',
          KeyManagementErrorCode.KEY_NOT_FOUND
        );
      }
      
      // Konvertiere Rotation Schedule
      let rotationSchedule: RotationSchedule | undefined;
      if (keyRecord.rotationSchedule) {
        rotationSchedule = {
          enabled: keyRecord.rotationSchedule.enabled,
          intervalDays: keyRecord.rotationSchedule.intervalDays,
          nextRotationAt: keyRecord.rotationSchedule.nextRotationAt,
          lastRotationAt: keyRecord.rotationSchedule.lastRotationAt || undefined
        };
      }
      
      const keyMetadata: KeyMetadata = {
        id: keyRecord.id,
        tenantId: keyRecord.tenantId,
        purpose: keyRecord.purpose as KeyPurpose,
        algorithm: keyRecord.algorithm,
        version: keyRecord.version,
        status: keyRecord.status as KeyStatus,
        createdAt: keyRecord.createdAt,
        updatedAt: keyRecord.updatedAt,
        expiresAt: keyRecord.expiresAt || undefined,
        lastUsedAt: new Date(),
        rotationSchedule,
        metadata: keyRecord.metadata as Record<string, any> | undefined
      };
      
      // Speichere im Cache
      await this.redis.setEx(cacheKey, 3600, JSON.stringify(keyMetadata));
      
      // Erstelle HMAC-Signatur für Audit-Log
      const masterKey = this.encryptionService.generateKey();
      const auditData = JSON.stringify({
        eventType: AuditEventType.KEY_ACCESSED,
        tenantId: tenantId,
        action: 'get_key_metadata',
        result: 'success',
        timestamp: new Date().toISOString()
      });
      const hmacSignature = this.encryptionService.createHMAC(auditData, masterKey);
      
      // Erstelle Audit Log
      await this.prisma.auditLog.create({
        data: {
          id: `audit-${crypto.randomUUID()}`,
          timestamp: new Date(),
          eventType: AuditEventType.KEY_ACCESSED,
          tenantId: tenantId,
          action: 'get_key_metadata',
          result: 'success',
          hmacSignature
        }
      });
      
      return keyMetadata;
    } catch (error) {
      if (error instanceof KeyManagementError) {
        throw error;
      }
      
      logger.error(`Failed to get key metadata for ${keyId}:`, error);
      
      throw new KeyManagementError(
        `Failed to get key metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KeyManagementErrorCode.MASTER_KEY_ERROR
      );
    }
  }

  /**
   * Markiert einen Schlüssel als kompromittiert
   */
  async compromiseKey(keyId: string, tenantId: string): Promise<void> {
    try {
      // Aktualisiere den Schlüssel-Status
      await this.prisma.encryptionKey.update({
        where: {
          id: keyId,
          tenantId: tenantId
        },
        data: {
          status: KeyStatus.COMPROMISED,
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

      logger.warn(`Key ${keyId} marked as compromised for tenant ${tenantId}`);
    } catch (error) {
      logger.error(`Failed to compromise key ${keyId}:`, error);
      throw new KeyManagementError(
        'Failed to compromise key',
        KeyManagementErrorCode.MASTER_KEY_ERROR
      );
    }
  }

  /**
   * Rotiert einen Schlüssel
   */
  async rotateKey(keyId: string, tenantId: string): Promise<KeyMetadata> {
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
        throw new KeyManagementError(
          'Key not found',
          KeyManagementErrorCode.KEY_NOT_FOUND
        );
      }

      if (currentKey.status !== KeyStatus.ACTIVE) {
        throw new KeyManagementError(
          'Only active keys can be rotated',
          KeyManagementErrorCode.MASTER_KEY_ERROR
        );
      }

      // Erstelle einen neuen Schlüssel
      const newKey = await this.createKey({
        tenantId,
        purpose: currentKey.purpose as KeyPurpose,
        algorithm: currentKey.algorithm as 'aes-256-gcm',
        expiresAt: currentKey.expiresAt ? new Date(currentKey.expiresAt) : undefined,
        autoRotate: currentKey.rotationSchedule?.enabled,
        rotationIntervalDays: currentKey.rotationSchedule?.intervalDays,
        metadata: currentKey.metadata as Record<string, any> | undefined
      });

      // Markiere den alten Schlüssel als deprecated
      await this.prisma.encryptionKey.update({
        where: {
          id: keyId,
          tenantId: tenantId
        },
        data: {
          status: KeyStatus.DEPRECATED,
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

      logger.info(`Key ${keyId} rotated to ${newKey.id} for tenant ${tenantId}`);
      return newKey;
    } catch (error) {
      logger.error(`Failed to rotate key ${keyId}:`, error);
      
      // Erstelle einen Alert für den Fehler
      if (this.alertManager) {
        this.alertManager.handleSecurityEvent('key_rotation_failed', {
          keyId,
          tenantId,
          timestamp: new Date(),
          description: `Failed to rotate key ${keyId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
      if (error instanceof KeyManagementError) {
        throw error;
      }
      
      throw new KeyManagementError(
        `Failed to rotate key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KeyManagementErrorCode.ROTATION_FAILED
      );
    }
  }

  /**
   * Gets the active key for a specific purpose
   */
  async getActiveKeyForPurpose(tenantId: string, purpose: KeyPurpose): Promise<KeyMetadata> {
    try {
      // Check cache first
      const cacheKey = `kms:active_key:${tenantId}:${purpose}`;
      const cachedData = await this.redis.get(cacheKey);
      
      if (cachedData) {
        const keyMetadata: KeyMetadata = JSON.parse(cachedData);
        
        // Create HMAC signature for audit log
        const masterKey = this.encryptionService.generateKey();
        const auditData = JSON.stringify({
          eventType: AuditEventType.KEY_ACCESSED,
          tenantId: tenantId,
          action: 'get_active_key_for_purpose',
          result: 'success',
          timestamp: new Date().toISOString()
        });
        const hmacSignature = this.encryptionService.createHMAC(auditData, masterKey);
        
        // Create audit log
        await this.prisma.keyAuditLog.create({
          data: {
            id: `audit-${crypto.randomUUID()}`,
            keyId: keyMetadata.id,
            timestamp: new Date(),
            eventType: AuditEventType.KEY_ACCESSED,
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
          status: KeyStatus.ACTIVE
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
      let rotationSchedule: RotationSchedule | undefined;
      if (keyRecord.rotationSchedule) {
        rotationSchedule = {
          enabled: keyRecord.rotationSchedule.enabled,
          intervalDays: keyRecord.rotationSchedule.intervalDays,
          nextRotationAt: keyRecord.rotationSchedule.nextRotationAt,
          lastRotationAt: keyRecord.rotationSchedule.lastRotationAt || undefined
        };
      }
      
      const keyMetadata: KeyMetadata = {
        id: keyRecord.id,
        tenantId: keyRecord.tenantId,
        purpose: keyRecord.purpose as KeyPurpose,
        algorithm: keyRecord.algorithm,
        version: keyRecord.version,
        status: keyRecord.status as KeyStatus,
        createdAt: keyRecord.createdAt,
        updatedAt: keyRecord.updatedAt,
        expiresAt: keyRecord.expiresAt || undefined,
        lastUsedAt: new Date(),
        rotationSchedule,
        metadata: keyRecord.metadata as Record<string, any> | undefined
      };
      
      // Store in cache
      await this.redis.setEx(cacheKey, 3600, JSON.stringify(keyMetadata));
      
      // Create HMAC signature for audit log
      const masterKey = this.encryptionService.generateKey();
      const auditData = JSON.stringify({
        eventType: AuditEventType.KEY_ACCESSED,
        tenantId: tenantId,
        action: 'get_active_key_for_purpose',
        result: 'success',
        timestamp: new Date().toISOString()
      });
      const hmacSignature = this.encryptionService.createHMAC(auditData, masterKey);
      
      // Create audit log
      await this.prisma.keyAuditLog.create({
        data: {
          id: `audit-${crypto.randomUUID()}`,
          keyId: keyRecord.id,
          timestamp: new Date(),
          eventType: AuditEventType.KEY_ACCESSED,
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
    } catch (error) {
      logger.error(`Failed to get active key for purpose ${purpose}:`, error);
      
      throw new KeyManagementError(
        `Failed to get active key for purpose: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KeyManagementErrorCode.MASTER_KEY_ERROR
      );
    }
  }

  /**
   * Gets a key by ID and decrypts it
   */
  async getKey(keyId: string, tenantId: string, serviceId?: string): Promise<string> {
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
          eventType: AuditEventType.KEY_ACCESSED,
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
            id: `audit-${crypto.randomUUID()}`,
            keyId: keyId,
            timestamp: new Date(),
            eventType: AuditEventType.KEY_ACCESSED,
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
          eventType: AuditEventType.KEY_ACCESSED,
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
            id: `audit-${crypto.randomUUID()}`,
            keyId: keyId, // Use the provided keyId even though it wasn't found
            timestamp: new Date(),
            eventType: AuditEventType.KEY_ACCESSED,
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
        
        throw new KeyManagementError(
          'Encryption key not found',
          KeyManagementErrorCode.KEY_NOT_FOUND
        );
      }
      
      // Check if key is active
      if (keyRecord.status !== KeyStatus.ACTIVE && keyRecord.status !== KeyStatus.DEPRECATED) {
        // Create HMAC signature for error audit log
        const masterKey = this.encryptionService.generateKey();
        const errorAuditData = JSON.stringify({
          eventType: AuditEventType.KEY_ACCESSED,
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
            id: `audit-${crypto.randomUUID()}`,
            keyId: keyId,
            timestamp: new Date(),
            eventType: AuditEventType.KEY_ACCESSED,
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
        
        throw new KeyManagementError(
          `Key is not active: ${keyRecord.status}`,
          KeyManagementErrorCode.KEY_DISABLED
        );
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
        eventType: AuditEventType.KEY_ACCESSED,
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
          id: `audit-${crypto.randomUUID()}`,
          keyId: keyId,
          timestamp: new Date(),
          eventType: AuditEventType.KEY_ACCESSED,
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
    } catch (error) {
      if (error instanceof KeyManagementError) {
        throw error;
      }
      
      logger.error(`Failed to get key ${keyId}:`, error);
      
      throw new KeyManagementError(
        `Failed to get key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KeyManagementErrorCode.MASTER_KEY_ERROR
      );
    }
  }
}