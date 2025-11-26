# Task 11.1 - Key Management System Implementation

## Übersicht

Vollständige Implementierung des Key Management Systems (KMS) für Ende-zu-Ende-Verschlüsselung in der SmartLaw-Plattform.

## Implementierte Komponenten

### 1. Datenbank-Schema ✅

**Dateien:**
- `prisma/schema.prisma` - Erweitert mit KMS-Models
- `prisma/migrations/20241112000002_add_kms_tables/migration.sql` - Migration

**Models:**
- `EncryptionKey` - Verschlüsselte Schlüssel mit Metadaten
- `RotationSchedule` - Automatische Rotation-Planung
- `KeyAuditLog` - HMAC-signierte Audit-Logs
- `MasterKeyConfig` - Master Key Konfiguration

**Indizes:**
- `tenantId + status` - Schnelle Tenant-Queries
- `purpose` - Schlüssel nach Verwendungszweck
- `expiresAt` - Ablaufende Schlüssel finden
- `timestamp` - Audit-Log-Queries

### 2. TypeScript Types ✅

**Datei:** `src/types/kms.ts`

**Exports:**
- Enums: `KeyPurpose`, `KeyStatus`, `AuditEventType`, `KeyManagementErrorCode`
- Interfaces: `CreateKeyOptions`, `KeyMetadata`, `EncryptedKeyData`, `AuditLogEntry`, etc.
- Error Class: `KeyManagementError`

### 3. Master Key Manager ✅

**Datei:** `src/services/kms/MasterKeyManager.ts`

**Features:**
- Master Key aus Umgebungsvariable laden
- Validierung (256-bit, Hex-Format, nicht nur Nullen)
- Master Key Rotation (kritische Operation)
- Keine Key-Leakage in Logs

**Sicherheit:**
- Master Key wird niemals geloggt
- Validierung beim Start
- Fehlerbehandlung für fehlenden Key

### 4. Key Storage Layer ✅

**Datei:** `src/services/kms/KeyStorage.ts`

**Features:**
- CRUD-Operationen für verschlüsselte Schlüssel
- Tenant-Isolation auf Datenbankebene
- Envelope Encryption (Master Key → DEKs)
- Status-Management
- Ablaufdatum-Prüfung

**Methoden:**
- `saveKey()` - Speichert verschlüsselten Schlüssel
- `getKey()` - Holt Schlüssel mit Tenant-Check
- `getLatestKeyForPurpose()` - Aktuellster Schlüssel für Purpose
- `updateKeyStatus()` - Status-Änderungen
- `listKeys()` - Filtern und Listen
- `deleteKey()` - Physische Löschung

### 5. Key Cache Manager ✅

**Datei:** `src/services/kms/KeyCacheManager.ts`

**Features:**
- Redis-basiertes Caching
- LRU-Eviction (max 1000 Keys)
- TTL: 5 Minuten (konfigurierbar)
- Cache-Hit-Rate-Tracking
- Warmup-Funktion

**Methoden:**
- `cacheKey()` - Cached Schlüssel mit TTL
- `getCachedKey()` - Holt aus Cache
- `invalidateKey()` - Einzelner Key
- `invalidateAllKeys()` - Tenant-weit
- `getCacheStats()` - Statistiken

### 6. Audit Logger ✅

**Datei:** `src/services/kms/AuditLogger.ts`

**Features:**
- HMAC-Signierung aller Log-Einträge
- Vollständige Nachvollziehbarkeit
- Security-Event-Detection
- Compliance-Export (JSON/CSV)
- 7 Jahre Retention

**Event-Typen:**
- `KEY_CREATED` - Schlüsselerstellung
- `KEY_ACCESSED` - Zugriffe
- `KEY_ROTATED` - Rotationen
- `KEY_STATUS_CHANGED` - Status-Änderungen
- `KEY_DELETED` - Löschungen
- `SECURITY_ALERT` - Sicherheitsvorfälle
- `UNAUTHORIZED_ACCESS` - Unberechtigte Zugriffe

### 7. Key Rotation Manager ✅

**Datei:** `src/services/kms/KeyRotationManager.ts`

**Features:**
- Manuelle Rotation
- Automatische Rotation (Cron-Job)
- Rotation-Scheduling
- Ablaufende Schlüssel finden
- Rotation-Statistiken

