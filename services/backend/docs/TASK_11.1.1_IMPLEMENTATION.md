# Task 11.1.1 Implementation: Datenbank-Schema für KMS

## Übersicht

Task 11.1.1 "Datenbank-Schema für KMS erstellen" wurde erfolgreich implementiert. Das Key Management System (KMS) Datenbankschema ist vollständig definiert und optimiert für Performance und Sicherheit.

## Implementierte Komponenten

### 1. EncryptionKey Model

**Zweck:** Speicherung verschlüsselter Datenverschlüsselungsschlüssel (DEKs)

**Felder:**
- `id` - Eindeutige ID (CUID)
- `tenantId` - Mandanten-ID für Multi-Tenancy
- `purpose` - Verwendungszweck (data_encryption, document_encryption, etc.)
- `algorithm` - Verschlüsselungsalgorithmus (Standard: aes-256-gcm)
- `encryptedKey` - Mit Master Key verschlüsselter DEK
- `iv` - Initialization Vector
- `authTag` - Authentication Tag für GCM
- `version` - Schlüsselversion für Rotation
- `status` - Status (active, deprecated, disabled, compromised, deleted)
- `expiresAt` - Ablaufdatum (optional)
- `lastUsedAt` - Letzter Zugriff
- `metadata` - Zusätzliche Metadaten (JSON)

**Indizes:**
- `(tenantId, status)` - Für Tenant-spezifische Abfragen
- `(status)` - Für Status-Filterung
- `(expiresAt)` - Für Ablauf-Checks
- `(purpose)` - Für Purpose-basierte Suche

**Constraints:**
- Unique: `(tenantId, purpose, version)` - Verhindert Duplikate

### 2. RotationSchedule Model

**Zweck:** Automatische Schlüsselrotation planen und verwalten

**Felder:**
- `id` - Eindeutige ID
- `keyId` - Referenz zu EncryptionKey (Unique)
- `enabled` - Rotation aktiviert/deaktiviert
- `intervalDays` - Rotationsintervall in Tagen
- `nextRotationAt` - Nächster Rotationszeitpunkt
- `lastRotationAt` - Letzter Rotationszeitpunkt

**Indizes:**
- `(nextRotationAt, enabled)` - Für Cron-Job-Abfragen

**Beziehungen:**
- Foreign Key zu `encryption_keys` mit CASCADE DELETE

### 3. KeyAuditLog Model

**Zweck:** Vollständige Audit-Trail für alle Schlüsseloperationen

**Felder:**
- `id` - Eindeutige ID
- `keyId` - Referenz zu EncryptionKey
- `tenantId` - Mandanten-ID
- `eventType` - Event-Typ (key_created, key_accessed, key_rotated, etc.)
- `action` - Durchgeführte Aktion
- `result` - Ergebnis (success/failure)
- `serviceId` - Service-Identifier
- `userId` - Benutzer-ID (optional)
- `ipAddress` - IP-Adresse (optional)
- `metadata` - Zusätzliche Event-Daten (JSON)
- `hmacSignature` - HMAC für Integritätsprüfung
- `timestamp` - Zeitstempel

**Indizes:**
- `(keyId, timestamp)` - Für Key-spezifische Audit-Logs
- `(tenantId, timestamp)` - Für Tenant-spezifische Audits
- `(eventType, timestamp)` - Für Event-basierte Abfragen
- `(timestamp)` - Für zeitbasierte Abfragen


### 4. MasterKeyConfig Model

**Zweck:** Konfiguration des Master Keys (nur ein Eintrag)

**Felder:**
- `id` - Eindeutige ID
- `version` - Master Key Version
- `algorithm` - Verschlüsselungsalgorithmus
- `rotatedAt` - Letzter Rotationszeitpunkt
- `createdAt` - Erstellungszeitpunkt
- `updatedAt` - Aktualisierungszeitpunkt

## Performance-Optimierungen

### Indexstrategie

1. **Tenant-Isolation:** Index auf `(tenantId, status)` ermöglicht schnelle Abfragen pro Mandant
2. **Status-Filterung:** Separater Index auf `status` für globale Status-Abfragen
3. **Ablauf-Checks:** Index auf `expiresAt` für effiziente Cleanup-Jobs
4. **Audit-Abfragen:** Mehrere Indizes auf `key_audit_logs` für verschiedene Abfragemuster
5. **Rotation-Jobs:** Index auf `(nextRotationAt, enabled)` für Cron-Job-Performance

### Query-Optimierung

- Alle häufigen Abfragemuster sind durch Indizes abgedeckt
- Foreign Keys mit CASCADE DELETE für automatisches Cleanup
- JSONB-Felder für flexible Metadaten ohne Schema-Änderungen

## Sicherheitsfeatures

### Envelope Encryption

- DEKs werden mit Master Key verschlüsselt gespeichert
- Master Key wird nie in der Datenbank gespeichert
- Jeder DEK hat eigenen IV und AuthTag

### Tenant-Isolation

- Alle Keys sind mandantenspezifisch
- Unique Constraint verhindert Konflikte
- Audit-Logs tracken alle Zugriffe pro Tenant

