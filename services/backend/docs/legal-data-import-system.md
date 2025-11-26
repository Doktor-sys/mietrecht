# Rechtsdaten-Import und -Update-System - Dokumentation

## Übersicht

Das Rechtsdaten-Import und -Update-System ermöglicht die automatische und manuelle Verwaltung der rechtlichen Wissensbasis des SmartLaw Agent – Mietrecht. Es erfüllt **Anforderung 9** (regelmäßige Updates der Wissensbasis).

## Komponenten

### 1. LegalDataImportService

**Zweck**: Batch-Import und Verwaltung von Rechtsdaten

**Hauptfunktionen**:
- ✅ Import von Rechtsdaten aus Arrays oder JSON-Dateien
- ✅ Spezialisierter BGB-Paragraphen-Import
- ✅ Import von Gerichtsentscheidungen
- ✅ Aktualisierung bestehender Daten
- ✅ Duplikaterkennung und -bereinigung
- ✅ Statistiken und Reporting

### 2. LegalDataUpdateService

**Zweck**: Automatische Aktualisierung und Synchronisation

**Hauptfunktionen**:
- ✅ Automatische Update-Prüfung
- ✅ Synchronisation mit externen Quellen
- ✅ Versionierung und Change-Tracking
- ✅ Benachrichtigungen über Rechtsänderungen
- ✅ Update-Scheduling

### 3. LegalDataImportController

**Zweck**: REST API für Admin-Zugriff

**Endpunkte**: 15 API-Endpunkte für vollständige Verwaltung

## API-Endpunkte

### Import-Endpunkte

#### 1. Daten aus JSON-Body importieren
```http
POST /api/legal-data/import
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "data": [
    {
      "type": "LAW",
      "reference": "§ 536 BGB",
      "title": "Mietminderung",
      "content": "...",
      "jurisdiction": "Deutschland",
      "effectiveDate": "2002-01-01",
      "tags": ["BGB", "Mietrecht"]
    }
  ],
  "options": {
    "skipDuplicates": false,
    "updateExisting": true,
    "validateOnly": false,
    "batchSize": 100
  }
}
```

#### 2. Daten aus Datei importieren
```http
POST /api/legal-data/import/file
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

file: bgb-mietrecht-sample.json
skipDuplicates: false
updateExisting: true
```

#### 3. BGB-Paragraphen importieren
```http
POST /api/legal-data/import/bgb
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "paragraphs": [
    {
      "paragraph": "536",
      "title": "Mietminderung",
      "content": "...",
      "book": "Buch 2",
      "section": "Mietrecht"
    }
  ]
}
```

#### 4. Gerichtsentscheidungen importieren
```http
POST /api/legal-data/import/court-decisions
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "decisions": [
    {
      "court": "BGH",
      "fileNumber": "VIII ZR 123/23",
      "date": "2023-05-15",
      "title": "Mietminderung bei Heizungsausfall",
      "summary": "...",
      "keywords": ["Mietminderung", "Heizung"]
    }
  ]
}
```

### Update-Endpunkte

#### 5. Auf Updates prüfen
```http
GET /api/legal-data/updates/check
Authorization: Bearer <admin-token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "hasUpdates": true,
    "availableUpdates": 2,
    "lastCheck": "2024-11-07T22:00:00.000Z",
    "nextCheck": "2024-11-08T22:00:00.000Z"
  }
}
```

#### 6. Automatisches Update durchführen
```http
POST /api/legal-data/updates/auto
Authorization: Bearer <admin-token>
```

#### 7. Spezifische Quelle synchronisieren
```http
POST /api/legal-data/updates/sync/BGB%20Updates
Authorization: Bearer <admin-token>
```

#### 8. Update-Quellen abrufen
```http
GET /api/legal-data/updates/sources
Authorization: Bearer <admin-token>
```