**Methoden:**
- `rotateKey()` - Manuelle Rotation
- `scheduleRotation()` - Automatische Planung
- `checkAndRotateExpiredKeys()` - Batch-Rotation
- `getRotationStats()` - Statistiken

### 8. Key Management Service ✅

**Datei:** `src/services/kms/KeyManagementService.ts`

**Features:**
- Hauptservice, integriert alle Sub-Services
- Envelope Encryption
- Tenant-Isolation
- Cache-Integration
- Audit-Logging
- Lifecycle-Management

**Kern-Methoden:**
- `createKey()` - Erstellt neuen DEK
- `getKey()` - Holt Schlüssel (mit Cache)
- `getKeyForPurpose()` - Aktuellster für Purpose
- `rotateKey()` - Rotiert Schlüssel
- `activateKey()` / `deactivateKey()` - Status
- `markKeyCompromised()` - Security-Incident
- `deleteKey()` - Löscht Schlüssel
- `exportKeys()` / `importKeys()` - Backup
- `getAuditLog()` - Audit-Queries
- `getStats()` - Statistiken

### 9. EncryptionService Integration ✅

**Datei:** `src/services/EncryptionService.ts`

**Neue Klasse:** `EncryptionServiceWithKMS`

**Methoden:**
- `encryptWithKMS()` - Verschlüsselt mit KMS-Key
- `decryptWithKMS()` - Entschlüsselt mit KMS-Key
- `encryptObjectWithKMS()` - Objekt-Verschlüsselung
- `decryptObjectWithKMS()` - Objekt-Entschlüsselung
- `encryptFileWithKMS()` - Datei-Verschlüsselung
- `decryptFileWithKMS()` - Datei-Entschlüsselung
- `encryptSensitiveFieldsWithKMS()` - Feld-Verschlüsselung
- `decryptSensitiveFieldsWithKMS()` - Feld-Entschlüsselung
- `rotateEncryption()` - Re-Encryption

### 10. Konfiguration ✅

**Dateien:**
- `src/config/config.ts` - KMS-Config hinzugefügt
- `.env.example` - KMS-Variablen dokumentiert

**Konfiguration:**
```typescript
kms: {
  masterKey: string;
  cacheTTL: number;
  cacheMaxKeys: number;
  autoRotationEnabled: boolean;
  defaultRotationDays: number;
  auditRetentionDays: number;
  auditHmacKey: string;
  hsmEnabled: boolean;
  vaultUrl: string;
  vaultToken: string;
}
```

### 11. Dokumentation ✅

**Dateien:**
- `docs/kms-setup-guide.md` - Vollständiger Setup-Guide
- `docs/TASK_11.1_IMPLEMENTATION.md` - Diese Datei

## Architektur

### Envelope Encryption

```
Master Key (ENV/HSM)
    ↓ verschlüsselt
Data Encryption Key (PostgreSQL)
    ↓ verschlüsselt
Anwendungsdaten (MinIO/PostgreSQL)
```

### Component Diagram

```
┌─────────────────────────────────────────┐
│      KeyManagementService               │
│  (Hauptservice - Orchestrierung)        │
└─────────────────────────────────────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│ MasterKeyManager │            │   KeyStorage     │
│  (Master Key)    │            │  (PostgreSQL)    │
└──────────────────┘            └──────────────────┘
         │                                 │
         ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│ KeyCacheManager  │            │   AuditLogger    │
│     (Redis)      │            │  (Audit Logs)    │
└──────────────────┘            └──────────────────┘
         │                                 │
         ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│KeyRotationManager│            │ EncryptionService│
│   (Rotation)     │            │  (Crypto Ops)    │
└──────────────────┘            └──────────────────┘
```

## Sicherheitsfeatures

### 1. Envelope Encryption
- Master Key verschlüsselt alle DEKs
- DEKs verschlüsseln Anwendungsdaten
- Zwei-Schicht-Sicherheit

### 2. Tenant-Isolation
- Alle Queries mit Tenant-ID
- Datenbankebene-Isolation
- Cross-Tenant-Zugriffe werden geloggt

### 3. Audit-Logging
- HMAC-Signierung aller Logs
- Manipulation-Detection
- 7 Jahre Retention (DSGVO)

### 4. Key Lifecycle
- Status: active, deprecated, disabled, compromised, deleted
- Automatische Deaktivierung bei Ablauf
- Kompromittierte Keys sofort deaktiviert

### 5. Cache-Security
- Nur entschlüsselte Keys im Cache
- 5 Minuten TTL
- Sofortige Invalidierung bei Rotation