### Audit-Trail

- Vollständige Nachverfolgbarkeit aller Operationen
- HMAC-Signierung für Integritätsprüfung
- Unveränderliche Log-Einträge

### Key-Lifecycle

- Status-Management (active, deprecated, disabled, compromised, deleted)
- Automatische Rotation mit Scheduling
- Ablaufdatum für zeitlich begrenzte Keys

## Migration

Die Migration `20241112000002_add_kms_tables` erstellt:

1. Alle vier KMS-Tabellen
2. Alle Performance-Indizes
3. Foreign Key Constraints
4. Unique Constraints

**Migration ausführen:**
```bash
cd services/backend
npx prisma migrate deploy
```

## Tests

Umfassende Test-Suite in `src/tests/kms-schema.test.ts`:

### Schema-Tests
- Überprüfung aller Tabellen und Felder
- Validierung aller Indizes
- Überprüfung aller Constraints

### CRUD-Tests
- Erstellen von Encryption Keys
- Erstellen mit Rotation Schedule
- Erstellen von Audit Logs
- Abfragen mit verschiedenen Filtern

### Performance-Tests
- Index-Performance-Validierung
- Bulk-Insert-Tests
- Query-Performance-Messungen

### Constraint-Tests
- Unique Constraint Validierung
- Foreign Key Cascade-Tests

## Verwendung

### Encryption Key erstellen

```typescript
const key = await prisma.encryptionKey.create({
  data: {
    tenantId: 'tenant-123',
    purpose: 'document_encryption',
    algorithm: 'aes-256-gcm',
    encryptedKey: encryptedDEK,
    iv: initializationVector,
    authTag: authenticationTag,
    version: 1,
    status: 'active'
  }
});
```

### Key mit Rotation Schedule

```typescript
const key = await prisma.encryptionKey.create({
  data: {
    tenantId: 'tenant-123',
    purpose: 'data_encryption',
    algorithm: 'aes-256-gcm',
    encryptedKey: encryptedDEK,
    iv: initializationVector,
    authTag: authenticationTag,
    version: 1,
    status: 'active',
    rotationSchedule: {
      create: {
        enabled: true,
        intervalDays: 90,
        nextRotationAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    }
  },
  include: {
    rotationSchedule: true
  }
});
```

### Audit Log erstellen

```typescript
await prisma.keyAuditLog.create({
  data: {
    keyId: key.id,
    tenantId: 'tenant-123',
    eventType: 'key_accessed',
    action: 'DECRYPT_DATA',
    result: 'success',
    serviceId: 'document-service',
    userId: 'user-456',
    ipAddress: '192.168.1.1',
    hmacSignature: calculateHMAC(logData)
  }
});
```

### Keys abfragen

```typescript
// Aktive Keys für Tenant
const activeKeys = await prisma.encryptionKey.findMany({
  where: {
    tenantId: 'tenant-123',
    status: 'active'
  },
  include: {
    rotationSchedule: true
  }
});

// Keys die bald ablaufen
const expiringKeys = await prisma.encryptionKey.findMany({
  where: {
    expiresAt: {
      lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Tage
    },
    status: 'active'
  }
});

// Audit Logs für Key
const auditLogs = await prisma.keyAuditLog.findMany({
  where: {
    keyId: 'key-123'
  },
  orderBy: {
    timestamp: 'desc'
  },
  take: 100
});
```

## Erfüllte Anforderungen

✅ **Anforderung 7.1:** Ende-zu-Ende-Verschlüsselung
- Envelope Encryption Schema implementiert
- Sichere Speicherung verschlüsselter DEKs

✅ **Anforderung 7.2:** Key Management
- Vollständiges Key-Lifecycle-Management
- Automatische Rotation mit Scheduling
- Version-Management für Keys

✅ **Anforderung 7.4:** Audit und Compliance
- Vollständiger Audit-Trail
- HMAC-Signierung für Integrität
- Tenant-spezifische Logs

## Nächste Schritte

Task 11.1.1 ist vollständig implementiert. Die nächsten Tasks bauen auf diesem Schema auf:

1. **Task 11.1.2:** Master Key Manager implementieren
2. **Task 11.1.3:** Key Storage Layer implementieren
3. **Task 11.1.4:** Key Cache Manager mit Redis implementieren
4. **Task 11.1.5:** Audit Logger für Compliance implementieren
5. **Task 11.1.6:** Key Rotation Manager implementieren
6. **Task 11.1.7:** KeyManagementService Hauptservice implementieren

## Technische Spezifikationen

### Datenbank-Anforderungen
- PostgreSQL 12+
- JSONB-Support für Metadaten
- Unterstützung für Cascade Delete

### Performance-Ziele
- < 10ms für Key-Lookup mit Index
- < 50ms für Audit-Log-Abfragen
- Unterstützung für 10.000+ Keys pro Tenant

### Skalierung
- Horizontal skalierbar durch Tenant-Isolation
- Partitionierung möglich nach tenantId
- Archivierung alter Audit-Logs möglich

Task 11.1.1 ist erfolgreich abgeschlossen! ✅
