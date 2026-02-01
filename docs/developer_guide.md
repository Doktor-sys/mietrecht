# Entwicklerdokumentation des Mietrecht-Agenten

## Übersicht

Dieses Dokument richtet sich an Entwickler, die am Mietrecht-Agenten mitarbeiten möchten. Es enthält Informationen über die Codestruktur, Entwicklungsrichtlinien, Testverfahren und Bereitstellungsprozesse.

## Projektstruktur

```
mietrecht-agent/
├── scripts/                 # Hauptanwendungscode
│   ├── ai/                  # KI/NLP-Komponenten
│   ├── analytics/           # Analysemodule
│   ├── data_sources/        # Datenquellen-Clients
│   ├── database/            # Datenbankzugriff und -verwaltung
│   ├── filters/             # Entscheidungsfilter
│   ├── notifications/       # Benachrichtigungssystem
│   ├── public/              # Statische Webdateien
│   ├── analysis/            # Analysewerkzeuge
│   └── ...                  # Weitere Module
├── docs/                    # Dokumentation
├── tests/                   # Testdateien
├── coverage/                # Testabdeckungsberichte
└── package.json             # Projektmetadaten und Abhängigkeiten
```

## Codierungsstandards

### JavaScript-Standards

- **Sprachversion**: ECMAScript 2020 (ES11)
- **Stil**: Airbnb JavaScript Style Guide
- **Formatierung**: Prettier mit Standardkonfiguration
- **Linting**: ESLint mit airbnb-base Konfiguration

### Namenskonventionen

- **Variablen**: camelCase (z.B. `userProfile`)
- **Konstanten**: UPPER_SNAKE_CASE (z.B. `MAX_RETRY_COUNT`)
- **Funktionen**: camelCase (z.B. `processDecisionData`)
- **Klassen**: PascalCase (z.B. `DecisionProcessor`)
- **Dateien**: snake_case (z.B. `decision_processor.js`)
- **Verzeichnisse**: snake_case (z.B. `data_sources`)

### Kommentare und Dokumentation

- **JSDoc**: Für alle öffentlichen Funktionen und Klassen
- **Inline-Kommentare**: Für komplexe Logikabschnitte
- **Dateiüberschriften**: Kurze Beschreibung des Modulzwecks

### Beispiel für gut dokumentierten Code

```javascript
/**
 * Verarbeitet Gerichtsentscheidungsdaten
 * @param {Object} decision - Die zu verarbeitenden Entscheidungsdaten
 * @param {string} decision.id - Eindeutige ID der Entscheidung
 * @param {string} decision.text - Volltext der Entscheidung
 * @returns {Object} Verarbeitete Entscheidungsdaten
 * @throws {Error} Wenn die Entscheidungsdaten ungültig sind
 */
function processDecisionData(decision) {
  // Validierung der Eingabedaten
  if (!decision || !decision.id || !decision.text) {
    throw new Error('Ungültige Entscheidungsdaten bereitgestellt');
  }
  
  // Verarbeitungsschritte...
  const processedDecision = {
    id: decision.id,
    summary: summarizeText(decision.text),
    topics: extractTopics(decision.text),
    importance: assessImportance(decision)
  };
  
  return processedDecision;
}
```

## Modularchitektur

### Datenbankzugriff

Alle Datenbankoperationen erfolgen über Data Access Objects (DAOs):

```javascript
// Beispiel: Lawyer DAO
const { createLawyer, getLawyerById } = require('./database/dao/lawyerDao.js');

// Verwendung
const newLawyerId = await createLawyer({
  name: 'Max Mustermann',
  email: 'max@example.com',
  practice_areas: ['Mietrecht', 'Wohnungsrecht']
});

const lawyer = await getLawyerById(newLawyerId);
```

### Fehlerbehandlung

- **Asynchrone Operationen**: Verwenden von async/await mit try/catch
- **Fehlerprotokollierung**: Alle Fehler werden protokolliert
- **Benutzerfreundliche Fehlermeldungen**: Interne Fehlerdetails werden nicht an Benutzer weitergegeben

```javascript
async function fetchData() {
  try {
    const data = await apiCall();
    return data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Daten:', error.message);
    throw new Error('Daten konnten nicht abgerufen werden. Bitte versuchen Sie es später erneut.');
  }
}
```

## Testentwicklung

### Testarten

1. **Unit-Tests**: Testen einzelne Funktionen und Module isoliert
2. **Integrationstests**: Testen die Zusammenarbeit zwischen Modulen
3. **End-to-End-Tests**: Testen den kompletten Workflow

### Testframework

- **Framework**: Jest
- **Mocking**: Jest Mock Functions
- **Assertions**: Jest Expect

### Beispiel für einen Unit-Test

```javascript
// decisionProcessor.test.js
const { processDecisionData } = require('../decisionProcessor.js');

describe('Decision Processor', () => {
  test('should process valid decision data', async () => {
    const inputData = {
      id: 'TEST-001',
      text: 'Dies ist ein Testentscheidungstext.'
    };
    
    const result = await processDecisionData(inputData);
    
    expect(result).toHaveProperty('id', 'TEST-001');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('topics');
    expect(result).toHaveProperty('importance');
  });
  
  test('should throw error for invalid input', async () => {
    const invalidInput = {};
    
    await expect(processDecisionData(invalidInput))
      .rejects
      .toThrow('Ungültige Entscheidungsdaten bereitgestellt');
  });
});
```

