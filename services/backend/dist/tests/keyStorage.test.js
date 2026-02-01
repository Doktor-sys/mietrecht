"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const KeyStorage_1 = require("../services/kms/KeyStorage");
const kms_1 = require("../types/kms");
const uuid = __importStar(require("uuid"));
const node_test_1 = require("node:test");
const node_test_2 = require("node:test");
const node_test_3 = require("node:test");
(0, node_test_2.describe)('KeyStorage', () => {
    let prisma;
    let keyStorage;
    const testTenantId = 'test-tenant-' + Date.now();
    const testKeyIds = [];
    beforeAll(() => {
        prisma = new client_1.PrismaClient();
        keyStorage = new KeyStorage_1.KeyStorage(prisma);
    });
    afterAll(async () => {
        // Cleanup test keys
        await prisma.encryptionKey.deleteMany({
            where: { tenantId: testTenantId }
        });
        await prisma.$disconnect();
    });
    (0, node_test_3.afterEach)(async () => {
        // Cleanup keys created in tests
        if (testKeyIds.length > 0) {
            await prisma.encryptionKey.deleteMany({
                where: { id: { in: testKeyIds } }
            });
            testKeyIds.length = 0;
        }
    });
    (0, node_test_2.describe)('saveKey()', () => {
        (0, node_test_1.it)('sollte einen verschlüsselten Schlüssel speichern', async () => {
            const keyData = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'encrypted_key_data',
                iv: 'initialization_vector',
                authTag: 'auth_tag',
                version: 1,
                status: kms_1.KeyStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            testKeyIds.push(keyData.id);
            await keyStorage.saveKey(keyData);
            // Verify key was saved
            const savedKey = await prisma.encryptionKey.findUnique({
                where: { id: keyData.id }
            });
            expect(savedKey).toBeDefined();
            expect(savedKey?.tenantId).toBe(testTenantId);
            expect(savedKey?.purpose).toBe(kms_1.KeyPurpose.DATA_ENCRYPTION);
        });
        (0, node_test_1.it)('sollte Metadaten mit dem Schlüssel speichern', async () => {
            const keyData = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.DOCUMENT_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'encrypted_key_data',
                iv: 'initialization_vector',
                authTag: 'auth_tag',
                version: 1,
                status: kms_1.KeyStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata: {
                    description: 'Test key',
                    owner: 'test-user'
                }
            };
            testKeyIds.push(keyData.id);
            await keyStorage.saveKey(keyData);
            const savedKey = await prisma.encryptionKey.findUnique({
                where: { id: keyData.id }
            });
            expect(savedKey?.metadata).toEqual(keyData.metadata);
        });
    });
    (0, node_test_2.describe)('getKey()', () => {
        (0, node_test_1.it)('sollte einen Schlüssel mit Tenant-Isolation abrufen', async () => {
            const keyData = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.FIELD_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'encrypted_key_data',
                iv: 'initialization_vector',
                authTag: 'auth_tag',
                version: 1,
                status: kms_1.KeyStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            testKeyIds.push(keyData.id);
            await keyStorage.saveKey(keyData);
            const retrievedKey = await keyStorage.getKey(keyData.id, testTenantId);
            expect(retrievedKey).toBeDefined();
            expect(retrievedKey?.id).toBe(keyData.id);
            expect(retrievedKey?.tenantId).toBe(testTenantId);
        });
        (0, node_test_1.it)('sollte null zurückgeben für nicht-existierenden Schlüssel', async () => {
            const retrievedKey = await keyStorage.getKey('non-existent-key', testTenantId);
            expect(retrievedKey).toBeNull();
        });
        (0, node_test_1.it)('sollte null zurückgeben bei falscher Tenant-ID', async () => {
            const keyData = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'encrypted_key_data',
                iv: 'initialization_vector',
                authTag: 'auth_tag',
                version: 1,
                status: kms_1.KeyStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            testKeyIds.push(keyData.id);
            await keyStorage.saveKey(keyData);
            const retrievedKey = await keyStorage.getKey(keyData.id, 'wrong-tenant');
            expect(retrievedKey).toBeNull();
        });
    });
    (0, node_test_2.describe)('getLatestKeyForPurpose()', () => {
        (0, node_test_1.it)('sollte den neuesten aktiven Schlüssel für einen Purpose abrufen', async () => {
            // Create multiple versions
            const key1 = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'encrypted_key_v1',
                iv: 'iv1',
                authTag: 'tag1',
                version: 1,
                status: kms_1.KeyStatus.DEPRECATED,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const key2 = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'encrypted_key_v2',
                iv: 'iv2',
                authTag: 'tag2',
                version: 2,
                status: kms_1.KeyStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            testKeyIds.push(key1.id, key2.id);
            await keyStorage.saveKey(key1);
            await keyStorage.saveKey(key2);
            const latestKey = await keyStorage.getLatestKeyForPurpose(testTenantId, kms_1.KeyPurpose.DATA_ENCRYPTION);
            expect(latestKey).toBeDefined();
            expect(latestKey?.version).toBe(2);
            expect(latestKey?.status).toBe(kms_1.KeyStatus.ACTIVE);
        });
        (0, node_test_1.it)('sollte null zurückgeben wenn kein aktiver Schlüssel existiert', async () => {
            const latestKey = await keyStorage.getLatestKeyForPurpose(testTenantId, kms_1.KeyPurpose.DOCUMENT_ENCRYPTION);
            expect(latestKey).toBeNull();
        });
    });
    (0, node_test_2.describe)('updateKeyStatus()', () => {
        (0, node_test_1.it)('sollte den Status eines Schlüssels aktualisieren', async () => {
            const keyData = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'encrypted_key_data',
                iv: 'initialization_vector',
                authTag: 'auth_tag',
                version: 1,
                status: kms_1.KeyStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            testKeyIds.push(keyData.id);
            await keyStorage.saveKey(keyData);
            await keyStorage.updateKeyStatus(keyData.id, testTenantId, kms_1.KeyStatus.DEPRECATED);
            const updatedKey = await keyStorage.getKey(keyData.id, testTenantId);
            expect(updatedKey?.status).toBe(kms_1.KeyStatus.DEPRECATED);
        });
    });
    (0, node_test_2.describe)('updateLastUsed()', () => {
        (0, node_test_1.it)('sollte lastUsedAt aktualisieren', async () => {
            const keyData = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'encrypted_key_data',
                iv: 'initialization_vector',
                authTag: 'auth_tag',
                version: 1,
                status: kms_1.KeyStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            testKeyIds.push(keyData.id);
            await keyStorage.saveKey(keyData);
            await new Promise(resolve => setTimeout(resolve, 100));
            await keyStorage.updateLastUsed(keyData.id, testTenantId);
            const updatedKey = await keyStorage.getKey(keyData.id, testTenantId);
            expect(updatedKey?.lastUsedAt).toBeDefined();
        });
    });
    (0, node_test_2.describe)('listKeys()', () => {
        (0, node_test_1.it)('sollte Schlüssel mit Filtern auflisten', async () => {
            const key1 = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'key1',
                iv: 'iv1',
                authTag: 'tag1',
                version: 1,
                status: kms_1.KeyStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const key2 = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.DOCUMENT_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'key2',
                iv: 'iv2',
                authTag: 'tag2',
                version: 1,
                status: kms_1.KeyStatus.DEPRECATED,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            testKeyIds.push(key1.id, key2.id);
            await keyStorage.saveKey(key1);
            await keyStorage.saveKey(key2);
            const activeKeys = await keyStorage.listKeys(testTenantId, {
                status: kms_1.KeyStatus.ACTIVE
            });
            expect(activeKeys.length).toBeGreaterThan(0);
            expect(activeKeys.every(k => k.status === kms_1.KeyStatus.ACTIVE)).toBe(true);
        });
        (0, node_test_1.it)('sollte Limit und Offset respektieren', async () => {
            const keys = await keyStorage.listKeys(testTenantId, {
                limit: 5,
                offset: 0
            });
            expect(keys.length).toBeLessThanOrEqual(5);
        });
    });
    (0, node_test_2.describe)('deleteKey()', () => {
        (0, node_test_1.it)('sollte einen Schlüssel löschen', async () => {
            const keyData = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'encrypted_key_data',
                iv: 'initialization_vector',
                authTag: 'auth_tag',
                version: 1,
                status: kms_1.KeyStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await keyStorage.saveKey(keyData);
            await keyStorage.deleteKey(keyData.id, testTenantId);
            const deletedKey = await keyStorage.getKey(keyData.id, testTenantId);
            expect(deletedKey).toBeNull();
        });
    });
    (0, node_test_2.describe)('countKeysByStatus()', () => {
        (0, node_test_1.it)('sollte Schlüssel nach Status zählen', async () => {
            const key1 = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'key1',
                iv: 'iv1',
                authTag: 'tag1',
                version: 1,
                status: kms_1.KeyStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const key2 = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'key2',
                iv: 'iv2',
                authTag: 'tag2',
                version: 1,
                status: kms_1.KeyStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            testKeyIds.push(key1.id, key2.id);
            await keyStorage.saveKey(key1);
            await keyStorage.saveKey(key2);
            const counts = await keyStorage.countKeysByStatus(testTenantId);
            expect(counts[kms_1.KeyStatus.ACTIVE]).toBeGreaterThanOrEqual(2);
        });
    });
    (0, node_test_2.describe)('findExpiredKeys()', () => {
        (0, node_test_1.it)('sollte abgelaufene Schlüssel finden', async () => {
            const expiredKey = {
                id: uuid.v4(),
                tenantId: testTenantId,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'expired_key',
                iv: 'iv',
                authTag: 'tag',
                version: 1,
                status: kms_1.KeyStatus.ACTIVE,
                expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
                createdAt: new Date(),
                updatedAt: new Date()
            };
            testKeyIds.push(expiredKey.id);
            await keyStorage.saveKey(expiredKey);
            const expiredKeys = await keyStorage.findExpiredKeys(testTenantId);
            expect(expiredKeys.some(k => k.id === expiredKey.id)).toBe(true);
        });
    });
    (0, node_test_2.describe)('Tenant-Isolation', () => {
        (0, node_test_1.it)('sollte Schlüssel zwischen Tenants isolieren', async () => {
            const tenant1 = 'tenant-1-' + Date.now();
            const tenant2 = 'tenant-2-' + Date.now();
            const key1 = {
                id: uuid.v4(),
                tenantId: tenant1,
                purpose: kms_1.KeyPurpose.DATA_ENCRYPTION,
                algorithm: 'aes-256-gcm',
                encryptedKey: 'key1',
                iv: 'iv1',
                authTag: 'tag1',
                version: 1,
                status: kms_1.KeyStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            testKeyIds.push(key1.id);
            await keyStorage.saveKey(key1);
            // Tenant 2 sollte key1 nicht sehen können
            const retrievedKey = await keyStorage.getKey(key1.id, tenant2);
            expect(retrievedKey).toBeNull();
            // Cleanup
            await prisma.encryptionKey.deleteMany({
                where: { tenantId: { in: [tenant1, tenant2] } }
            });
        });
    });
});
