import { createClient, RedisClientType } from 'redis';
import { KeyCacheManager } from '../services/kms/KeyCacheManager';
import {
  KeyStatus,
  KeyPurpose,
  EncryptedKeyData
} from '../types/kms';
import * as uuid from 'uuid';

describe('KeyCacheManager', () => {
  let redis: RedisClientType;
  let cacheManager: KeyCacheManager;
  const testTenantId = 'test-tenant-cache-' + Date.now();

  beforeAll(async () => {
    // Create Redis client for testing
    redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await redis.connect();
    
    cacheManager = new KeyCacheManager(redis);
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await cacheManager.clearCache();
    await redis.disconnect();
  });

  afterEach(async () => {
    // Clear cache after each test
    await cacheManager.clearCache();
    await cacheManager.resetCacheStats();
  });

  describe('cacheKey()', () => {
    it('sollte einen Schlüssel im Cache speichern', async () => {
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

      await cacheManager.cacheKey(keyData);

      const isCached = await cacheManager.isCached(keyData.id, testTenantId);
      expect(isCached).toBe(true);
    });

    it('sollte einen Schlüssel mit custom TTL speichern', async () => {
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
        updatedAt: new Date()
      };

      await cacheManager.cacheKey(keyData, 60); // 60 seconds TTL

      const isCached = await cacheManager.isCached(keyData.id, testTenantId);
      expect(isCached).toBe(true);
    });

    it('sollte Metadaten mit dem Schlüssel cachen', async () => {
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
        updatedAt: new Date(),
        metadata: {
          description: 'Test key with metadata',
          owner: 'test-user'
        }
      };

      await cacheManager.cacheKey(keyData);

      const cachedKey = await cacheManager.getCachedKey(keyData.id, testTenantId);
      expect(cachedKey?.metadata).toEqual(keyData.metadata);
    });
  });

  describe('getCachedKey()', () => {
    it('sollte einen gecachten Schlüssel abrufen (Cache Hit)', async () => {
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

      await cacheManager.cacheKey(keyData);

      const cachedKey = await cacheManager.getCachedKey(keyData.id, testTenantId);

      expect(cachedKey).toBeDefined();
      expect(cachedKey?.id).toBe(keyData.id);
      expect(cachedKey?.tenantId).toBe(testTenantId);
      expect(cachedKey?.encryptedKey).toBe(keyData.encryptedKey);
    });

    it('sollte null zurückgeben für nicht-gecachten Schlüssel (Cache Miss)', async () => {
      const cachedKey = await cacheManager.getCachedKey('non-existent-key', testTenantId);
      expect(cachedKey).toBeNull();
    });

    it('sollte Date-Objekte korrekt deserialisieren', async () => {
      const now = new Date();
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
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(now.getTime() + 86400000) // +24h
      };

      await cacheManager.cacheKey(keyData);

      const cachedKey = await cacheManager.getCachedKey(keyData.id, testTenantId);

      expect(cachedKey?.createdAt).toBeInstanceOf(Date);
      expect(cachedKey?.updatedAt).toBeInstanceOf(Date);
      expect(cachedKey?.expiresAt).toBeInstanceOf(Date);
    });

    it('sollte Tenant-Isolation respektieren', async () => {
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

      await cacheManager.cacheKey(keyData);

      // Versuche mit falscher Tenant-ID abzurufen
      const cachedKey = await cacheManager.getCachedKey(keyData.id, 'wrong-tenant');
      expect(cachedKey).toBeNull();
    });
  });

  describe('invalidateKey()', () => {
    it('sollte einen Schlüssel aus dem Cache entfernen', async () => {
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

      await cacheManager.cacheKey(keyData);
      expect(await cacheManager.isCached(keyData.id, testTenantId)).toBe(true);

      await cacheManager.invalidateKey(keyData.id, testTenantId);
      expect(await cacheManager.isCached(keyData.id, testTenantId)).toBe(false);
    });
  });

  describe('invalidateTenantKeys()', () => {
    it('sollte alle Schlüssel eines Tenants invalidieren', async () => {
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
        status: KeyStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await cacheManager.cacheKey(key1);
      await cacheManager.cacheKey(key2);

      expect(await cacheManager.isCached(key1.id, testTenantId)).toBe(true);
      expect(await cacheManager.isCached(key2.id, testTenantId)).toBe(true);

      await cacheManager.invalidateTenantKeys(testTenantId);

      expect(await cacheManager.isCached(key1.id, testTenantId)).toBe(false);
      expect(await cacheManager.isCached(key2.id, testTenantId)).toBe(false);
    });
  });

  describe('getCacheStats()', () => {
    it('sollte Cache-Statistiken zurückgeben', async () => {
      const stats = await cacheManager.getCacheStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('cachedKeys');
      expect(typeof stats.hits).toBe('number');
      expect(typeof stats.misses).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
      expect(typeof stats.cachedKeys).toBe('number');
    });

    it('sollte Cache Hits korrekt tracken', async () => {
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

      await cacheManager.cacheKey(keyData);

      // Cache Hit
      await cacheManager.getCachedKey(keyData.id, testTenantId);

      const stats = await cacheManager.getCacheStats();
      expect(stats.hits).toBeGreaterThan(0);
    });

    it('sollte Cache Misses korrekt tracken', async () => {
      // Cache Miss
      await cacheManager.getCachedKey('non-existent-key', testTenantId);

      const stats = await cacheManager.getCacheStats();
      expect(stats.misses).toBeGreaterThan(0);
    });

    it('sollte Hit-Rate korrekt berechnen', async () => {
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

      await cacheManager.cacheKey(keyData);

      // 1 Hit
      await cacheManager.getCachedKey(keyData.id, testTenantId);
      // 1 Miss
      await cacheManager.getCachedKey('non-existent', testTenantId);

      const stats = await cacheManager.getCacheStats();
      expect(stats.hitRate).toBe(50); // 50%
    });

    it('sollte Anzahl gecachter Keys korrekt zählen', async () => {
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
        status: KeyStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await cacheManager.cacheKey(key1);
      await cacheManager.cacheKey(key2);

      const stats = await cacheManager.getCacheStats();
      expect(stats.cachedKeys).toBeGreaterThanOrEqual(2);
    });
  });

  describe('resetCacheStats()', () => {
    it('sollte Cache-Statistiken zurücksetzen', async () => {
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

      await cacheManager.cacheKey(keyData);
      await cacheManager.getCachedKey(keyData.id, testTenantId);

      let stats = await cacheManager.getCacheStats();
      expect(stats.hits).toBeGreaterThan(0);

      await cacheManager.resetCacheStats();

      stats = await cacheManager.getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('clearCache()', () => {
    it('sollte alle gecachten Schlüssel löschen', async () => {
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
        status: KeyStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await cacheManager.cacheKey(key1);
      await cacheManager.cacheKey(key2);

      await cacheManager.clearCache();

      const stats = await cacheManager.getCacheStats();
      expect(stats.cachedKeys).toBe(0);
    });
  });

  describe('refreshTTL()', () => {
    it('sollte die TTL eines gecachten Schlüssels aktualisieren', async () => {
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

      await cacheManager.cacheKey(keyData, 10); // 10 seconds TTL

      // Refresh TTL
      await cacheManager.refreshTTL(keyData.id, testTenantId, 300);

      // Key sollte noch im Cache sein
      const isCached = await cacheManager.isCached(keyData.id, testTenantId);
      expect(isCached).toBe(true);
    });
  });

  describe('healthCheck()', () => {
    it('sollte true zurückgeben wenn Cache funktioniert', async () => {
      const isHealthy = await cacheManager.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });

  describe('TTL und Expiration', () => {
    it('sollte Schlüssel nach TTL automatisch entfernen', async () => {
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

      // Cache mit 1 Sekunde TTL
      await cacheManager.cacheKey(keyData, 1);

      expect(await cacheManager.isCached(keyData.id, testTenantId)).toBe(true);

      // Warte 2 Sekunden
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Key sollte abgelaufen sein
      expect(await cacheManager.isCached(keyData.id, testTenantId)).toBe(false);
    }, 10000); // Timeout auf 10 Sekunden erhöhen
  });

  describe('LRU Eviction', () => {
    it('sollte mit Standard-TTL von 5 Minuten arbeiten', async () => {
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

      // Cache ohne TTL (verwendet Standard-TTL von 300 Sekunden)
      await cacheManager.cacheKey(keyData);

      // Key sollte im Cache sein
      expect(await cacheManager.isCached(keyData.id, testTenantId)).toBe(true);
    });
  });
});
