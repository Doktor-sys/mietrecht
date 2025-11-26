import { PrismaClient } from '@prisma/client';
import { RedisClientType } from 'redis';
import { KeyManagementService } from '../services/kms/KeyManagementService';
import { EncryptionService } from '../services/EncryptionService';
import { KeyPurpose, KeyStatus, KeyManagementError } from '../types/kms';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('redis');
jest.mock('../services/EncryptionService');

// Mock environment variable
process.env.MASTER_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('KeyManagementService', () => {
  let prisma: jest.Mocked<PrismaClient>;
  let redis: jest.Mocked<RedisClientType>;
  let encryptionService: jest.Mocked<EncryptionService>;
  let keyManagementService: KeyManagementService;

  beforeEach(() => {
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    redis = {} as jest.Mocked<RedisClientType>;
    encryptionService = new EncryptionService() as jest.Mocked<EncryptionService>;

    // Mock Prisma methods
    prisma.encryptionKey = {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn()
    } as any;

    prisma.rotationSchedule = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    } as any;

    prisma.keyAuditLog = {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      groupBy: jest.fn()
    } as any;

    prisma.$queryRaw = jest.fn();

    // Mock Redis methods
    redis.get = jest.fn();
    redis.set = jest.fn();
    redis.del = jest.fn();
    redis.ping = jest.fn();

    // Mock EncryptionService methods
    encryptionService.generateKey = jest.fn().mockReturnValue('generated-key');
    encryptionService.encrypt = jest.fn().mockReturnValue({
      encryptedData: 'encrypted',
      iv: 'iv',
      authTag: 'tag'
    });
    encryptionService.decrypt = jest.fn().mockReturnValue('decrypted-key');
    encryptionService.createHash = jest.fn().mockReturnValue('hash');

    // Mock environment variable for master key
    process.env.MASTER_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    keyManagementService = new KeyManagementService(prisma, redis, encryptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.MASTER_ENCRYPTION_KEY;
  });

  describe('createKey', () => {
    it('should create a new key successfully', async () => {
      const options = {
        tenantId: 'tenant-1',
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm' as const,
        autoRotate: true,
        rotationIntervalDays: 90
      };

      (prisma.encryptionKey.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.encryptionKey.create as jest.Mock).mockResolvedValue({});
      (prisma.rotationSchedule.upsert as jest.Mock).mockResolvedValue({});
      (prisma.keyAuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await keyManagementService.createKey(options);

      expect(result.tenantId).toBe('tenant-1');
      expect(result.purpose).toBe(KeyPurpose.DATA_ENCRYPTION);
      expect(result.status).toBe(KeyStatus.ACTIVE);
      expect(result.version).toBe(1);
      expect(encryptionService.generateKey).toHaveBeenCalled();
      expect(encryptionService.encrypt).toHaveBeenCalled();
    });

    it('should increment version for existing keys', async () => {
      const options = {
        tenantId: 'tenant-1',
        purpose: KeyPurpose.DATA_ENCRYPTION
      };

      const existingKeys = [
        { version: 1 },
        { version: 2 }
      ];

      (prisma.encryptionKey.findMany as jest.Mock).mockResolvedValue(existingKeys);
      (prisma.encryptionKey.create as jest.Mock).mockResolvedValue({});
      (prisma.keyAuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await keyManagementService.createKey(options);

      expect(result.version).toBe(3);
    });

    it('should schedule auto-rotation if requested', async () => {
      const options = {
        tenantId: 'tenant-1',
        purpose: KeyPurpose.DATA_ENCRYPTION,
        autoRotate: true,
        rotationIntervalDays: 30
      };

      (prisma.encryptionKey.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.encryptionKey.create as jest.Mock).mockResolvedValue({});
      (prisma.rotationSchedule.upsert as jest.Mock).mockResolvedValue({});
      (prisma.keyAuditLog.create as jest.Mock).mockResolvedValue({});

      await keyManagementService.createKey(options);

      expect(prisma.rotationSchedule.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            enabled: true,
            intervalDays: 30
          })
        })
      );
    });
  });

  describe('getKey', () => {
    it('should return cached key if available', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';
      const cachedKey = 'cached-key-data';

      (redis.get as jest.Mock).mockResolvedValue(cachedKey);
      (prisma.encryptionKey.updateMany as jest.Mock).mockResolvedValue({});

      const result = await keyManagementService.getKey(keyId, tenantId);

      expect(result).toBe(cachedKey);
      expect(redis.get).toHaveBeenCalledWith(`kms:key:${keyId}`);
    });

    it('should decrypt and cache key if not in cache', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';
      const encryptedKeyData = {
        id: keyId,
        tenantId,
        encryptedKey: 'encrypted',
        iv: 'iv',
        authTag: 'tag',
        status: KeyStatus.ACTIVE,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(encryptedKeyData);
      (redis.set as jest.Mock).mockResolvedValue('OK');
      (prisma.encryptionKey.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.keyAuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await keyManagementService.getKey(keyId, tenantId);

      expect(result).toBe('decrypted-key');
      expect(encryptionService.decrypt).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
    });

    it('should throw error if key not found', async () => {
      const keyId = 'nonexistent';
      const tenantId = 'tenant-1';

      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.keyAuditLog.create as jest.Mock).mockResolvedValue({});

      await expect(
        keyManagementService.getKey(keyId, tenantId)
      ).rejects.toThrow(KeyManagementError);
    });

    it('should throw error if key is disabled', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';
      const encryptedKeyData = {
        id: keyId,
        tenantId,
        status: KeyStatus.DISABLED,
        encryptedKey: 'encrypted',
        iv: 'iv',
        authTag: 'tag',
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(encryptedKeyData);

      await expect(
        keyManagementService.getKey(keyId, tenantId)
      ).rejects.toThrow('Key is disabled');
    });

    it('should throw error if key is compromised', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';
      const encryptedKeyData = {
        id: keyId,
        tenantId,
        status: KeyStatus.COMPROMISED,
        encryptedKey: 'encrypted',
        iv: 'iv',
        authTag: 'tag',
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(encryptedKeyData);
      (prisma.keyAuditLog.create as jest.Mock).mockResolvedValue({});

      await expect(
        keyManagementService.getKey(keyId, tenantId)
      ).rejects.toThrow('Key is compromised');
    });

    it('should throw error if key is expired', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';
      const encryptedKeyData = {
        id: keyId,
        tenantId,
        status: KeyStatus.ACTIVE,
        expiresAt: new Date(Date.now() - 1000), // Expired
        encryptedKey: 'encrypted',
        iv: 'iv',
        authTag: 'tag',
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(encryptedKeyData);

      await expect(
        keyManagementService.getKey(keyId, tenantId)
      ).rejects.toThrow('Key has expired');
    });
  });

  describe('rotateKey', () => {
    it('should rotate a key successfully', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';
      const oldKeyData = {
        id: keyId,
        tenantId,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        status: KeyStatus.ACTIVE,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock getKeyMetadata
      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(oldKeyData);
      
      // Mock rotation
      (prisma.encryptionKey.update as jest.Mock).mockResolvedValue({});
      
      // Mock new key creation
      (prisma.encryptionKey.findMany as jest.Mock).mockResolvedValue([oldKeyData]);
      (prisma.encryptionKey.create as jest.Mock).mockResolvedValue({});
      
      // Mock cache invalidation
      (redis.del as jest.Mock).mockResolvedValue(1);
      
      // Mock audit logging
      (prisma.keyAuditLog.create as jest.Mock).mockResolvedValue({});

      const result = await keyManagementService.rotateKey(keyId, tenantId);

      expect(result.tenantId).toBe(tenantId);
      expect(result.purpose).toBe(KeyPurpose.DATA_ENCRYPTION);
      expect(result.version).toBe(2); // Incremented
      expect(prisma.encryptionKey.update).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });
  });

  describe('activateKey', () => {
    it('should activate a key successfully', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';
      const keyData = {
        id: keyId,
        tenantId,
        status: KeyStatus.DISABLED,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(keyData);
      (prisma.encryptionKey.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.keyAuditLog.create as jest.Mock).mockResolvedValue({});

      await keyManagementService.activateKey(keyId, tenantId);

      expect(prisma.encryptionKey.updateMany).toHaveBeenCalledWith({
        where: { id: keyId, tenantId },
        data: {
          status: KeyStatus.ACTIVE,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('deactivateKey', () => {
    it('should deactivate a key successfully', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';
      const keyData = {
        id: keyId,
        tenantId,
        status: KeyStatus.ACTIVE,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(keyData);
      (prisma.encryptionKey.updateMany as jest.Mock).mockResolvedValue({});
      (redis.del as jest.Mock).mockResolvedValue(1);
      (prisma.keyAuditLog.create as jest.Mock).mockResolvedValue({});

      await keyManagementService.deactivateKey(keyId, tenantId);

      expect(prisma.encryptionKey.updateMany).toHaveBeenCalledWith({
        where: { id: keyId, tenantId },
        data: {
          status: KeyStatus.DISABLED,
          updatedAt: expect.any(Date)
        }
      });
      expect(redis.del).toHaveBeenCalled();
    });
  });

  describe('markKeyCompromised', () => {
    it('should mark a key as compromised', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';
      const reason = 'Security breach detected';
      const keyData = {
        id: keyId,
        tenantId,
        status: KeyStatus.ACTIVE,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(keyData);
      (prisma.encryptionKey.updateMany as jest.Mock).mockResolvedValue({});
      (redis.del as jest.Mock).mockResolvedValue(1);
      (prisma.keyAuditLog.create as jest.Mock).mockResolvedValue({});

      await keyManagementService.markKeyCompromised(keyId, tenantId, reason);

      expect(prisma.encryptionKey.updateMany).toHaveBeenCalledWith({
        where: { id: keyId, tenantId },
        data: {
          status: KeyStatus.COMPROMISED,
          updatedAt: expect.any(Date)
        }
      });
      expect(prisma.keyAuditLog.create).toHaveBeenCalledTimes(2); // Status change + security event
    });
  });

  describe('deleteKey', () => {
    it('should delete an inactive key', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';
      const keyData = {
        id: keyId,
        tenantId,
        status: KeyStatus.DISABLED,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(keyData);
      (prisma.encryptionKey.deleteMany as jest.Mock).mockResolvedValue({});
      (redis.del as jest.Mock).mockResolvedValue(1);
      (prisma.keyAuditLog.create as jest.Mock).mockResolvedValue({});

      await keyManagementService.deleteKey(keyId, tenantId);

      expect(prisma.encryptionKey.deleteMany).toHaveBeenCalledWith({
        where: { id: keyId, tenantId }
      });
    });

    it('should refuse to delete active key without force', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';
      const keyData = {
        id: keyId,
        tenantId,
        status: KeyStatus.ACTIVE,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(keyData);

      await expect(
        keyManagementService.deleteKey(keyId, tenantId, false)
      ).rejects.toThrow('Cannot delete active key without force flag');
    });

    it('should delete active key with force flag', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';
      const keyData = {
        id: keyId,
        tenantId,
        status: KeyStatus.ACTIVE,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(keyData);
      (prisma.encryptionKey.deleteMany as jest.Mock).mockResolvedValue({});
      (redis.del as jest.Mock).mockResolvedValue(1);
      (prisma.keyAuditLog.create as jest.Mock).mockResolvedValue({});

      await keyManagementService.deleteKey(keyId, tenantId, true);

      expect(prisma.encryptionKey.deleteMany).toHaveBeenCalled();
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when all checks pass', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (redis.ping as jest.Mock).mockResolvedValue('PONG');
      (prisma.rotationSchedule.count as jest.Mock).mockResolvedValue(0); // No overdue rotations

      const health = await keyManagementService.getHealthStatus();

      expect(health.status).toBe('healthy');
      expect(health.checks.masterKey.status).toBe('pass');
      expect(health.checks.database.status).toBe('pass');
      expect(health.checks.cache.status).toBe('pass');
      expect(health.checks.rotation.status).toBe('pass');
    });

    it('should return degraded status with one failed check', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (redis.ping as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));
      (prisma.rotationSchedule.count as jest.Mock).mockResolvedValue(0);

      const health = await keyManagementService.getHealthStatus();

      expect(health.status).toBe('degraded');
      expect(health.checks.cache.status).toBe('fail');
    });

    it('should return unhealthy status with multiple failed checks', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB connection failed'));
      (redis.ping as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));
      (prisma.rotationSchedule.count as jest.Mock).mockResolvedValue(0);

      const health = await keyManagementService.getHealthStatus();

      expect(health.status).toBe('unhealthy');
      expect(health.checks.database.status).toBe('fail');
      expect(health.checks.cache.status).toBe('fail');
    });
  });

  describe('validateKeyIntegrity', () => {
    it('should return true for valid key', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';
      const encryptedKeyData = {
        id: keyId,
        tenantId,
        status: KeyStatus.ACTIVE,
        encryptedKey: 'encrypted',
        iv: 'iv',
        authTag: 'tag',
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(encryptedKeyData);
      (redis.set as jest.Mock).mockResolvedValue('OK');
      (prisma.encryptionKey.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.keyAuditLog.create as jest.Mock).mockResolvedValue({});

      const isValid = await keyManagementService.validateKeyIntegrity(keyId, tenantId);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid key', async () => {
      const keyId = 'key-123';
      const tenantId = 'tenant-1';

      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.encryptionKey.findFirst as jest.Mock).mockResolvedValue(null);

      const isValid = await keyManagementService.validateKeyIntegrity(keyId, tenantId);

      expect(isValid).toBe(false);
    });
  });
});