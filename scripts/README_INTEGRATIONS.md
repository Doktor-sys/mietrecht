# Mietrecht Agent mit Integrationsfunktionen

Diese Dokumentation beschreibt die erweiterten Integrationsfunktionen für den Mietrecht Agenten, die eine nahtlose Verbindung zu Asana und GitHub ermöglichen.

## Übersicht

Der Mietrecht Agent mit Integrationsfunktionen kombiniert alle bisher entwickelten Funktionen und fügt Integrationen mit externen Systemen hinzu:

1. **Datenbeschaffung** - Abruf von Gerichtsentscheidungen aus verschiedenen Quellen
2. **KI-gestützte Inhaltsverarbeitung** - Automatische Analyse und Zusammenfassung von Entscheidungen
3. **Asana-Integration** - Erstellung von Aufgaben basierend auf wichtigen Entscheidungen
4. **GitHub-Integration** - Erstellung von Issues für rechtliche Auswirkungen

## Funktionen

### Asana-Integration

Die Asana-Integration ermöglicht die automatische Erstellung von Aufgaben für neue Gerichtsentscheidungen:

- **Aufgabenerstellung**: Erstellt strukturierte Aufgaben in Asana mit allen relevanten Informationen
- **Priorisierung**: Berücksichtigt die Wichtigkeit von Entscheidungen bei der Aufgabenerstellung
- **Detailinformationen**: Fügt vollständige Details zur Entscheidung als Aufgabenbeschreibung hinzu

### GitHub-Integration

Die GitHub-Integration ermöglicht die automatische Erstellung von Issues für wichtige rechtliche Entwicklungen:

- **Issue-Erstellung**: Erstellt Issues für hochwertige Entscheidungen mit detaillierten Beschreibungen
- **Labeling**: Fügt automatisch relevante Labels basierend auf Themen und Rechtsgebieten hinzu
- **Verknüpfungen**: Stellt Links zur Originalentscheidung bereit

## Verwendung

### Umgebungsvariablen

Für die Integration mit externen Systemen müssen folgende Umgebungsvariablen gesetzt werden:

```bash
# Asana-Konfiguration
ASANA_API_KEY=dein_asana_api_schlüssel
ASANA_PROJECT_ID=deine_projekt_id

# GitHub-Konfiguration
GITHUB_TOKEN=dein_github_token
GITHUB_REPO_OWNER=dein_repo_besitzer
GITHUB_REPO_NAME=dein_repo_name
```

### Ausführung des Agents

```bash
# Starte den integrierten Mietrecht-Agenten
npm run mietrecht-agent-integrated
```

### Ausführung der Tests

```bash
# Teste die Asana-Integration
npm run test-asana

# Teste die GitHub-Integration
npm run test-github

# Teste den integrierten Mietrecht-Agenten
npm run test-mietrecht-integrated
```

## Module

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

### Integrierter Mietrecht-Agent (`mietrecht_agent_integrated.js`)

- `runEnhancedMietrechtAgent(options)` - Führt den vollständigen Agenten mit allen Integrationen aus
- `enhanceDecisionsWithNLP(decisions)` - Erweitert Entscheidungen mit NLP-Analysen
- `filterDecisionsForLawyer(decisions, lawyer)` - Filtert Entscheidungen für einen bestimmten Anwalt
- `categorizeDecisions(decisions)` - Kategorisiert Entscheidungen nach Wichtigkeit
- `generateNewsletter(decisions, lawyer)` - Generiert einen Newsletter für einen Anwalt

## Entwicklung

### Abhängigkeiten

- axios: Für HTTP-Anfragen an die APIs
- Alle anderen Abhängigkeiten aus vorhergehenden Phasen

### Testskripte

- `test_asana_integration.js` - Testet die Asana-Integrationsfunktionen
- `test_github_integration.js` - Testet die GitHub-Integrationsfunktionen
- `test_mietrecht_agent_integrated.js` - Testet den vollständigen integrierten Agenten

## Nächste Schritte

1. **Implementierung echter API-Verbindungen**: Ersetzen der Mock-Implementierungen durch echte API-Aufrufe
2. **Erweiterte Filteroptionen**: Hinzufügen komplexerer Filter für Entscheidungen
3. **Benachrichtigungssystem**: Implementierung von E-Mail-Benachrichtigungen für neue Aufgaben und Issues
4. **Berichterstattung**: Erstellung von wöchentlichen oder monatlichen Berichten über rechtliche Entwicklungen