## Entwicklungsumgebung

### Voraussetzungen

- **Node.js**: Version 18.x oder höher
- **npm**: Version 8.x oder höher
- **SQLite**: Version 3.35 oder höher

### Setup

1. Repository klonen
2. `npm install` ausführen
3. Datenbank initialisieren mit `node scripts/database/init/initDb.js`
4. Entwicklungsserver starten mit `npm run dev`

### Nützliche npm-Skripte

```bash
# Alle Tests ausführen
npm test

# Unit-Tests ausführen
npm run test:unit

# Integrationstests ausführen
npm run test:integration

# Testabdeckung generieren
npm run test:coverage

# Entwicklungsserver starten
npm run dev

# Produktionsversion starten
npm start
```

## Versionskontrolle

### Branching-Strategie

- **main**: Stabile Produktionsversion
- **develop**: Aktuelle Entwicklungsversion
- **feature/**: Feature-Branches für neue Funktionen
- **hotfix/**: Hotfix-Branches für dringende Fehlerbehebungen
- **release/**: Release-Branches für neue Versionen

### Commit-Nachrichten

- **Format**: `<Typ>: <Beschreibung>`
- **Typen**: feat, fix, docs, style, refactor, test, chore
- **Sprache**: Deutsch

Beispiele:
```
feat: Neue BGH-API-Integration hinzugefügt
fix: Fehler in der Entscheidungsfilterung behoben
docs: Entwicklerdokumentation aktualisiert
```

## CI/CD-Pipeline

### Kontinuierliche Integration

1. **Code-Linting**: Automatische Überprüfung der Codestandards
2. **Testausführung**: Automatische Ausführung aller Tests
3. **Testabdeckung**: Überprüfung der Mindestabdeckung (80%)

### Bereitstellung

1. **Staging-Umgebung**: Automatische Bereitstellung nach erfolgreichen Tests
2. **Produktionsumgebung**: Manuelles Deployment nach Überprüfung

## Leistungsüberwachung

### Logging

- **Protokollebene**: info, warn, error
- **Format**: Strukturierte JSON-Protokolle
- **Aufbewahrung**: 30 Tage für Produktionsumgebung

### Metriken

- **Antwortzeiten**: Durchschnittliche API-Antwortzeiten
- **Fehlerraten**: Prozentuale Fehlerquote
- **Durchsatz**: Anzahl der verarbeiteten Entscheidungen pro Stunde

## Sicherheitsrichtlinien

### Datenverarbeitung

- **Verschlüsselung**: Alle sensiblen Daten werden verschlüsselt gespeichert
- **Zugriffskontrolle**: Rollenbasierte Zugriffsrechte
- **Audit-Trail**: Vollständige Protokollierung aller Datenzugriffe

### Externe Abhängigkeiten

- **Überprüfung**: Regelmäßige Sicherheitsüberprüfungen mit npm audit
- **Aktualisierung**: Automatische Aktualisierung bekannter Sicherheitslücken
- **Whitelisting**: Nur genehmigte externe Pakete dürfen verwendet werden

## Fehlerbehebung

### Häufige Probleme

1. **Datenbankverbindungsfehler**
   - Lösung: Überprüfung der Datenbankkonfiguration
   - Lösung: Neustart des Datenbankdienstes

2. **API-Ratenbegrenzung**
   - Lösung: Implementierung von Retry-Logik mit exponentiellem Backoff
   - Lösung: Anpassung der Abfragehäufigkeit

3. **Speicherprobleme**
   - Lösung: Implementierung von Stream-Verarbeitung für große Datenmengen
   - Lösung: Regelmäßige Speicherbereinigung

### Debugging-Werkzeuge

- **Node.js Inspector**: Für das Debuggen von Node.js-Anwendungen
- **SQLite Browser**: Zum Untersuchen der Datenbankinhalte
- **Postman**: Zum Testen von API-Endpunkten

## Erweiterbarkeit

### Neue Datenquellen hinzufügen

1. Erstellen eines neuen Client-Moduls im `data_sources`-Verzeichnis
2. Implementierung der erforderlichen Schnittstellenmethoden
3. Integration in den Hauptdatenabrufprozess
4. Hinzufügen von Unit-Tests

### Neue Analysefunktionen

1. Erstellen eines neuen Moduls im `analytics`-Verzeichnis
2. Implementierung der Analysefunktionen
3. Integration in den Analyseworkflow
4. Hinzufügen von Tests und Dokumentation

## Beitrag zur Weiterentwicklung

### Pull Requests

1. Fork des Repositories erstellen
2. Feature-Branch erstellen
3. Änderungen implementieren und testen
4. Dokumentation aktualisieren
5. Pull Request erstellen

### Code Review

- **Mindestanzahl**: Zwei Genehmigungen erforderlich
- **Checkliste**: 
  - Funktionale Korrektheit
  - Testabdeckung
  - Codestil
  - Dokumentation
  - Sicherheitsaspekte