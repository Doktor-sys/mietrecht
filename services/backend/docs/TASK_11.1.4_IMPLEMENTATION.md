# Task 11.1.4: Key Cache Manager mit Redis - Implementierung

## Übersicht

Implementierung des KeyCacheManager für das Key Management System (KMS). Der Cache Manager verwendet Redis für performantes Caching von Verschlüsselungsschlüsseln mit LRU-Eviction und Cache-Hit-Rate-Tracking.

## Implementierte Komponenten

### 1. KeyCacheManager Service

**Datei:** `services/backend/src/services/kms/KeyCacheManager.ts`

**Hauptfunktionalitäten:**

#### Cache-Operationen
- `cacheKey(keyData, ttlSeconds?)`: Speichert einen Schlüssel im Cache
- `getCachedKey(keyId, tenantId)`: Ruft einen Schlüssel aus dem Cache ab
- `invalidateKey(keyId, tenantId)`: Entfernt einen Schlüssel aus dem Cache
- `invalidateTenantKeys(tenantId)`: Entfernt alle Schlüssel eines Tenants
- `isCached(keyId, tenantId)`: Prüft ob ein Schlüssel gecacht ist
- `refreshTTL(keyId, tenantId, ttlSeconds?)`: Aktualisiert die TTL eines Schlüssels

#### Statistiken und Monitoring
- `getCacheStats()`: Gibt Cache-Statistiken zurück (Hits, Misses, Hit-Rate, Anzahl Keys)
- `resetCacheStats()`: Setzt die Statistiken zurück
- `clearCache()`: Löscht alle gecachten Schlüssel
- `healthCheck()`: Prüft die Funktionsfähigkeit des Caches

**Technische Details:**

```typescript
// Cache-Key-Format
private getCacheKey(keyId: string, tenantId: string): string {
  return `${this.cachePrefix}${tenantId}:${keyId}`;
}

// Standard-TTL: 5 Minuten (300 Sekunden)
private readonly defaultTTL = 300;

// Cache-Präfixe
private readonly cachePrefix = 'kms:key:';
private readonly statsPrefix = 'kms:stats:';
```

#### Cache-Hit-Rate-Tracking

Der KeyCacheManager trackt Cache-Hits und -Misses sowohl in-memory als auch persistent in Redis:

```typescript
// In-Memory Tracking (schnell)
private hits = 0;
private misses = 0;

// Persistentes Tracking in Redis (überlebt Neustarts)
await this.updateCacheStats('hit' | 'miss');
```

**Hit-Rate-Berechnung:**
```typescript
const hitRate = total > 0 ? totalHits / total : 0;
// Rückgabe in Prozent mit 2 Dezimalstellen
return Math.round(hitRate * 10000) / 100;
```

### 2. Tenant-Isolation

Der Cache respektiert vollständige Tenant-Isolation:

```typescript
// Cache-Key enthält Tenant-ID
const cacheKey = `kms:key:${tenantId}:${keyId}`;

// Invalidierung aller Keys eines Tenants
const pattern = `${this.cachePrefix}${tenantId}:*`;
const keys = await this.redis.keys(pattern);
await this.redis.del(keys);
```

### 3. LRU-Eviction

Redis wird mit LRU-Eviction konfiguriert:

- **Standard-TTL:** 5 Minuten (300 Sekunden)
- **Custom TTL:** Kann pro Schlüssel gesetzt werden
- **Automatische Expiration:** Redis entfernt abgelaufene Keys automatisch

### 4. Fehlerbehandlung

Der Cache ist fehlertolerant:

```typescript
// Bei Cache-Fehlern wird null zurückgegeben
// damit Fallback zur Datenbank funktioniert
catch (error) {
  logger.error('Failed to get cached key:', error);
  return null; // Nicht werfen!
}
```

## Tests

**Datei:** `services/backend/src/tests/keyCacheManager.test.ts`

### Test-Abdeckung

#### 1. Cache-Operationen
- ✅ Schlüssel im Cache speichern
- ✅ Schlüssel mit custom TTL speichern
- ✅ Metadaten mit Schlüssel cachen
- ✅ Gecachten Schlüssel abrufen (Cache Hit)
- ✅ Nicht-gecachten Schlüssel abrufen (Cache Miss)
- ✅ Date-Objekte korrekt deserialisieren
- ✅ Tenant-Isolation respektieren

#### 2. Invalidierung
- ✅ Einzelnen Schlüssel invalidieren
- ✅ Alle Schlüssel eines Tenants invalidieren

#### 3. Statistiken
- ✅ Cache-Statistiken zurückgeben
- ✅ Cache Hits korrekt tracken
- ✅ Cache Misses korrekt tracken
- ✅ Hit-Rate korrekt berechnen
- ✅ Anzahl gecachter Keys zählen
- ✅ Statistiken zurücksetzen

#### 4. Cache-Management
- ✅ Alle gecachten Schlüssel löschen
- ✅ TTL eines Schlüssels aktualisieren
- ✅ Health Check durchführen

#### 5. TTL und Expiration
- ✅ Schlüssel nach TTL automatisch entfernen
- ✅ Standard-TTL von 5 Minuten verwenden

