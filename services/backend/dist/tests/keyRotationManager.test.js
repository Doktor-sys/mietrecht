"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const KeyRotationManager_1 = require("../services/kms/KeyRotationManager");
const KeyStorage_1 = require("../services/kms/KeyStorage");
const kms_1 = require("../types/kms");
// Mock Prisma Client
jest.mock('@prisma/client');
describe('KeyRotationManager', () => {
    let prisma;
    let rotationManager;
    let keyStorage;
    beforeEach(() => {
        prisma = new client_1.PrismaClient();
        rotationManager = new KeyRotationManager_1.KeyRotationManager(prisma);
        keyStorage = new KeyStorage_1.KeyStorage(prisma);
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
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('rotateKey', () => {
        it('should rotate an active key successfully', async () => {
            const mockKey = {
                id: 'key-123',
                tenantId: 'tenant-1',
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                version: 1,
                status: kms_1.KeyStatus.ACTIVE,
                encryptedKey: 'encrypted',
                iv: 'iv',
                authTag: 'tag',
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: null,
                lastUsedAt: null,
                metadata: {}
            };
            prisma.encryptionKey.findFirst.mockResolvedValue(mockKey);
            prisma.encryptionKey.update.mockResolvedValue({
                ...mockKey,
                status: kms_1.KeyStatus.DEPRECATED
            });
            const result = await rotationManager.rotateKey('key-123', 'tenant-1');
            expect(result.status).toBe(kms_1.KeyStatus.DEPRECATED);
            expect(prisma.encryptionKey.update).toHaveBeenCalledWith({
                where: { id: 'key-123' },
                data: {
                    status: kms_1.KeyStatus.DEPRECATED,
                    updatedAt: expect.any(Date)
                }
            });
        });
        it('should throw error if key not found', async () => {
            prisma.encryptionKey.findFirst.mockResolvedValue(null);
            await expect(rotationManager.rotateKey('nonexistent', 'tenant-1')).rejects.toThrow('Key not found for rotation');
        });
        it('should throw error if key is not active', async () => {
            const mockKey = {
                id: 'key-123',
                tenantId: 'tenant-1',
                status: kms_1.KeyStatus.DEPRECATED,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                version: 1,
                encryptedKey: 'encrypted',
                iv: 'iv',
                authTag: 'tag',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prisma.encryptionKey.findFirst.mockResolvedValue(mockKey);
            await expect(rotationManager.rotateKey('key-123', 'tenant-1')).rejects.toThrow('Cannot rotate key with status deprecated');
        });
    });
    describe('scheduleRotation', () => {
        it('should schedule rotation for a key', async () => {
            const mockKey = {
                id: 'key-123',
                tenantId: 'tenant-1'
            };
            prisma.encryptionKey.findUnique.mockResolvedValue(mockKey);
            prisma.rotationSchedule.upsert.mockResolvedValue({});
            const schedule = {
                enabled: true,
                intervalDays: 90,
                nextRotationAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
            };
            await rotationManager.scheduleRotation('key-123', schedule);
            expect(prisma.rotationSchedule.upsert).toHaveBeenCalledWith({
                where: { keyId: 'key-123' },
                create: expect.objectContaining({
                    keyId: 'key-123',
                    enabled: true,
                    intervalDays: 90
                }),
                update: expect.objectContaining({
                    enabled: true,
                    intervalDays: 90
                })
            });
        });
        it('should throw error if key does not exist', async () => {
            prisma.encryptionKey.findUnique.mockResolvedValue(null);
            const schedule = {
                enabled: true,
                intervalDays: 90,
                nextRotationAt: new Date()
            };
            await expect(rotationManager.scheduleRotation('nonexistent', schedule)).rejects.toThrow('Key not found for scheduling rotation');
        });
    });
    describe('checkAndRotateExpiredKeys', () => {
        it('should rotate keys with due schedules', async () => {
            const mockSchedules = [
                {
                    id: 'schedule-1',
                    keyId: 'key-1',
                    enabled: true,
                    intervalDays: 90,
                    nextRotationAt: new Date(Date.now() - 1000),
                    key: {
                        id: 'key-1',
                        tenantId: 'tenant-1',
                        status: kms_1.KeyStatus.ACTIVE,
                        purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                        algorithm: 'aes-256-gcm',
                        version: 1,
                        encryptedKey: 'encrypted',
                        iv: 'iv',
                        authTag: 'tag',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                }
            ];
            prisma.rotationSchedule.findMany.mockResolvedValue(mockSchedules);
            prisma.encryptionKey.findFirst.mockResolvedValue(mockSchedules[0].key);
            prisma.encryptionKey.update.mockResolvedValue({});
            prisma.rotationSchedule.update.mockResolvedValue({});
            prisma.encryptionKey.findMany.mockResolvedValue([]);
            const report = await rotationManager.checkAndRotateExpiredKeys();
            expect(report.rotatedKeys).toContain('key-1');
            expect(report.failedKeys).toHaveLength(0);
            expect(report.totalProcessed).toBe(1);
        });
        it('should handle rotation failures gracefully', async () => {
            const mockSchedules = [
                {
                    id: 'schedule-1',
                    keyId: 'key-1',
                    enabled: true,
                    intervalDays: 90,
                    nextRotationAt: new Date(Date.now() - 1000),
                    key: {
                        id: 'key-1',
                        tenantId: 'tenant-1',
                        status: kms_1.KeyStatus.ACTIVE
                    }
                }
            ];
            prisma.rotationSchedule.findMany.mockResolvedValue(mockSchedules);
            prisma.encryptionKey.findFirst.mockRejectedValue(new Error('Database error'));
            prisma.encryptionKey.findMany.mockResolvedValue([]);
            const report = await rotationManager.checkAndRotateExpiredKeys();
            expect(report.failedKeys).toContain('key-1');
            expect(report.rotatedKeys).toHaveLength(0);
        });
    });
    describe('reEncryptData', () => {
        it('should call encryption callback for each data reference', async () => {
            const dataRefs = [
                {
                    table: 'documents',
                    column: 'encrypted_content',
                    idColumn: 'id',
                    ids: ['doc-1', 'doc-2']
                },
                {
                    table: 'users',
                    column: 'encrypted_email',
                    idColumn: 'id',
                    ids: ['user-1']
                }
            ];
            const mockCallback = jest.fn().mockResolvedValue(undefined);
            await rotationManager.reEncryptData('old-key', 'new-key', dataRefs, mockCallback);
            expect(mockCallback).toHaveBeenCalledTimes(2);
            expect(mockCallback).toHaveBeenCalledWith('old-key', 'new-key', 'documents', 'encrypted_content', ['doc-1', 'doc-2']);
            expect(mockCallback).toHaveBeenCalledWith('old-key', 'new-key', 'users', 'encrypted_email', ['user-1']);
        });
        it('should handle partial failures in re-encryption', async () => {
            const dataRefs = [
                {
                    table: 'documents',
                    column: 'encrypted_content',
                    idColumn: 'id',
                    ids: ['doc-1']
                },
                {
                    table: 'users',
                    column: 'encrypted_email',
                    idColumn: 'id',
                    ids: ['user-1']
                }
            ];
            const mockCallback = jest.fn()
                .mockResolvedValueOnce(undefined) // First call succeeds
                .mockRejectedValueOnce(new Error('Re-encryption failed')); // Second call fails
            await expect(rotationManager.reEncryptData('old-key', 'new-key', dataRefs, mockCallback)).rejects.toThrow('Re-encryption partially failed');
        });
        it('should skip re-encryption if no callback provided', async () => {
            const dataRefs = [
                {
                    table: 'documents',
                    column: 'encrypted_content',
                    idColumn: 'id',
                    ids: ['doc-1']
                }
            ];
            // Should not throw
            await rotationManager.reEncryptData('old-key', 'new-key', dataRefs);
        });
    });
    describe('getRotationSchedule', () => {
        it('should return rotation schedule for a key', async () => {
            const mockSchedule = {
                keyId: 'key-123',
                enabled: true,
                intervalDays: 90,
                nextRotationAt: new Date(),
                lastRotationAt: new Date()
            };
            prisma.rotationSchedule.findUnique.mockResolvedValue(mockSchedule);
            const result = await rotationManager.getRotationSchedule('key-123');
            expect(result).toEqual({
                enabled: true,
                intervalDays: 90,
                nextRotationAt: mockSchedule.nextRotationAt,
                lastRotationAt: mockSchedule.lastRotationAt
            });
        });
        it('should return null if no schedule exists', async () => {
            prisma.rotationSchedule.findUnique.mockResolvedValue(null);
            const result = await rotationManager.getRotationSchedule('key-123');
            expect(result).toBeNull();
        });
    });
    describe('disableAutoRotation', () => {
        it('should disable auto-rotation for a key', async () => {
            prisma.rotationSchedule.update.mockResolvedValue({});
            await rotationManager.disableAutoRotation('key-123');
            expect(prisma.rotationSchedule.update).toHaveBeenCalledWith({
                where: { keyId: 'key-123' },
                data: {
                    enabled: false,
                    updatedAt: expect.any(Date)
                }
            });
        });
    });
    describe('enableAutoRotation', () => {
        it('should enable auto-rotation for a key', async () => {
            const mockSchedule = {
                keyId: 'key-123',
                enabled: false,
                intervalDays: 90
            };
            prisma.rotationSchedule.findUnique.mockResolvedValue(mockSchedule);
            prisma.rotationSchedule.update.mockResolvedValue({});
            await rotationManager.enableAutoRotation('key-123');
            expect(prisma.rotationSchedule.update).toHaveBeenCalledWith({
                where: { keyId: 'key-123' },
                data: {
                    enabled: true,
                    updatedAt: expect.any(Date)
                }
            });
        });
        it('should throw error if no schedule exists', async () => {
            prisma.rotationSchedule.findUnique.mockResolvedValue(null);
            await expect(rotationManager.enableAutoRotation('key-123')).rejects.toThrow('No rotation schedule found for key');
        });
    });
    describe('getRotationStats', () => {
        it('should return rotation statistics', async () => {
            prisma.rotationSchedule.count
                .mockResolvedValueOnce(10) // totalScheduled
                .mockResolvedValueOnce(8) // activeSchedules
                .mockResolvedValueOnce(3) // upcomingRotations
                .mockResolvedValueOnce(2); // overdueRotations
            const stats = await rotationManager.getRotationStats();
            expect(stats).toEqual({
                totalScheduled: 10,
                activeSchedules: 8,
                upcomingRotations: 3,
                overdueRotations: 2
            });
        });
        it('should filter by tenant if provided', async () => {
            prisma.rotationSchedule.count.mockResolvedValue(5);
            await rotationManager.getRotationStats('tenant-1');
            expect(prisma.rotationSchedule.count).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    key: { tenantId: 'tenant-1' }
                })
            }));
        });
    });
    describe('listAutoRotationKeys', () => {
        it('should list all keys with auto-rotation enabled', async () => {
            const mockSchedules = [
                {
                    keyId: 'key-1',
                    intervalDays: 90,
                    nextRotationAt: new Date(),
                    key: {
                        tenantId: 'tenant-1'
                    }
                },
                {
                    keyId: 'key-2',
                    intervalDays: 60,
                    nextRotationAt: new Date(),
                    key: {
                        tenantId: 'tenant-2'
                    }
                }
            ];
            prisma.rotationSchedule.findMany.mockResolvedValue(mockSchedules);
            const result = await rotationManager.listAutoRotationKeys();
            expect(result).toHaveLength(2);
            expect(result[0].keyId).toBe('key-1');
            expect(result[1].keyId).toBe('key-2');
        });
        it('should filter by tenant if provided', async () => {
            prisma.rotationSchedule.findMany.mockResolvedValue([]);
            await rotationManager.listAutoRotationKeys('tenant-1');
            expect(prisma.rotationSchedule.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    enabled: true,
                    key: { tenantId: 'tenant-1' }
                })
            }));
        });
    });
});
