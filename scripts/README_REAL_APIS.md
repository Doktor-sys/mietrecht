# Mietrecht Agent mit Echten API-Verbindungen

Diese Dokumentation beschreibt die Implementierung echter API-Verbindungen für den Mietrecht Agenten, die eine vollständige Automation des Workflows ermöglichen.

## Übersicht

Der Mietrecht Agent mit echten API-Verbindungen verwendet jetzt echte Schnittstellen zu verschiedenen rechtlichen Datenquellen und Projektmanagement-Tools:

1. **Echte Datenquellen** - Verbindung zu BGH, Landgerichten, BVerfG und Beck-Online
2. **KI-gestützte Inhaltsverarbeitung** - Automatische Analyse und Zusammenfassung von Entscheidungen
3. **Asana-Integration** - Erstellung von Aufgaben basierend auf wichtigen Entscheidungen
4. **GitHub-Integration** - Erstellung von Issues für rechtliche Auswirkungen

## Funktionen

### Echte Datenquellen

Die Datenquellen verwenden jetzt echte APIs und Webseiten, um aktuelle Gerichtsentscheidungen abzurufen:

- **BGH-Datenbank**: Direkte Verbindung zur BGH-Rechtsprechungsdatenbank
- **Landgerichte**: Zugriff auf regionale Gerichtsdatenbanken
- **BVerfG**: Verbindung zur Bundesverfassungsgericht-Datenbank
- **Beck-Online**: Integration mit der führenden juristischen Datenbank

### Asana-Integration

Die Asana-Integration verwendet die echte Asana API für die Aufgabenerstellung:

- **Authentifizierung**: Sicherer Zugriff über API-Token
- **Projektintegration**: Automatische Zuordnung zu festgelegten Projekten
- **Aufgabenverwaltung**: Vollständige CRUD-Operationen für Aufgaben

### GitHub-Integration

Die GitHub-Integration verwendet die echte GitHub API für die Issue-Erstellung:

- **Repository-Integration**: Verbindung zu spezifischen Repositories
- **Issue-Management**: Vollständige CRUD-Operationen für Issues
- **Labeling-System**: Automatische Kategorisierung durch Labels

## Verwendung

### Umgebungsvariablen

Für die Integration mit externen Systemen müssen folgende Umgebungsvariablen gesetzt werden:

```bash
# Asana-Konfiguration
ASANA_API_KEY=dein_asana_api_schlüssel
ASANA_PROJECT_ID=deine_projekt_id
ASANA_WORKSPACE_ID=deine_workspace_id

# GitHub-Konfiguration
GITHUB_TOKEN=dein_github_token
GITHUB_REPO_OWNER=dein_repo_besitzer
GITHUB_REPO_NAME=dein_repo_name

# Beck-Online-Konfiguration (optional)
BECK_ONLINE_API_KEY=dein_beck_online_api_schlüssel
```

### Ausführung des Agents

```bash
# Starte den Mietrecht-Agenten mit echten API-Verbindungen
npm run mietrecht-agent-real-data
```

### Ausführung der Tests

```bash
# Teste die echten API-Verbindungen
npm run test-real-api-connections

# Teste die Asana-Integration
npm run test-asana

# Teste die GitHub-Integration
npm run test-github
```

## Module

### BGH API Client (`bgh_api_client.js`)

- `searchDecisions(options)` - Durchsucht die BGH-Datenbank
- `getDecisionDetails(decisionId)` - Ruft detaillierte Informationen zu einer Entscheidung ab

### Datenquellen (`mietrecht_data_sources.js`)

- `fetchBGHDecisions(options)` - Ruft Entscheidungen vom BGH ab
- `fetchLandgerichtDecisions(options)` - Ruft Entscheidungen von Landgerichten ab
- `fetchBVerfGDecisions(options)` - Ruft Entscheidungen vom BVerfG ab
- `fetchBeckOnlineData(options)` - Ruft Daten von Beck-Online ab
- `fetchAllCourtDecisions(options)` - Ruft Entscheidungen von allen Quellen ab

### Asana-Integration (`asana_integration.js`)

- `createAsanaTask(taskData)` - Erstellt eine neue Aufgabe in Asana
- `updateAsanaTask(taskId, taskData)` - Aktualisiert eine bestehende Aufgabe
- `addCommentToAsanaTask(taskId, comment)` - Fügt einen Kommentar zu einer Aufgabe hinzu
- `createTasksForDecisions(decisions)` - Erstellt Aufgaben für mehrere Entscheidungen

### GitHub-Integration (`github_integration.js`)

- `createGitHubIssue(issueData)` - Erstellt ein neues Issue in GitHub
- `createIssuesForDecisions(decisions)` - Erstellt Issues für mehrere Entscheidungen
- `addCommentToGitHubIssue(issueNumber, comment)` - Fügt einen Kommentar zu einem Issue hinzu
- `updateGitHubIssue(issueNumber, issueData)` - Aktualisiert ein bestehendes Issue

## Entwicklung

### Abhängigkeiten

- axios: Für HTTP-Anfragen an die APIs
- cheerio: Für das Parsen von HTML-Inhalten
- Alle anderen Abhängigkeiten aus vorhergehenden Phasen

### Testskripte

- `test_real_api_connections.js` - Testet die echten API-Verbindungen
- `test_asana_integration.js` - Testet die Asana-Integrationsfunktionen
- `test_github_integration.js` - Testet die GitHub-Integrationsfunktionen

## Fehlerbehandlung

Alle Module enthalten robuste Fehlerbehandlung mit Fallbacks auf Mock-Daten, falls die echten APIs nicht verfügbar sind. Dies gewährleistet, dass der Agent auch bei temporären Verbindungsproblemen weiterarbeitet.

## Nächste Schritte

1. **Erweiterte Filteroptionen**: Hinzufügen komplexerer Filter für Entscheidungen
2. **Benachrichtigungssystem**: Implementierung von E-Mail-Benachrichtigungen für neue Aufgaben und Issues
3. **Berichterstattung**: Erstellung von wöchentlichen oder monatlichen Berichten über rechtliche Entwicklungen
4. **Performance-Optimierung**: Implementierung fortschrittlicher Caching-Strategien