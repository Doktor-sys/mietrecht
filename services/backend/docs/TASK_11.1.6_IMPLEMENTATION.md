# Task 11.1.6: Key Rotation Manager - Implementierung

## Übersicht

Der Key Rotation Manager implementiert automatische und manuelle Schlüsselrotation mit Re-Encryption von Daten. Dies ist ein kritischer Bestandteil des Key Management Systems für die Sicherheit verschlüsselter Daten.

## Implementierte Komponenten

### 1. KeyRotationManager (services/backend/src/services/kms/KeyRotationManager.ts)

Der Hauptservice für Schlüsselrotation mit folgenden Funktionen:

#### Kern-Methoden

**`rotateKey(keyId, tenantId)`**
- Rotiert einen Schlüssel manuell
- Markiert den alten Schlüssel als `DEPRECATED`
- Gibt Metadaten des rotierten Schlüssels zurück
- Tenant-Isolation wird durchgesetzt

**`scheduleRotation(keyId, schedule)`**
- Plant automatische Rotation für einen Schlüssel
- Konfiguriert Intervall und nächsten Rotationszeitpunkt
- Erstellt oder aktualisiert Rotation Schedule in der Datenbank

**`checkAndRotateExpiredKeys()`**
- Prüft alle fälligen Rotation Schedules
- Rotiert abgelaufene Schlüssel automatisch
- Gibt detaillierten Report zurück (rotatedKeys, failedKeys, duration)
- Wird vom Cron-Job regelmäßig aufgerufen

**`reEncryptData(oldKeyId, newKeyId, dataRefs, encryptionCallback)`**
- Koordiniert Re-Encryption von Daten nach Rotation
- Verwendet Callback-Funktion für tatsächliche Verschlüsselung
- Trackt Erfolg/Fehler für jeden Datensatz
- Gibt detaillierte Statistiken zurück

#### Verwaltungs-Methoden

**`getRotationSchedule(keyId)`**
- Gibt Rotation Schedule für einen Schlüssel zurück

**`disableAutoRotation(keyId)`**
- Deaktiviert automatische Rotation

**`enableAutoRotation(keyId)`**
- Aktiviert automatische Rotation

**`listAutoRotationKeys(tenantId?)`**
- Listet alle Schlüssel mit aktivierter Auto-Rotation
- Optional gefiltert nach Tenant

**`getRotationStats(tenantId?)`**
- Gibt Statistiken über Rotationen zurück
- Zeigt totalScheduled, activeSchedules, upcomingRotations, overdueRotations

### 2. RotationCronJob (services/backend/src/services/kms/RotationCronJob.ts)

Automatisierte Ausführung der Schlüsselrotation:

#### Features

**Cron-basierte Ausführung**
- Standard: Täglich um 2 Uhr (konfigurierbar)
- Timezone: Europe/Berlin
- Verhindert parallele Ausführungen

**Status-Tracking**
- `isRunning`: Ob Cron-Job aktiv ist
- `isExecuting`: Ob gerade eine Rotation läuft
- `nextExecution`: Nächster geplanter Ausführungszeitpunkt

**Audit-Logging**
- Protokolliert jede Rotation-Ausführung
- Loggt Erfolge und Fehler
- Erstellt Security-Alerts bei Fehlern

#### Methoden

**`start(cronExpression)`**
- Startet den Cron-Job mit konfigurierbarem Schedule
- Standard: `'0 2 * * *'` (täglich um 2 Uhr)

**`stop()`**
- Stoppt den Cron-Job

**`executeRotation()`**
- Führt Rotation manuell aus (für Testing)
- Kann auch programmatisch getriggert werden

**`updateSchedule(cronExpression)`**
- Aktualisiert den Cron-Schedule zur Laufzeit

**`getStatus()`**
- Gibt aktuellen Status zurück

### 3. Factory-Funktion

**`createRotationCronJob(prisma, cronExpression?)`**
- Erstellt und startet Cron-Job automatisch
- Verwendet Konfiguration aus `config.kms.autoRotationEnabled`

## Konfiguration

### Umgebungsvariablen

```bash
# Automatische Rotation aktivieren
KMS_AUTO_ROTATION_ENABLED=true

# Standard-Rotationsintervall in Tagen
KMS_DEFAULT_ROTATION_DAYS=90

# Cron-Expression für Rotation-Job (optional)
# Standard: täglich um 2 Uhr
KMS_ROTATION_CRON="0 2 * * *"
```

### Cron-Expressions

Beispiele für verschiedene Schedules:

```bash
# Täglich um 2 Uhr
0 2 * * *

# Jeden Sonntag um 3 Uhr
0 3 * * 0

# Jeden ersten Tag des Monats um 1 Uhr
0 1 1 * *

# Alle 6 Stunden
0 */6 * * *

# Jede Stunde
0 * * * *
```

## Verwendung

### Manuelle Rotation

```typescript
import { KeyRotationManager } from './services/kms';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const rotationManager = new KeyRotationManager(prisma);

// Rotiere einen Schlüssel
const result = await rotationManager.rotateKey('key-123', 'tenant-1');
console.log(`Key rotated: ${result.id}, new status: ${result.status}`);
```