## Performance-Optimierungen

### 1. Caching
- Redis-Cache für häufig verwendete Keys
- LRU-Eviction bei 1000 Keys
- Cache-Hit-Rate-Tracking

### 2. Datenbank-Indizes
- Optimiert für häufige Queries
- Tenant + Status
- Purpose
- Expires-At
- Timestamp (Audit)

### 3. Batch-Operations
- Bulk-Rotation für abgelaufene Keys
- Batch-Export für Backups

## Verwendung

### Initialisierung

```typescript
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { KeyManagementService } from './services/kms';
import { EncryptionServiceWithKMS } from './services/EncryptionService';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);
const encryptionService = new EncryptionServiceWithKMS();

const kms = new KeyManagementService(prisma, redis, encryptionService);
encryptionService.setKMS(kms);
```

### Schlüssel erstellen

```typescript
const key = await kms.createKey({
  tenantId: 'tenant-123',
  purpose: KeyPurpose.DOCUMENT_ENCRYPTION,
  autoRotate: true,
  rotationIntervalDays: 90
});
```

### Daten verschlüsseln

```typescript
const encrypted = await encryptionService.encryptWithKMS(
  data,
  tenantId,
  KeyPurpose.DOCUMENT_ENCRYPTION,
  'document-service'
);

// Speichere mit Key-Referenz
await saveDocument({
  ...encrypted,
  keyId: encrypted.keyId,
  keyVersion: encrypted.keyVersion
});
```

### Daten entschlüsseln

```typescript
const document = await loadDocument(documentId);
const decrypted = await encryptionService.decryptWithKMS(
  document,
  tenantId,
  'document-service'
);
```

## Setup-Schritte

### 1. Master Key generieren

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Umgebungsvariablen setzen

```bash
MASTER_ENCRYPTION_KEY=<generated-key>
KMS_AUDIT_HMAC_KEY=<generated-hmac-key>
```

### 3. Migration ausführen

```bash
cd services/backend
npx prisma migrate deploy
```

### 4. KMS initialisieren

```typescript
const kms = new KeyManagementService(prisma, redis, encryptionService);
```

## Nächste Schritte

### Service-Integration
- [ ] DocumentStorageService mit KMS
- [ ] UserService für sensitive Daten
- [ ] ApiKey-Verwaltung für B2B

### TLS 1.3
- [ ] HTTPS-Konfiguration
- [ ] SSL-Zertifikate
- [ ] Redirect HTTP → HTTPS

### Monitoring
- [ ] Prometheus-Metriken
- [ ] Health-Check-Endpoint
- [ ] Alerting für Security-Events

### Testing
- [ ] Unit Tests für alle Komponenten
- [ ] Integration Tests
- [ ] Security Tests
- [ ] Performance Tests

## Metriken

Das KMS tracked folgende Metriken:

- **Keys by Status**: Anzahl Schlüssel pro Status
- **Cache Hit Rate**: Prozentsatz Cache-Treffer
- **Rotation Stats**: Geplante, überfällige, kommende Rotationen
- **Audit Events**: Events nach Typ

## Compliance

### DSGVO
- ✅ Recht auf Löschung (deleteKey)
- ✅ Recht auf Auskunft (getAuditLog)
- ✅ Datenminimierung (nur notwendige Metadaten)
- ✅ Technische Sicherheit (Verschlüsselung)
- ✅ Audit-Trail (7 Jahre Retention)

### Best Practices
- ✅ Envelope Encryption
- ✅ Key Rotation
- ✅ Audit Logging
- ✅ Tenant Isolation
- ✅ Least Privilege

## Troubleshooting

### Master Key Fehler
```
Error: Master encryption key not found
```
→ Setze `MASTER_ENCRYPTION_KEY` in `.env`

### Cache-Fehler
```
Error: Failed to cache encryption key
```
→ Prüfe Redis-Verbindung

### Schlüssel abgelaufen
```
Error: Key has expired
```
→ Rotiere Schlüssel oder erstelle neuen

## Support

- Setup-Guide: `docs/kms-setup-guide.md`
- Logs: `services/backend/logs/`
- Audit-Logs: `await kms.getAuditLog()`

## Status

✅ **Vollständig implementiert**

Alle Kern-Komponenten sind implementiert und einsatzbereit. Die Integration in bestehende Services kann nun erfolgen.
