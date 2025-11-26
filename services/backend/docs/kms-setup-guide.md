# Key Management System (KMS) - Setup Guide

## Übersicht

Das Key Management System (KMS) ist ein zentraler Sicherheitsdienst für die SmartLaw-Plattform, der die sichere Verwaltung, Speicherung, Rotation und den vollständigen Lebenszyklus von Verschlüsselungsschlüsseln gewährleistet.

## Architektur

### Komponenten

1. **MasterKeyManager**: Verwaltet den Master Key für Envelope Encryption
2. **KeyStorage**: Persistenz-Layer für verschlüsselte Schlüssel
3. **KeyCacheManager**: Redis-basiertes Caching für Performance
4. **AuditLogger**: Vollständige Protokollierung aller Operationen
5. **KeyRotationManager**: Automatische und manuelle Schlüsselrotation
6. **KeyManagementService**: Hauptservice, der alle Komponenten integriert

### Envelope Encryption

```
Master Key (aus ENV/HSM)
    ↓
Data Encryption Key (verschlüsselt in DB)
    ↓
Anwendungsdaten (verschlüsselt in MinIO/DB)
```

## Installation

### 1. Datenbank-Migration

```bash
cd services/backend
npx prisma migrate deploy
```

### 2. Master Key generieren

**WICHTIG**: Der Master Key muss 256 bits (64 hexadezimale Zeichen) haben.

```bash
# Generiere einen sicheren Master Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Umgebungsvariablen konfigurieren

Kopiere `.env.example` zu `.env` und setze die KMS-Variablen:

```bash
# Master Key (KRITISCH - NIEMALS IN GIT COMMITTEN!)
MASTER_ENCRYPTION_KEY=<dein-generierter-256-bit-key>

# Cache-Konfiguration
KMS_CACHE_TTL=300
KMS_CACHE_MAX_KEYS=1000

# Rotation-Konfiguration
KMS_AUTO_ROTATION_ENABLED=true
KMS_DEFAULT_ROTATION_DAYS=90

# Audit-Konfiguration
KMS_AUDIT_RETENTION_DAYS=2555
KMS_AUDIT_HMAC_KEY=<dein-hmac-key>
```

### 4. HMAC Key für Audit-Logs generieren

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Verwendung

### Initialisierung

```typescript
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { KeyManagementService } from './services/kms';
import { EncryptionService } from './services/EncryptionService';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);
const encryptionService = new EncryptionService();

const kms = new KeyManagementService(prisma, redis, encryptionService);
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

### Schlüssel abrufen

```typescript
const key = await kms.getKey(keyId, tenantId, 'document-service');
```

### Schlüssel rotieren

```typescript
// Manuelle Rotation
const newKey = await kms.rotateKey(keyId, tenantId);

// Automatische Rotation planen
await kms.scheduleAutoRotation(keyId, 90); // alle 90 Tage
```

### Audit-Logs abfragen

```typescript
const logs = await kms.getAuditLog({
  tenantId: 'tenant-123',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  eventType: AuditEventType.KEY_ACCESSED
});
```

## Integration mit EncryptionService

### Verschlüsselung mit KMS

```typescript
import { EncryptionService } from './services/EncryptionService';
import { KeyManagementService } from './services/kms';

// Hole Schlüssel vom KMS
const keyMetadata = await kms.getKeyForPurpose(tenantId, KeyPurpose.DOCUMENT_ENCRYPTION);
const key = await kms.getKey(keyMetadata.id, tenantId);

// Verschlüssele Daten
const encrypted = encryptionService.encrypt(data, key);

// Speichere Key-Referenz mit verschlüsselten Daten
await saveDocument({
  ...encrypted,
  keyId: keyMetadata.id,
  keyVersion: keyMetadata.version
});
```

### Entschlüsselung mit KMS

```typescript
// Lade verschlüsselte Daten mit Key-Referenz
const document = await loadDocument(documentId);

// Hole Schlüssel vom KMS
const key = await kms.getKey(document.keyId, tenantId);

// Entschlüssele Daten
const decrypted = encryptionService.decrypt(
  {
    encryptedData: document.encryptedData,
    iv: document.iv,
    authTag: document.authTag
  },
  key
);
```

## Sicherheitsaspekte

### Master Key Sicherheit

