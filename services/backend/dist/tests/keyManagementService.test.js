"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const KeyManagementService_1 = require("../services/kms/KeyManagementService");
const EncryptionService_1 = require("../services/EncryptionService");
const kms_1 = require("../types/kms");
// Mock dependencies
jest.mock('@prisma/client');
jest.mock('redis');
jest.mock('../services/EncryptionService');
// Mock environment variable
process.env.MASTER_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
describe('KeyManagementService', () => {
    let prisma;
    let redis;
    let encryptionService;
    let keyManagementService;
    beforeEach(() => {
        prisma = new client_1.PrismaClient();
        redis = {};
        encryptionService = new EncryptionService_1.EncryptionService();
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
        };
        prisma.rotationSchedule = {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
            count: jest.fn()
        };
        prisma.keyAuditLog = {
            findMany: jest.fn(),
            create: jest.fn(),
            deleteMany: jest.fn(),
            groupBy: jest.fn()
        };
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
        keyManagementService = new KeyManagementService_1.KeyManagementService(prisma, redis, encryptionService);
    });
    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.MASTER_ENCRYPTION_KEY;
    });
    describe('createKey', () => {
        it('should create a new key successfully', async () => {
            const options = {
                tenantId: 'tenant-1',
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                autoRotate: true,
                rotationIntervalDays: 90
            };
            prisma.encryptionKey.findMany.mockResolvedValue([]);
            prisma.encryptionKey.create.mockResolvedValue({});
            prisma.rotationSchedule.upsert.mockResolvedValue({});
            prisma.keyAuditLog.create.mockResolvedValue({});
            const result = await keyManagementService.createKey(options);
            expect(result.tenantId).toBe('tenant-1');
            expect(result.purpose).toBe(kms_1.KeyPurpose.DATA_ENCRYPTION);
            expect(result.status).toBe(kms_1.KeyStatus.ACTIVE);
            expect(result.version).toBe(1);
            expect(encryptionService.generateKey).toHaveBeenCalled();
            expect(encryptionService.encrypt).toHaveBeenCalled();
        });
        it('should increment version for existing keys', async () => {
            const options = {
                tenantId: 'tenant-1',
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION
            };
            const existingKeys = [
                { version: 1 },
                { version: 2 }
            ];
            prisma.encryptionKey.findMany.mockResolvedValue(existingKeys);
            prisma.encryptionKey.create.mockResolvedValue({});
            prisma.keyAuditLog.create.mockResolvedValue({});
            const result = await keyManagementService.createKey(options);
            expect(result.version).toBe(3);
        });
        it('should schedule auto-rotation if requested', async () => {
            const options = {
                tenantId: 'tenant-1',
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                autoRotate: true,
                rotationIntervalDays: 30
            };
            prisma.encryptionKey.findMany.mockResolvedValue([]);
            prisma.encryptionKey.create.mockResolvedValue({});
            prisma.rotationSchedule.upsert.mockResolvedValue({});
            prisma.keyAuditLog.create.mockResolvedValue({});
            await keyManagementService.createKey(options);
            expect(prisma.rotationSchedule.upsert).toHaveBeenCalledWith(expect.objectContaining({
                create: expect.objectContaining({
                    enabled: true,
                    intervalDays: 30
                })
            }));
        });
    });
    describe('getKey', () => {
        it('should return cached key if available', async () => {
            const keyId = 'key-123';
            const tenantId = 'tenant-1';
            const cachedKey = 'cached-key-data';
            redis.get.mockResolvedValue(cachedKey);
            prisma.encryptionKey.updateMany.mockResolvedValue({});
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
                status: kms_1.KeyStatus.ACTIVE,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            redis.get.mockResolvedValue(null);
            prisma.encryptionKey.findFirst.mockResolvedValue(encryptedKeyData);
            redis.set.mockResolvedValue('OK');
            prisma.encryptionKey.updateMany.mockResolvedValue({});
            prisma.keyAuditLog.create.mockResolvedValue({});
            const result = await keyManagementService.getKey(keyId, tenantId);
            expect(result).toBe('decrypted-key');
            expect(encryptionService.decrypt).toHaveBeenCalled();
            expect(redis.set).toHaveBeenCalled();
        });
        it('should throw error if key not found', async () => {
            const keyId = 'nonexistent';
            const tenantId = 'tenant-1';
            redis.get.mockResolvedValue(null);
            prisma.encryptionKey.findFirst.mockResolvedValue(null);
            prisma.keyAuditLog.create.mockResolvedValue({});
            await expect(keyManagementService.getKey(keyId, tenantId)).rejects.toThrow(kms_1.KeyManagementError);
        });
        it('should throw error if key is disabled', async () => {
            const keyId = 'key-123';
            const tenantId = 'tenant-1';
            const encryptedKeyData = {
                id: keyId,
                tenantId,
                status: kms_1.KeyStatus.DISABLED,
                encryptedKey: 'encrypted',
                iv: 'iv',
                authTag: 'tag',
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            redis.get.mockResolvedValue(null);
            prisma.encryptionKey.findFirst.mockResolvedValue(encryptedKeyData);
            await expect(keyManagementService.getKey(keyId, tenantId)).rejects.toThrow('Key is disabled');
        });
        it('should throw error if key is compromised', async () => {
            const keyId = 'key-123';
            const tenantId = 'tenant-1';
            const encryptedKeyData = {
                id: keyId,
                tenantId,
                status: kms_1.KeyStatus.COMPROMISED,
                encryptedKey: 'encrypted',
                iv: 'iv',
                authTag: 'tag',
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            redis.get.mockResolvedValue(null);
            prisma.encryptionKey.findFirst.mockResolvedValue(encryptedKeyData);
            prisma.keyAuditLog.create.mockResolvedValue({});
            await expect(keyManagementService.getKey(keyId, tenantId)).rejects.toThrow('Key is compromised');
        });
        it('should throw error if key is expired', async () => {
            const keyId = 'key-123';
            const tenantId = 'tenant-1';
            const encryptedKeyData = {
                id: keyId,
                tenantId,
                status: kms_1.KeyStatus.ACTIVE,
                expiresAt: new Date(Date.now() - 1000), // Expired
                encryptedKey: 'encrypted',
                iv: 'iv',
                authTag: 'tag',
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            redis.get.mockResolvedValue(null);
            prisma.encryptionKey.findFirst.mockResolvedValue(encryptedKeyData);
            await expect(keyManagementService.getKey(keyId, tenantId)).rejects.toThrow('Key has expired');
        });
    });
    describe('rotateKey', () => {
        it('should rotate a key successfully', async () => {
            const keyId = 'key-123';
            const tenantId = 'tenant-1';
            const oldKeyData = {
                id: keyId,
                tenantId,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                status: kms_1.KeyStatus.ACTIVE,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // Mock getKeyMetadata
            prisma.encryptionKey.findFirst.mockResolvedValue(oldKeyData);
            // Mock rotation
            prisma.encryptionKey.update.mockResolvedValue({});
            // Mock new key creation
            prisma.encryptionKey.findMany.mockResolvedValue([oldKeyData]);
            prisma.encryptionKey.create.mockResolvedValue({});
            // Mock cache invalidation
            redis.del.mockResolvedValue(1);
            // Mock audit logging
            prisma.keyAuditLog.create.mockResolvedValue({});
            const result = await keyManagementService.rotateKey(keyId, tenantId);
            expect(result.tenantId).toBe(tenantId);
            expect(result.purpose).toBe(kms_1.KeyPurpose.DATA_ENCRYPTION);
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
                status: kms_1.KeyStatus.DISABLED,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prisma.encryptionKey.findFirst.mockResolvedValue(keyData);
            prisma.encryptionKey.updateMany.mockResolvedValue({});
            prisma.keyAuditLog.create.mockResolvedValue({});
            await keyManagementService.activateKey(keyId, tenantId);
            expect(prisma.encryptionKey.updateMany).toHaveBeenCalledWith({
                where: { id: keyId, tenantId },
                data: {
                    status: kms_1.KeyStatus.ACTIVE,
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
                status: kms_1.KeyStatus.ACTIVE,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prisma.encryptionKey.findFirst.mockResolvedValue(keyData);
            prisma.encryptionKey.updateMany.mockResolvedValue({});
            redis.del.mockResolvedValue(1);
            prisma.keyAuditLog.create.mockResolvedValue({});
            await keyManagementService.deactivateKey(keyId, tenantId);
            expect(prisma.encryptionKey.updateMany).toHaveBeenCalledWith({
                where: { id: keyId, tenantId },
                data: {
                    status: kms_1.KeyStatus.DISABLED,
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
                status: kms_1.KeyStatus.ACTIVE,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prisma.encryptionKey.findFirst.mockResolvedValue(keyData);
            prisma.encryptionKey.updateMany.mockResolvedValue({});
            redis.del.mockResolvedValue(1);
            prisma.keyAuditLog.create.mockResolvedValue({});
            await keyManagementService.markKeyCompromised(keyId, tenantId, reason);
            expect(prisma.encryptionKey.updateMany).toHaveBeenCalledWith({
                where: { id: keyId, tenantId },
                data: {
                    status: kms_1.KeyStatus.COMPROMISED,
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
                status: kms_1.KeyStatus.DISABLED,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prisma.encryptionKey.findFirst.mockResolvedValue(keyData);
            prisma.encryptionKey.deleteMany.mockResolvedValue({});
            redis.del.mockResolvedValue(1);
            prisma.keyAuditLog.create.mockResolvedValue({});
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
                status: kms_1.KeyStatus.ACTIVE,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prisma.encryptionKey.findFirst.mockResolvedValue(keyData);
            await expect(keyManagementService.deleteKey(keyId, tenantId, false)).rejects.toThrow('Cannot delete active key without force flag');
        });
        it('should delete active key with force flag', async () => {
            const keyId = 'key-123';
            const tenantId = 'tenant-1';
            const keyData = {
                id: keyId,
                tenantId,
                status: kms_1.KeyStatus.ACTIVE,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prisma.encryptionKey.findFirst.mockResolvedValue(keyData);
            prisma.encryptionKey.deleteMany.mockResolvedValue({});
            redis.del.mockResolvedValue(1);
            prisma.keyAuditLog.create.mockResolvedValue({});
            await keyManagementService.deleteKey(keyId, tenantId, true);
            expect(prisma.encryptionKey.deleteMany).toHaveBeenCalled();
        });
    });
    describe('getHealthStatus', () => {
        it('should return healthy status when all checks pass', async () => {
            prisma.$queryRaw.mockResolvedValue([]);
            redis.ping.mockResolvedValue('PONG');
            prisma.rotationSchedule.count.mockResolvedValue(0); // No overdue rotations
            const health = await keyManagementService.getHealthStatus();
            expect(health.status).toBe('healthy');
            expect(health.checks.masterKey.status).toBe('pass');
            expect(health.checks.database.status).toBe('pass');
            expect(health.checks.cache.status).toBe('pass');
            expect(health.checks.rotation.status).toBe('pass');
        });
        it('should return degraded status with one failed check', async () => {
            prisma.$queryRaw.mockResolvedValue([]);
            redis.ping.mockRejectedValue(new Error('Redis connection failed'));
            prisma.rotationSchedule.count.mockResolvedValue(0);
            const health = await keyManagementService.getHealthStatus();
            expect(health.status).toBe('degraded');
            expect(health.checks.cache.status).toBe('fail');
        });
        it('should return unhealthy status with multiple failed checks', async () => {
            prisma.$queryRaw.mockRejectedValue(new Error('DB connection failed'));
            redis.ping.mockRejectedValue(new Error('Redis connection failed'));
            prisma.rotationSchedule.count.mockResolvedValue(0);
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
                status: kms_1.KeyStatus.ACTIVE,
                encryptedKey: 'encrypted',
                iv: 'iv',
                authTag: 'tag',
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            redis.get.mockResolvedValue(null);
            prisma.encryptionKey.findFirst.mockResolvedValue(encryptedKeyData);
            redis.set.mockResolvedValue('OK');
            prisma.encryptionKey.updateMany.mockResolvedValue({});
            prisma.keyAuditLog.create.mockResolvedValue({});
            const isValid = await keyManagementService.validateKeyIntegrity(keyId, tenantId);
            expect(isValid).toBe(true);
        });
        it('should return false for invalid key', async () => {
            const keyId = 'key-123';
            const tenantId = 'tenant-1';
            redis.get.mockResolvedValue(null);
            prisma.encryptionKey.findFirst.mockResolvedValue(null);
            const isValid = await keyManagementService.validateKeyIntegrity(keyId, tenantId);
            expect(isValid).toBe(false);
        });
    });
});