### Automatische Rotation planen

```typescript
// Schedule für 90-Tage-Rotation
const schedule = {
  enabled: true,
  intervalDays: 90,
  nextRotationAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
};

await rotationManager.scheduleRotation('key-123', schedule);
```

### Cron-Job starten

```typescript
import { createRotationCronJob } from './services/kms';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mit Standard-Schedule (täglich um 2 Uhr)
const cronJob = createRotationCronJob(prisma);

// Mit custom Schedule (alle 6 Stunden)
const cronJob = createRotationCronJob(prisma, '0 */6 * * *');

// Status prüfen
const status = cronJob.getStatus();
console.log('Cron job running:', status.isRunning);
console.log('Next execution:', status.nextExecution);

// Manuell ausführen
await cronJob.executeRotation();

// Stoppen
cronJob.stop();
```

### Re-Encryption nach Rotation

```typescript
import { EncryptionService } from './services/EncryptionService';

const encryptionService = new EncryptionService();

// Definiere Daten-Referenzen
const dataRefs = [
  {
    table: 'documents',
    column: 'encrypted_content',
    idColumn: 'id',
    ids: ['doc-1', 'doc-2', 'doc-3']
  },
  {
    table: 'users',
    column: 'encrypted_email',
    idColumn: 'id',
    ids: ['user-1', 'user-2']
  }
];

// Callback für Re-Encryption
const reEncryptCallback = async (
  oldKeyId: string,
  newKeyId: string,
  table: string,
  column: string,
  ids: string[]
) => {
  // Hole alte Daten
  const records = await prisma[table].findMany({
    where: { id: { in: ids } }
  });

  // Re-encrypt jeden Datensatz
  for (const record of records) {
    const decrypted = await encryptionService.decrypt(
      record[column],
      oldKeyId
    );
    
    const encrypted = await encryptionService.encrypt(
      decrypted,
      newKeyId
    );

    await prisma[table].update({
      where: { id: record.id },
      data: { [column]: encrypted }
    });
  }
};

// Führe Re-Encryption aus
await rotationManager.reEncryptData(
  'old-key-id',
  'new-key-id',
  dataRefs,
  reEncryptCallback
);
```

## Integration mit Server

In `src/index.ts`:

```typescript
import { createRotationCronJob } from './services/kms';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Starte Rotation Cron-Job
let rotationCronJob: RotationCronJob | null = null;

async function startServer() {
  // ... andere Initialisierungen

  // Starte Key Rotation Cron-Job
  if (config.kms.autoRotationEnabled) {
    rotationCronJob = createRotationCronJob(
      prisma,
      process.env.KMS_ROTATION_CRON
    );
    logger.info('Key rotation cron job started');
  }

  // ... Server starten
}

// Graceful Shutdown
process.on('SIGTERM', () => {
  if (rotationCronJob) {
    rotationCronJob.stop();
  }
  // ... andere Cleanup-Operationen
});
```

## Rotation-Workflow

### 1. Automatische Rotation

```
┌─────────────────────────────────────────────────────────────┐
│                    Cron-Job (täglich 2 Uhr)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         checkAndRotateExpiredKeys()                         │
│  - Finde fällige Rotation Schedules                         │
│  - Finde manuell abgelaufene Schlüssel                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Für jeden fälligen Schlüssel:                              │
│  1. rotateKey() - Markiere als DEPRECATED                   │
│  2. Erstelle neuen Schlüssel (KeyManagementService)         │
│  3. reEncryptData() - Re-encrypt Daten                      │
│  4. Aktualisiere Schedule                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Audit-Logging & Reporting                      │
│  - Logge Rotation-Events                                    │
│  - Erstelle Rotation-Report                                 │
│  - Warne bei Fehlern                                        │
└─────────────────────────────────────────────────────────────┘
```

### 2. Manuelle Rotation

```
┌─────────────────────────────────────────────────────────────┐
│              API-Call: POST /api/kms/rotate                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         rotateKey(keyId, tenantId)                          │
│  - Validiere Schlüssel                                      │
│  - Prüfe Status (muss ACTIVE sein)                          │
│  - Markiere als DEPRECATED                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│    KeyManagementService.createKey()                         │
│  - Erstelle neue Schlüsselversion                           │
│  - Inkrementiere Version                                    │
│  - Status: ACTIVE                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         reEncryptData() (optional)                          │
│  - Re-encrypt betroffene Daten                              │
│  - Verwende Callback-Funktion                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Audit-Logging                                  │
│  - Logge KEY_ROTATED Event                                  │
│  - Speichere alte und neue Key-ID                           │
└─────────────────────────────────────────────────────────────┘
```

## Sicherheitsüberlegungen

### 1. Tenant-Isolation

- Alle Rotation-Operationen prüfen Tenant-ID
- Verhindert Cross-Tenant-Zugriff
- Audit-Logs enthalten immer Tenant-ID

### 2. Status-Validierung

