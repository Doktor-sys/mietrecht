import { PrismaClient } from '@prisma/client';
import { KeyStorage } from '../services/kms/KeyStorage';
import {
  KeyStatus,
  KeyPurpose,
  EncryptedKeyData,
  KeyManagementError
} from '../types/kms';
import * as uuid from 'uuid';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { afterEach } from 'node:test';
import { describe } from 'node:test';

describe('KeyStorage', () => {
  let prisma: PrismaClient;
  let keyStorage: KeyStorage;
  const testTenantId = 'test-tenant-' + Date.now();
  const testKeyIds: string[] = [];

  beforeAll(() => {
    prisma = new PrismaClient();
    keyStorage = new KeyStorage(prisma);
  });

  afterAll(async () => {
    // Cleanup test keys
    await prisma.encryptionKey.deleteMany({
      where: { tenantId: testTenantId }
    });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Cleanup keys created in tests
    if (testKeyIds.length > 0) {
      await prisma.encryptionKey.deleteMany({
        where: { id: { in: testKeyIds } }
      });
      testKeyIds.length = 0;
    }
  });

  describe('saveKey()', () => {
    it('sollte einen verschlüsselten Schlüssel speichern', async () => {
      const keyData: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'encrypted_key_data',
        iv: 'initialization_vector',
        authTag: 'auth_tag',
        version: 1,
        status: KeyStatus.ACTIVE,
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
      expect(savedKey?.purpose).toBe(KeyPurpose.DATA_ENCRYPTION);
    });

    it('sollte Metadaten mit dem Schlüssel speichern', async () => {
      const keyData: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.DOCUMENT_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'encrypted_key_data',
        iv: 'initialization_vector',
        authTag: 'auth_tag',
        version: 1,
        status: KeyStatus.ACTIVE,
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

  describe('getKey()', () => {
    it('sollte einen Schlüssel mit Tenant-Isolation abrufen', async () => {
      const keyData: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.FIELD_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'encrypted_key_data',
        iv: 'initialization_vector',
        authTag: 'auth_tag',
        version: 1,
        status: KeyStatus.ACTIVE,
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

    it('sollte null zurückgeben für nicht-existierenden Schlüssel', async () => {
      const retrievedKey = await keyStorage.getKey('non-existent-key', testTenantId);
      expect(retrievedKey).toBeNull();
    });

    it('sollte null zurückgeben bei falscher Tenant-ID', async () => {
      const keyData: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'encrypted_key_data',
        iv: 'initialization_vector',
        authTag: 'auth_tag',
        version: 1,
        status: KeyStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      testKeyIds.push(keyData.id);
      await keyStorage.saveKey(keyData);

      const retrievedKey = await keyStorage.getKey(keyData.id, 'wrong-tenant');
      expect(retrievedKey).toBeNull();
    });
  });

  describe('getLatestKeyForPurpose()', () => {
    it('sollte den neuesten aktiven Schlüssel für einen Purpose abrufen', async () => {
      // Create multiple versions
      const key1: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'encrypted_key_v1',
        iv: 'iv1',
        authTag: 'tag1',
        version: 1,
        status: KeyStatus.DEPRECATED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const key2: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'encrypted_key_v2',
        iv: 'iv2',
        authTag: 'tag2',
        version: 2,
        status: KeyStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      testKeyIds.push(key1.id, key2.id);
      await keyStorage.saveKey(key1);
      await keyStorage.saveKey(key2);

      const latestKey = await keyStorage.getLatestKeyForPurpose(
        testTenantId,
        KeyPurpose.DATA_ENCRYPTION
      );

      expect(latestKey).toBeDefined();
      expect(latestKey?.version).toBe(2);
      expect(latestKey?.status).toBe(KeyStatus.ACTIVE);
    });

    it('sollte null zurückgeben wenn kein aktiver Schlüssel existiert', async () => {
      const latestKey = await keyStorage.getLatestKeyForPurpose(
        testTenantId,
        KeyPurpose.DOCUMENT_ENCRYPTION
      );

      expect(latestKey).toBeNull();
    });
  });

  describe('updateKeyStatus()', () => {
    it('sollte den Status eines Schlüssels aktualisieren', async () => {
      const keyData: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'encrypted_key_data',
        iv: 'initialization_vector',
        authTag: 'auth_tag',
        version: 1,
        status: KeyStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      testKeyIds.push(keyData.id);
      await keyStorage.saveKey(keyData);

      await keyStorage.updateKeyStatus(keyData.id, testTenantId, KeyStatus.DEPRECATED);

      const updatedKey = await keyStorage.getKey(keyData.id, testTenantId);
      expect(updatedKey?.status).toBe(KeyStatus.DEPRECATED);
    });
  });

  describe('updateLastUsed()', () => {
    it('sollte lastUsedAt aktualisieren', async () => {
      const keyData: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'encrypted_key_data',
        iv: 'initialization_vector',
        authTag: 'auth_tag',
        version: 1,
        status: KeyStatus.ACTIVE,
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

  describe('listKeys()', () => {
    it('sollte Schlüssel mit Filtern auflisten', async () => {
      const key1: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'key1',
        iv: 'iv1',
        authTag: 'tag1',
        version: 1,
        status: KeyStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const key2: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.DOCUMENT_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'key2',
        iv: 'iv2',
        authTag: 'tag2',
        version: 1,
        status: KeyStatus.DEPRECATED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      testKeyIds.push(key1.id, key2.id);
      await keyStorage.saveKey(key1);
      await keyStorage.saveKey(key2);

      const activeKeys = await keyStorage.listKeys(testTenantId, {
        status: KeyStatus.ACTIVE
      });

      expect(activeKeys.length).toBeGreaterThan(0);
      expect(activeKeys.every(k => k.status === KeyStatus.ACTIVE)).toBe(true);
    });

    it('sollte Limit und Offset respektieren', async () => {
      const keys = await keyStorage.listKeys(testTenantId, {
        limit: 5,
        offset: 0
      });

      expect(keys.length).toBeLessThanOrEqual(5);
    });
  });

  describe('deleteKey()', () => {
    it('sollte einen Schlüssel löschen', async () => {
      const keyData: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'encrypted_key_data',
        iv: 'initialization_vector',
        authTag: 'auth_tag',
        version: 1,
        status: KeyStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await keyStorage.saveKey(keyData);
      await keyStorage.deleteKey(keyData.id, testTenantId);

      const deletedKey = await keyStorage.getKey(keyData.id, testTenantId);
      expect(deletedKey).toBeNull();
    });
  });

  describe('countKeysByStatus()', () => {
    it('sollte Schlüssel nach Status zählen', async () => {
      const key1: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'key1',
        iv: 'iv1',
        authTag: 'tag1',
        version: 1,
        status: KeyStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const key2: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'key2',
        iv: 'iv2',
        authTag: 'tag2',
        version: 1,
        status: KeyStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      testKeyIds.push(key1.id, key2.id);
      await keyStorage.saveKey(key1);
      await keyStorage.saveKey(key2);

      const counts = await keyStorage.countKeysByStatus(testTenantId);
      expect(counts[KeyStatus.ACTIVE]).toBeGreaterThanOrEqual(2);
    });
  });

  describe('findExpiredKeys()', () => {
    it('sollte abgelaufene Schlüssel finden', async () => {
      const expiredKey: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: testTenantId,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'expired_key',
        iv: 'iv',
        authTag: 'tag',
        version: 1,
        status: KeyStatus.ACTIVE,
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

  describe('Tenant-Isolation', () => {
    it('sollte Schlüssel zwischen Tenants isolieren', async () => {
      const tenant1 = 'tenant-1-' + Date.now();
      const tenant2 = 'tenant-2-' + Date.now();

      const key1: EncryptedKeyData = {
        id: uuid.v4(),
        tenantId: tenant1,
        purpose: KeyPurpose.DATA_ENCRYPTION,
        algorithm: 'aes-256-gcm',
        encryptedKey: 'key1',
        iv: 'iv1',
        authTag: 'tag1',
        version: 1,
        status: KeyStatus.ACTIVE,
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