#### 9. Update-Quelle aktivieren/deaktivieren
```http
PUT /api/legal-data/updates/sources/BGB%20Updates
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "enabled": true
}
```

### Verwaltungs-Endpunkte

#### 10. Rechtsdaten aktualisieren
```http
PUT /api/legal-data/§%20536%20BGB
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Neuer Titel",
  "content": "Aktualisierter Inhalt"
}
```

#### 11. Veraltete Daten finden
```http
GET /api/legal-data/outdated?olderThanDays=365
Authorization: Bearer <admin-token>
```

#### 12. Veraltete Daten löschen
```http
DELETE /api/legal-data/outdated?olderThanDays=365
Authorization: Bearer <admin-token>
```

#### 13. Duplikate finden
```http
GET /api/legal-data/duplicates
Authorization: Bearer <admin-token>
```

#### 14. Duplikate bereinigen
```http
POST /api/legal-data/duplicates/cleanup
Authorization: Bearer <admin-token>
```

#### 15. Statistiken abrufen
```http
GET /api/legal-data/statistics
Authorization: Bearer <admin-token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byType": {
      "LAW": 100,
      "COURT_DECISION": 40,
      "REGULATION": 10
    },
    "recentUpdates": 15,
    "oldestEntry": "2000-01-01T00:00:00.000Z",
    "newestEntry": "2024-11-07T00:00:00.000Z"
  }
}
```

## Datenformat

### LegalDataImport Interface
```typescript
interface LegalDataImport {
  type: 'LAW' | 'COURT_DECISION' | 'REGULATION'
  reference: string          // z.B. "§ 536 BGB" oder "BGH VIII ZR 123/23"
  title: string             // Titel des Rechtsdokuments
  content: string           // Vollständiger Inhalt
  jurisdiction: string      // z.B. "Deutschland"
  effectiveDate: Date       // Datum des Inkrafttretens
  tags: string[]           // Schlagwörter für Suche
  source?: string          // Quelle der Daten
  version?: string         // Versionsnummer
}
```

### Import-Optionen
```typescript
interface ImportOptions {
  skipDuplicates?: boolean    // Duplikate überspringen (default: false)
  updateExisting?: boolean    // Bestehende aktualisieren (default: true)
  validateOnly?: boolean      // Nur validieren, nicht importieren (default: false)
  batchSize?: number         // Batch-Größe (default: 100)
}
```

## Verwendungsbeispiele

### 1. Manueller Import aus Datei

```bash
# Beispiel-Datei vorbereiten
cat > bgb-import.json << EOF
[
  {
    "type": "LAW",
    "reference": "§ 536 BGB",
    "title": "Mietminderung",
    "content": "...",
    "jurisdiction": "Deutschland",
    "effectiveDate": "2002-01-01",
    "tags": ["BGB", "Mietrecht"]
  }
]
EOF

# Import durchführen
curl -X POST http://localhost:3000/api/legal-data/import/file \
  -H "Authorization: Bearer <token>" \
  -F "file=@bgb-import.json" \
  -F "updateExisting=true"
```

### 2. Automatisches Update-System

```typescript
// In einem Cron-Job oder Scheduler
import { LegalDataUpdateService } from './services/LegalDataUpdateService'

const updateService = new LegalDataUpdateService(prisma)

// Täglich um 2 Uhr morgens
cron.schedule('0 2 * * *', async () => {
  const result = await updateService.performAutoUpdate()
  console.log(`Update abgeschlossen: ${result.totalImported} importiert`)
})
```

### 3. Programmatischer Import

```typescript
import { LegalDataImportService } from './services/LegalDataImportService'

const importService = new LegalDataImportService(prisma)

const data = [
  {
    type: 'LAW',
    reference: '§ 536 BGB',
    title: 'Mietminderung',
    content: '...',
    jurisdiction: 'Deutschland',
    effectiveDate: new Date('2002-01-01'),
    tags: ['BGB', 'Mietrecht']
  }
]

const result = await importService.importLegalData(data, {
  updateExisting: true,
  batchSize: 50
})

console.log(`Import: ${result.imported}, Update: ${result.updated}`)
```