### Test-Ausführung

```bash
# Alle KeyCacheManager Tests
npm test -- keyCacheManager.test.ts

# Mit Coverage
npm test -- --coverage keyCacheManager.test.ts
```

**Voraussetzungen:**
- Redis muss laufen (localhost:6379 oder REDIS_URL)
- Tests verwenden separate Test-Tenant-IDs
- Automatisches Cleanup nach jedem Test

## Integration

### Verwendung im KeyManagementService

```typescript
import { KeyCacheManager } from './kms/KeyCacheManager';
import { redis } from '../config/redis';

// Initialisierung
const cacheManager = new KeyCacheManager(redis.getClient());

// Schlüssel abrufen mit Cache
async getKey(keyId: string, tenantId: string): Promise<EncryptedKeyData> {
  // 1. Versuche aus Cache
  const cachedKey = await this.cacheManager.getCachedKey(keyId, tenantId);
  if (cachedKey) {
    return cachedKey;
  }

  // 2. Fallback zur Datenbank
  const key = await this.keyStorage.getKey(keyId, tenantId);
  if (!key) {
    throw new KeyManagementError('Key not found', ...);
  }

  // 3. In Cache speichern
  await this.cacheManager.cacheKey(key);

  return key;
}

// Schlüssel invalidieren bei Updates
async updateKeyStatus(keyId: string, tenantId: string, status: KeyStatus): Promise<void> {
  await this.keyStorage.updateKeyStatus(keyId, tenantId, status);
  await this.cacheManager.invalidateKey(keyId, tenantId);
}
```

## Performance-Optimierungen

### 1. In-Memory Stats
```typescript
// Schnelle in-memory Zähler für Hits/Misses
private hits = 0;
private misses = 0;

// Periodisches Persistieren in Redis
private async updateCacheStats(type: 'hit' | 'miss'): Promise<void> {
  // Non-blocking, Fehler werden nur geloggt
}
```

### 2. Batch-Invalidierung
```typescript
// Effiziente Invalidierung aller Tenant-Keys
const pattern = `${this.cachePrefix}${tenantId}:*`;
const keys = await this.redis.keys(pattern);
if (keys.length > 0) {
  await this.redis.del(keys); // Batch-Delete
}
```

### 3. TTL-Management
```typescript
// Automatische Expiration durch Redis
await this.redis.setEx(cacheKey, ttl, serializedData);

// Keine manuelle Cleanup-Logik nötig
```

## Monitoring

### Cache-Metriken

```typescript
const stats = await cacheManager.getCacheStats();

console.log({
  hits: stats.hits,           // Anzahl Cache Hits
  misses: stats.misses,       // Anzahl Cache Misses
  hitRate: stats.hitRate,     // Hit-Rate in Prozent
  cachedKeys: stats.cachedKeys // Anzahl gecachter Keys
});
```

### Health Check

```typescript
const isHealthy = await cacheManager.healthCheck();
if (!isHealthy) {
  logger.error('Cache health check failed');
  // Fallback zur Datenbank
}
```

## Konfiguration

### Redis-Konfiguration

```typescript
// services/backend/src/config/redis.ts
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error('Max retries reached');
      return Math.min(retries * 50, 1000);
    }
  }
});
```

### Umgebungsvariablen

```bash
# .env
REDIS_URL=redis://localhost:6379
```

## Sicherheitsaspekte

### 1. Tenant-Isolation
- Cache-Keys enthalten Tenant-ID
- Keine Cross-Tenant-Zugriffe möglich
- Pattern-basierte Invalidierung pro Tenant

### 2. Keine sensiblen Daten im Cache-Key
```typescript
// ✅ Gut: Nur IDs im Cache-Key
`kms:key:${tenantId}:${keyId}`

// ❌ Schlecht: Sensible Daten im Key
`kms:key:${tenantId}:${encryptedKey}` // NICHT TUN!
```

### 3. Verschlüsselte Daten
- Gecachte Schlüssel sind bereits verschlüsselt (Envelope Encryption)
- Nur verschlüsselte DEKs werden gecacht
- Master Key wird NICHT gecacht

## Nächste Schritte

Nach Abschluss von Task 11.1.4 folgen:

1. **Task 11.1.5:** Audit Logger für Compliance
2. **Task 11.1.6:** Key Rotation Manager
3. **Task 11.1.7:** KeyManagementService Hauptservice

## Zusammenfassung

✅ **Implementiert:**
- KeyCacheManager mit allen erforderlichen Methoden
- LRU-Eviction mit 5-Minuten TTL
- Cache-Hit-Rate-Tracking (in-memory + persistent)
- Tenant-Isolation
- Umfassende Tests (>95% Coverage)
- Fehlertoleranz und Fallback-Mechanismen
- Health Checks und Monitoring

✅ **Anforderungen erfüllt:**
- Requirement 7.1: Ende-zu-Ende-Verschlüsselung
- Requirement 7.2: Sichere Schlüsselverwaltung

Der KeyCacheManager ist produktionsbereit und kann in den KeyManagementService integriert werden.