- Nur ACTIVE Schlüssel können rotiert werden
- DEPRECATED Schlüssel können nicht erneut rotiert werden
- COMPROMISED Schlüssel erfordern sofortige Rotation

### 3. Atomare Operationen

- Rotation ist transaktional
- Bei Fehler wird Rollback durchgeführt
- Alte Schlüssel bleiben verfügbar bis Re-Encryption abgeschlossen

### 4. Audit-Trail

- Jede Rotation wird protokolliert
- HMAC-signierte Audit-Logs
- Unveränderbare Historie

## Monitoring

### Metriken

```typescript
// Rotation-Statistiken abrufen
const stats = await rotationManager.getRotationStats('tenant-1');

console.log('Total scheduled:', stats.totalScheduled);
console.log('Active schedules:', stats.activeSchedules);
console.log('Upcoming rotations (7 days):', stats.upcomingRotations);
console.log('Overdue rotations:', stats.overdueRotations);
```

### Alerts

Empfohlene Alerts:

1. **Overdue Rotations**: Wenn `overdueRotations > 0`
2. **Failed Rotations**: Wenn `failedKeys.length > 0` im Report
3. **High Failure Rate**: Wenn > 10% der Rotationen fehlschlagen
4. **Cron-Job Down**: Wenn Cron-Job nicht läuft

### Logs

```typescript
// Rotation-Report
{
  rotatedKeys: ['key-1', 'key-2'],
  failedKeys: [],
  totalProcessed: 2,
  duration: 1234 // ms
}

// Re-Encryption-Statistiken
{
  totalRecords: 100,
  successfulRecords: 98,
  failedRecords: 2,
  successRate: '98.00%'
}
```

## Best Practices

### 1. Rotation-Intervalle

- **Hochsensible Daten**: 30-60 Tage
- **Standard-Daten**: 90 Tage
- **Archiv-Daten**: 180-365 Tage

### 2. Re-Encryption-Strategie

- **Batch-Processing**: Verarbeite Daten in Batches (z.B. 100 Datensätze)
- **Rate-Limiting**: Verhindere Datenbank-Überlastung
- **Retry-Logic**: Implementiere Retries für transiente Fehler

### 3. Cron-Schedule

- **Produktion**: Nachts (2-4 Uhr) wenn Last niedrig ist
- **Entwicklung**: Häufiger für Testing (z.B. stündlich)
- **Staging**: Ähnlich wie Produktion

### 4. Backup vor Rotation

```typescript
// Erstelle Backup vor Rotation
const backup = await keyManagementService.exportKeys('tenant-1');
await saveBackup(backup);

// Dann rotiere
await rotationManager.rotateKey('key-123', 'tenant-1');
```

## Troubleshooting

### Problem: Rotation schlägt fehl

**Lösung:**
```typescript
// Prüfe Schlüssel-Status
const key = await keyStorage.getKey('key-123', 'tenant-1');
console.log('Key status:', key.status);

// Prüfe Rotation Schedule
const schedule = await rotationManager.getRotationSchedule('key-123');
console.log('Schedule:', schedule);

// Prüfe Audit-Logs
const logs = await auditLogger.queryAuditLog({
  keyId: 'key-123',
  eventType: AuditEventType.KEY_ROTATED
});
```

### Problem: Re-Encryption dauert zu lange

**Lösung:**
- Implementiere Batch-Processing
- Verwende Parallelisierung
- Optimiere Datenbank-Queries
- Erwäge asynchrone Verarbeitung

### Problem: Cron-Job läuft nicht

**Lösung:**
```typescript
// Prüfe Status
const status = cronJob.getStatus();
console.log('Is running:', status.isRunning);

// Prüfe Konfiguration
console.log('Auto-rotation enabled:', config.kms.autoRotationEnabled);

// Manuell starten
cronJob.start();
```

## Testing

Tests sind in `src/tests/keyRotationManager.test.ts` implementiert:

```bash
# Alle Tests ausführen
npm test keyRotationManager

# Mit Coverage
npm test -- --coverage keyRotationManager

# Watch-Mode
npm test -- --watch keyRotationManager
```

## Nächste Schritte

Nach Implementierung von Task 11.1.6:

1. **Task 11.1.7**: KeyManagementService Hauptservice implementieren
2. **Task 11.1.10**: Error Handling und Validierung
3. **Task 11.1.13**: Monitoring und Health Checks

## Referenzen

- [NIST Key Management Guidelines](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [AWS KMS Key Rotation](https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html)
- [Cron Expression Format](https://crontab.guru/)

## Zusammenfassung

Der Key Rotation Manager bietet:
- ✅ Automatische und manuelle Schlüsselrotation
- ✅ Cron-basierte Ausführung
- ✅ Re-Encryption-Koordination
- ✅ Umfassende Audit-Logs
- ✅ Flexible Konfiguration
- ✅ Tenant-Isolation
- ✅ Fehlerbehandlung und Reporting
- ✅ Monitoring und Statistiken

Die Implementierung erfüllt Anforderungen 7.1 und 7.2 (Datenschutz und Sicherheit) durch regelmäßige Schlüsselrotation und sichere Re-Encryption.
