# Mietrecht Agent mit Erweiterten Funktionen

Diese Dokumentation beschreibt die erweiterten Funktionen des Mietrecht-Agenten, die eine umfassende Automatisierung und Anpassung ermöglichen.

## Übersicht

Der Mietrecht Agent mit erweiterten Funktionen bietet zusätzliche Möglichkeiten zur Konfiguration, Filterung, Benachrichtigung und Berichterstattung:

1. **Konfigurationssystem** - Flexible Anpassung aller Agentenparameter
2. **Erweitertes Filter- und Sortiersystem** - Leistungsstarke Datenverarbeitung
3. **Benachrichtigungssystem** - E-Mail-Benachrichtigungen für Anwälte
4. **Berichterstattungssystem** - Automatische Erstellung von Analysen

## Funktionen

### Konfigurationssystem

Das Konfigurationssystem ermöglicht eine flexible Anpassung des Agenten:

- **Datenquellen-Konfiguration**: Aktivierung/deaktivierung einzelner Quellen
- **NLP-Einstellungen**: Anpassung der natürlichen Sprachverarbeitung
- **Integrations-Einstellungen**: Konfiguration von Asana und GitHub
- **Benachrichtigungs-Einstellungen**: SMTP-Konfiguration für E-Mails
- **Performance-Einstellungen**: Caching, Rate-Limiting, Retry-Mechanismen
- **Anwaltsspezifische Präferenzen**: Individuelle Einstellungen für jeden Anwalt

### Erweitertes Filter- und Sortiersystem

Das leistungsstarke Filter- und Sortiersystem ermöglicht präzise Datenverarbeitung:

- **Mehrfachfilterung**: Filterung nach Gericht, Themen, Datum, Wichtigkeit, Ort, Aktenzeichen und Richtern
- **Benutzerdefinierte Filter**: Eigene Filterfunktionen definieren
- **Sortierung**: Sortierung nach verschiedenen Kriterien in aufsteigender oder absteigender Reihenfolge
- **Paginierung**: Aufteilung der Ergebnisse in Seiten
- **Gruppierung**: Gruppierung von Entscheidungen nach bestimmten Feldern
- **Volltextsuche**: Durchsuchen aller Entscheidungsfelder

### Benachrichtigungssystem

Das Benachrichtigungssystem hält Anwälte über neue Entscheidungen auf dem Laufenden:

- **Newsletter**: Regelmäßige Zusammenfassungen per E-Mail
- **Wichtige Entscheidungen**: Sofortbenachrichtigungen bei wichtigen Neuentwicklungen
- **Systemstatus**: Statusberichte über den Agentenbetrieb
- **SMTP-Integration**: Unterstützung gängiger E-Mail-Server

### Berichterstattungssystem

Das Berichterstattungssystem erstellt automatisch Analysen rechtlicher Entwicklungen:

- **Zusammenfassende Berichte**: Übersicht über neue Entscheidungen mit Statistiken
- **Detaillierte Analysen**: Tiefgehende Analysen einzelner Entscheidungen
- **Vergleichsberichte**: Trendanalysen über verschiedene Zeiträume
- **Exportfunktionen**: Speichern von Berichten in Dateien

## Verwendung

### Konfiguration

Die Konfiguration erfolgt über eine Kombination aus Standardwerten, Konfigurationsdatei und Umgebungsvariablen:

```javascript
// Beispiel für eine Konfigurationsdatei (config.json)
{
  "dataSources": {
    "bgh": {
      "enabled": true,
      "baseUrl": "https://juris.bundesgerichtshof.de",
      "maxResults": 50
    },
    "beckOnline": {
      "enabled": false
    }
  },
  "integrations": {
    "asana": {
      "enabled": true,
      "projectId": "123456789",
      "workspaceId": "987654321"
    }
  }
}
```

### Ausführung des Agents

```bash
# Starte den erweiterten Mietrecht-Agenten
npm run mietrecht-agent-advanced
```

### Ausführung der Tests

```bash
# Teste die erweiterten Funktionen
npm run test-advanced-features
```

## Module

### Konfigurationssystem (`config_manager.js`)

- `loadConfig()` - Lädt die Konfiguration
- `saveConfig(config)` - Speichert die Konfiguration
- `getConfigValue(config, path)` - Ruft einen spezifischen Konfigurationswert ab

### Erweitertes Filter- und Sortiersystem (`advanced_filtering.js`)

- `filterDecisions(decisions, filters)` - Filtert Entscheidungen nach Kriterien
- `sortDecisions(decisions, sortOptions)` - Sortiert Entscheidungen
- `paginateDecisions(decisions, page, pageSize)` - Paginiert Entscheidungen
- `groupDecisions(decisions, field)` - Gruppiert Entscheidungen
- `searchDecisions(decisions, query)` - Durchsucht Entscheidungen

### Benachrichtigungssystem (`notification_system.js`)

- `sendNewsletter(lawyer, newsletterContent, smtpConfig)` - Sendet Newsletter
- `sendImportantDecisionsNotification(decisions, lawyer, smtpConfig)` - Sendet Benachrichtigungen über wichtige Entscheidungen
- `sendSystemStatus(statusMessage, recipientEmail, smtpConfig)` - Sendet Systemstatus-Benachrichtigungen

### Berichterstattungssystem (`reporting_system.js`)

- `generateSummaryReport(decisions, options)` - Erstellt zusammenfassende Berichte
- `generateDetailedReport(decisions, options)` - Erstellt detaillierte Berichte
- `generateComparativeReport(currentDecisions, previousDecisions, options)` - Erstellt Vergleichsberichte

### Erweiterter Mietrecht-Agent (`enhanced_mietrecht_agent.js`)

- `runEnhancedMietrechtAgent(options)` - Führt den erweiterten Agenten aus

## Entwicklung

### Abhängigkeiten

- Alle Abhängigkeiten aus vorhergehenden Phasen
- nodemailer: Für das Senden von E-Mails

### Testskripte

- `test_advanced_features.js` - Testet alle erweiterten Funktionen

## Nächste Schritte

1. **Webbasierte Konfiguration**: Entwickeln einer Web-Oberfläche zur Konfiguration
2. **Erweiterte Berichte**: Implementierung von Diagrammen und Visualisierungen
3. **Mobile Benachrichtigungen**: Integration von Push-Benachrichtigungen
4. **KI-gestützte Filter**: Implementierung von maschinellen Lernmodellen zur Verbesserung der Filterung