1. **Niemals in Git committen**: Master Key muss in Umgebungsvariablen gespeichert werden
2. **Rotation**: Master Key sollte regelmäßig rotiert werden (mit äußerster Vorsicht)
3. **HSM-Integration**: Für Produktion sollte ein Hardware Security Module verwendet werden
4. **Backup**: Master Key muss sicher gesichert werden (offline, verschlüsselt)

### Tenant-Isolation

- Alle Schlüssel sind mit einer Tenant-ID verknüpft
- Zugriff auf Schlüssel wird auf Datenbankebene isoliert
- Cross-Tenant-Zugriffe werden im Audit-Log als Security-Alert protokolliert

### Audit-Logging

- Alle Operationen werden mit HMAC-Signatur protokolliert
- Audit-Logs werden für 7 Jahre aufbewahrt (DSGVO-Compliance)
- Verdächtige Aktivitäten werden automatisch erkannt

## Performance-Optimierung

### Caching

- Häufig verwendete Schlüssel werden für 5 Minuten gecacht
- LRU-Eviction bei Überschreitung der maximalen Cache-Größe
- Cache-Hit-Rate wird getrackt

### Indizes

Die Datenbank-Indizes sind optimiert für:
- Tenant-ID + Status
- Purpose
- Expires-At
- Audit-Log-Queries

## Monitoring

### Metriken

```typescript
const stats = await kms.getStats(tenantId);

console.log(stats.keysByStatus);      // Schlüssel nach Status
console.log(stats.cacheStats);        // Cache-Hit-Rate
console.log(stats.rotationStats);     // Rotation-Statistiken
```

### Health Check

```typescript
const health = await kms.keyCacheManager.healthCheck();
console.log(`Cache healthy: ${health.healthy}, Latency: ${health.latency}ms`);
```

## Automatische Rotation

### Cron-Job Setup

```typescript
import cron from 'node-cron';

// Täglich um 2:00 Uhr prüfen
cron.schedule('0 2 * * *', async () => {
  const report = await kms.keyRotationManager.checkAndRotateExpiredKeys();
  logger.info('Rotation check completed:', report);
});
```

## Backup und Recovery

### Backup erstellen

```typescript
const backupKey = encryptionService.generateKey();
const backup = await kms.exportKeys(tenantId, backupKey);

// Speichere Backup sicher (offline, verschlüsselt)
await saveBackup(backup, backupKey);
```

### Backup wiederherstellen

```typescript
const backup = await loadBackup(backupId);
const backupKey = await getBackupKey(backupId);

await kms.importKeys(backup, backupKey);
```

## Troubleshooting

### Master Key nicht gefunden

```
Error: Master encryption key not found in environment variables
```

**Lösung**: Setze `MASTER_ENCRYPTION_KEY` in `.env`

### Master Key ungültige Länge

```
Error: Master encryption key must be 64 hexadecimal characters
```

**Lösung**: Generiere einen neuen 256-bit Key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Cache-Verbindung fehlgeschlagen

```
Error: Failed to cache encryption key
```

**Lösung**: Prüfe Redis-Verbindung und `REDIS_URL`

### Schlüssel abgelaufen

```
Error: Key has expired
```

**Lösung**: Rotiere den Schlüssel oder erstelle einen neuen

## Best Practices

1. **Regelmäßige Rotation**: Aktiviere Auto-Rotation für alle Schlüssel
2. **Monitoring**: Überwache Cache-Hit-Rate und Rotation-Fehler
3. **Audit-Reviews**: Prüfe regelmäßig Audit-Logs auf verdächtige Aktivitäten
4. **Backup-Strategie**: Erstelle regelmäßige Backups aller Schlüssel
5. **Incident Response**: Definiere Prozess für kompromittierte Schlüssel

## Migration bestehender Daten

Für die Migration bestehender verschlüsselter Daten:

1. Erstelle neue Schlüssel im KMS
2. Entschlüssele Daten mit alten Schlüsseln
3. Verschlüssele Daten mit neuen KMS-Schlüsseln
4. Aktualisiere Referenzen (keyId, keyVersion)
5. Markiere alte Schlüssel als deprecated

## Support

Bei Fragen oder Problemen:
- Prüfe Logs: `services/backend/logs/`
- Prüfe Audit-Logs: `await kms.getAuditLog()`
- Kontaktiere Security-Team
