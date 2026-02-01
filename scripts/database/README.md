# Datenbankimplementierung für den Mietrecht-Agenten

## Übersicht

Diese Dokumentation beschreibt die Implementierung der Datenbank für den Mietrecht-Agenten. Die Datenbank verwendet SQLite als Speicherlösung und bietet persistente Speicherung für Konfigurationen, Anwälte, Gerichtsentscheidungen, Dashboard-Metriken, Systemprotokolle und Datenquellenstatus.

## Datenbankschema

### Tabellen

1. **config** - Speichert die Anwendungskonfiguration
2. **lawyers** - Speichert Informationen über Anwälte
3. **lawyer_preferences** - Speichert Präferenzen für jeden Anwalt
4. **court_decisions** - Speichert Informationen über Gerichtsentscheidungen
5. **dashboard_metrics** - Speichert Dashboard-Metriken für historische Nachverfolgung
6. **system_logs** - Speichert Systemprotokolle
7. **data_source_status** - Speichert den Status der Datenquellen

## Datenzugriffsobjekte (DAOs)

Die Datenzugriffsobjekte bieten eine Abstraktionsschicht für den Zugriff auf die Datenbanktabellen:

1. **configDao.js** - Für Konfigurationsdaten
2. **lawyerDao.js** - Für Anwaltsdaten und Präferenzen
3. **courtDecisionDao.js** - Für Gerichtsentscheidungen
4. **dashboardMetricsDao.js** - Für Dashboard-Metriken
5. **systemLogDao.js** - Für Systemprotokolle
6. **dataSourceStatusDao.js** - Für Datenquellenstatus

## Verwendung

### Datenbankinitialisierung

Die Datenbank wird beim Start der Anwendung automatisch initialisiert. Das Schema wird erstellt und ggf. fehlende Tabellen werden angelegt.

### Datenzugriff

Alle Datenzugriffe erfolgen über die entsprechenden DAO-Module. Beispiel:

```javascript
const { getAllLawyers } = require('./database/dao/lawyerDao.js');

async function example() {
  const lawyers = await getAllLawyers();
  console.log(lawyers);
}
```

## Tests

Ein Testskript ist verfügbar unter `scripts/database/testDatabase.js`, um die Datenbankfunktionalität zu überprüfen.