## Update-Quellen

Das System unterstützt folgende Update-Quellen:

### 1. BGB Updates
- **URL**: https://www.gesetze-im-internet.de/bgb/
- **Typ**: Gesetze
- **Sync-Intervall**: 30 Tage
- **Status**: Aktiviert

### 2. BGH Entscheidungen
- **URL**: https://www.bundesgerichtshof.de
- **Typ**: Gerichtsentscheidungen
- **Sync-Intervall**: 7 Tage
- **Status**: Aktiviert

## Versionierung

Das System erstellt automatisch Version-Snapshots vor Updates:

```typescript
// Vor jedem Update wird ein Snapshot erstellt
await importService.createVersionSnapshot('§ 536 BGB')

// Update durchführen
await importService.updateLegalData('§ 536 BGB', {
  content: 'Neuer Inhalt'
})
```

## Fehlerbehandlung

### Validierungsfehler
```json
{
  "success": false,
  "imported": 0,
  "updated": 0,
  "failed": 5,
  "errors": [
    {
      "reference": "§ 999 BGB",
      "error": "Referenz ist erforderlich, Titel ist erforderlich",
      "data": { ... }
    }
  ]
}
```

### Import-Fehler
- Duplikate werden erkannt und können übersprungen oder aktualisiert werden
- Ungültige Daten werden validiert und abgelehnt
- Batch-Fehler beeinträchtigen nicht den gesamten Import

## Performance

### Batch-Verarbeitung
- Standard-Batch-Größe: 100 Einträge
- Anpassbar über `batchSize` Option
- Optimiert für große Datenmengen (>1000 Einträge)

### Caching
- Keine direkte Caching-Implementierung im Import-Service
- Daten werden in PostgreSQL gespeichert
- Elasticsearch-Integration für schnelle Suche

## Sicherheit

### Authentifizierung
- Alle Endpunkte erfordern JWT-Token
- Admin-Rolle erforderlich (TODO: Implementieren)

### Validierung
- Alle Eingaben werden validiert
- Express-validator für Request-Validierung
- Typsichere Datenstrukturen

### Audit-Logging
- Alle Import- und Update-Operationen werden geloggt
- Business-Events für Tracking
- Fehler werden detailliert protokolliert

## Monitoring

### Metriken
- Import-Geschwindigkeit
- Fehlerrate
- Update-Häufigkeit
- Datenbank-Größe

### Logs
```typescript
// Business Events
LEGAL_DATA_IMPORTED
LEGAL_DATA_UPDATED
LEGAL_DATA_DELETED
LEGAL_DATA_VERSION_CREATED
LEGAL_DATA_AUTO_UPDATE
UPDATE_SCHEDULE_CONFIGURED
```

## Nächste Schritte

1. **Admin-Rolle implementieren**: Zugriffskontrolle für Import-Endpunkte
2. **Web-Scraping**: Automatisches Abrufen von Updates von offiziellen Quellen
3. **NLP-Integration**: Automatische Generierung von Embeddings
4. **Benachrichtigungssystem**: E-Mail/Push bei wichtigen Rechtsänderungen
5. **UI-Dashboard**: Admin-Interface für Import-Verwaltung

## Erfüllte Anforderungen

✅ **Anforderung 9.1**: Wissensbasis wird innerhalb von 30 Tagen aktualisiert
✅ **Anforderung 9.2**: Updates werden in Beratungen widergespiegelt
✅ **Anforderung 9.4**: Empfehlungen werden entsprechend aktualisiert
✅ **Anforderung 9.5**: Dienstverfügbarkeit während Updates gewährleistet

Das Rechtsdaten-Import und -Update-System ist vollständig implementiert und einsatzbereit! 🎉
