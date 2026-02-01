# Mietrecht Urteilsagent

Der Mietrecht Urteilsagent ist eine Anwendung, die wöchentlich nach aktuellen deutschen Gerichtsurteilen im Bereich des Mietrechts sucht und personalisierte Newsletter per E-Mail an Anwälte sendet.

## Funktionen

### Hauptfunktionen
- **Automatische Suche**: Wöchentliche Suche nach neuen Gerichtsurteilen
- **Personalisierung**: Anpassung der Inhalte nach Anwaltseinstellungen
- **Kategorisierung**: Sortierung nach Gerichtsarten (BGH, Landgerichte, etc.)
- **Newsletter**: HTML-formatierte E-Mails mit allen relevanten Informationen
- **Planung**: Automatische wöchentliche Ausführung

### Technische Merkmale
- Filterung nach geografischen Schwerpunkten
- Thematische Spezialisierung (Mietminderung, Kündigung, etc.)
- Wichtigkeitsbewertung der Urteile
- Praxishinweise für direkte Anwendbarkeit
- Responsive E-Mail-Designs

## Installation

### Voraussetzungen
- Node.js (Version 12.0 oder höher)
- npm (in der Regel mit Node.js installiert)

### Installationsschritte
1. Stellen Sie sicher, dass Node.js installiert ist:
   ```
   node --version
   ```
2. Installieren Sie die benötigten Abhängigkeiten:
   ```
   npm install
   ```

## Verwendung

### Den Agent manuell starten
```
npm run mietrecht-agent-de
```

### Tests ausführen
```
npm run test-mietrecht-agent-de
```

### Mit der Batch-Datei starten (Windows)
Doppelklicken Sie auf `starte_mietrecht_agent.bat`

## Anpassung für Anwälte

### Einstellungsmöglichkeiten
Anwälte können ihre Präferenzen in der Anwalt-Konfiguration festlegen:

1. **Geografische Schwerpunkte**:
   - Berlin, Hamburg, Bayern, etc.

2. **Rechtsschwerpunkte**:
   - Mietminderung
   - Kündigung
   - Modernisierung
   - Nebenkosten
   - Mietpreisbremse

3. **Gerichtsarten**:
   - Nur Bundesgerichtshof
   - Landgerichte einbeziehen
   - Verfassungsgericht

4. **Häufigkeit**:
   - Wöchentlich
   - Alle zwei Wochen
   - Monatlich

## Datenquellen

### Primäre Quellen
- **Bundesgerichtshof (BGH)**: Urteile des höchsten deutschen Zivilgerichts
- **Landgerichte**: Wichtige regionale Entscheidungen
- **Bundesverfassungsgericht**: Verfassungsrechtliche Aspekte

### Sekundäre Quellen (für Vollimplementierung)
- **Beck-Online**: Umfassende juristische Datenbank
- **NJW**: Neue Juristische Wochenschrift
- **Spezialisierte Mietrechtsdatenbanken**: Branchenspezifische Ressourcen

## Newsletter-Struktur

### Inhaltsbereiche
1. **Persönlicher Kopfbereich**: Wöchentliche Übersicht mit Anwaltsname
2. **BGH-Urteile**: Entscheidungen des Bundesgerichtshofs mit Wichtigkeitsindikatoren
3. **Landgerichts-Urteile**: Wichtige regionale Entscheidungen
4. **Verfassungsgerichts-Urteile**: BVerfG-Entscheidungen
5. **Praxishinweise-Zusammenfassung**: Konsolidierte praktische Auswirkungen
6. **Professioneller Fußbereich**: Einstellungs- und Abmeldelinks

### Personalisierungselemente
- Anwaltsname und Kanzleinamen
- Geografisch relevante Urteile
- Bevorzugte Rechtsgebiete
- Ausgewählte Gerichtsarten
- Wichtigkeitsbasierte Hervorhebung

## Entwicklung

### Projektstruktur
```
scripts/
├── mietrecht_agent_de.js              # Hauptanwendung
├── mietrecht_agent_enhanced.js        # Erweiterte KI/ML-Version
├── teste_mietrecht_agent_de.js        # Testsuite
├── starte_mietrecht_agent.bat         # Windows-Starter (Basisversion)
├── run_enhanced_mietrecht_agent.bat   # Windows-Starter (Erweiterte KI/ML-Version)
└── package.json                       # Projektkonfiguration
```

### Hauptmodule
1. **Urteilsfilter-Modul**: Filtert Urteile nach Anwaltseinstellungen
2. **Kategorisierungs-Modul**: Organisiert Urteile nach Gerichtsarten
3. **Newsletter-Generierungs-Modul**: Erstellt personalisierte HTML-Newsletter
4. **E-Mail-Versand-Modul**: Sendet E-Mails (in diesem Prototyp simuliert)
5. **Hilfsfunktionen**: Datumsformatierung, Kalenderwochenberechnung, etc.

## Testen

### Durchgeführte Tests
- ✅ Urteilsfilterung basierend auf Anwaltseinstellungen
- ✅ Kategorisierung nach Gerichtsarten
- ✅ HTML-Newsletter-Generierung mit allen benötigten Abschnitten
- ✅ E-Mail-Simulationsfunktionalität
- ✅ Personalisierung basierend auf individuellen Anwaltsprofilen
- ✅ Erweiterte KI/ML-Funktionen (neue Testmodule verfügbar)

## Datenschutz und Compliance

### Datensicherheit
- Vollständige DSGVO-Konformität
- Wahrung der Berufsverschwiegenheit
- Sichere Speicherung von Anwaltseinstellungen
- Verschlüsselte Datenübertragung

### Rechtliche Compliance
- Ordentliche Quellenangaben für Urteile
- Einhaltung von Veröffentlichungsbeschränkungen
- Konformität mit deutschen Rechtsstandards
- Einhaltung berufsethischer Standards

## Zukünftige Erweiterungen

### KI-Integration
- Natural Language Processing für automatische Urteilzusammenfassungen
- Maschinelles Lernen für prädiktive Präferenzmodellierung
- Automatische Identifikation von Praxishinweisen
- Trendanalyse für Rechtsentwicklungen

### Erweiterte KI/ML-Funktionen (Implementiert)
- Umfassende Risikobewertung für juristische Fälle
- Personalisierte Rechtsstrategieempfehlungen
- Fortgeschrittene Dokumentenanalyse mit semantischer Verarbeitung
- Verbesserte Entitätenextraktion und Sentiment-Analyse
- Integriertes Empfehlungssystem für Mandanten und Anwälte

### Erweiterte Funktionen
- Echtzeit-Benachrichtigungen für wichtige Urteile
- Mobile App-Integration für den Zugriff unterwegs
- Interaktive Urteils-Explorationswerkzeuge
- Fallähnlichkeits-Vergleichsfunktionen

### Integrationsmöglichkeiten
- Verbindung mit Kanzleimanagementsystemen
- Integration von Dokumentenautomatisierungstools
- Synchronisation mit Mandantenportalen
- Anbindung an Abrechnungssysteme

## Support

Für Fragen oder Probleme kontaktieren Sie das Entwicklungsteam unter [support@jurismind.de](mailto:support@jurismind.de).

## Lizenz

Dieses Projekt ist urheberrechtlich geschützt und darf ohne ausdrückliche Genehmigung nicht weiterverbreitet werden.