# Mitwirkung am Mietrecht-Agenten

Wir freuen uns über jede Form der Mitwirkung am Mietrecht-Agenten! Dieses Dokument beschreibt, wie Sie zum Projekt beitragen können.

## Verhaltenskodex

Dieses Projekt und alle Teilnehmer sind an unseren [Verhaltenskodex](file:///d:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/CODE_OF_CONDUCT.md) gebunden. Bitte lesen Sie ihn, bevor Sie mitarbeiten.

## Wie Sie beitragen können

### Fehler melden

Bevor Sie einen Fehler melden, überprüfen Sie bitte die [bestehenden Issues](https://github.com/your-organization/mietrecht-agent/issues), um Duplikate zu vermeiden.

Wenn Sie einen neuen Fehler melden:

1. Verwenden Sie einen aussagekräftigen Titel
2. Beschreiben Sie den Fehler genau und fügen Sie Schritte zur Reproduktion hinzu
3. Geben Sie Ihre Umgebung an (Betriebssystem, Node.js-Version, etc.)
4. Fügen Sie Screenshots oder Logs hinzu, wenn möglich

### Funktionen vorschlagen

Wir sind offen für neue Ideen! Um eine Funktion vorzuschlagen:

1. Überprüfen Sie die [bestehenden Issues](https://github.com/your-organization/mietrecht-agent/issues), um Duplikate zu vermeiden
2. Erstellen Sie ein neues Issue mit dem Label "enhancement"
3. Beschreiben Sie die Funktion detailliert
4. Erklären Sie, welches Problem die Funktion lösen würde

### Code beitragen

#### Entwicklungsumgebung einrichten

1. Forken Sie das Repository
2. Klonen Sie Ihren Fork:
   ```bash
   git clone https://github.com/IHR-BENUTZERNAME/mietrecht-agent.git
   ```
3. Erstellen Sie einen Feature-Branch:
   ```bash
   git checkout -b feature/neue-funktion
   ```
4. Installieren Sie die Abhängigkeiten:
   ```bash
   npm install
   ```

#### Coding Standards

- Folgen Sie dem [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Verwenden Sie [Prettier](https://prettier.io/) für die Codeformatierung
- Schreiben Sie aussagekräftige Commit-Nachrichten auf Deutsch
- Dokumentieren Sie neuen Code mit JSDoc-Kommentaren

#### Tests

- Schreiben Sie Unit-Tests für neue Funktionen
- Stellen Sie sicher, dass alle Tests bestehen:
  ```bash
  npm test
  ```
- Ziel: Mindestens 80% Testabdeckung

#### Commits und Pull Requests

1. Machen Sie kleine, fokussierte Commits
2. Schreiben Sie aussagekräftige Commit-Nachrichten:
   ```
   feat: Neue BGH-API-Integration hinzugefügt
   fix: Fehler in der Entscheidungsfilterung behoben
   docs: Entwicklerdokumentation aktualisiert
   ```
3. Pushen Sie zu Ihrem Fork:
   ```bash
   git push origin feature/neue-funktion
   ```
4. Erstellen Sie einen Pull Request zum `develop`-Branch

#### Pull Request Richtlinien

- Beschreiben Sie genau, was sich geändert hat und warum
- Verlinken Sie relevante Issues
- Fügen Sie Screenshots hinzu, wenn UI-Änderungen betroffen sind
- Stellen Sie sicher, dass alle Tests bestehen
- Fordern Sie Reviews von mindestens zwei Maintainer an

### Dokumentation verbessern

Gute Dokumentation ist genauso wichtig wie guter Code:

- Korrigieren Sie Rechtschreibfehler und grammatikalische Fehler
- Ergänzen Sie fehlende Informationen
- Verbessern Sie bestehende Abschnitte
- Übersetzen Sie Dokumentation in andere Sprachen

## Entwicklung

### Projektstruktur

```
mietrecht-agent/
├── scripts/                 # Hauptanwendungscode
│   ├── ai/                  # KI/NLP-Komponenten
│   ├── analytics/            # Analysemodule
│   ├── data_sources/         # Datenquellen-Clients
│   ├── database/            # Datenbankzugriff und -verwaltung
│   ├── filters/             # Entscheidungsfilter
│   ├── notifications/       # Benachrichtigungssystem
│   ├── public/              # Statische Webdateien
│   └── ...                  # Weitere Module
├── docs/                    # Dokumentation
├── tests/                   # Testdateien
└── package.json             # Projektmetadaten und Abhängigkeiten
```

### Nützliche npm-Skripte

```bash
# Entwicklungsserver starten
npm run dev

# Alle Tests ausführen
npm test

# Unit-Tests ausführen
npm run test:unit

# Integrationstests ausführen
npm run test:integration

# Testabdeckung generieren
npm run test:coverage

# Code linten
npm run lint

# Code formatieren
npm run format
```

### Datenbankmigrationen

Bei Änderungen am Datenbankschema:

1. Erstellen Sie ein neues Migrationsskript in `scripts/database/migrations/`
2. Implementieren Sie Up- und Down-Migrationen
3. Aktualisieren Sie das Schema in `scripts/database/schema.js`
4. Testen Sie die Migration gründlich

## Community

### Kommunikation

- **GitHub Issues**: Für Bugs und Feature Requests
- **GitHub Discussions**: Für allgemeine Diskussionen und Fragen
- **E-Mail**: support@mietrecht-agent.de

### Veranstaltungen

Wir organisieren regelmäßig Entwicklertreffen und Hackathons. Folgen Sie unserem [Twitter-Account](https://twitter.com/mietrechtagent) für Ankündigungen.

## Anerkennung

Alle Mitwirkenden werden in unserer [CONTRIBUTORS.md](file:///d:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/CONTRIBUTORS.md) und in den [Release Notes](file:///d:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/CHANGELOG.md) erwähnt.

Vielen Dank für Ihre Mitwirkung am Mietrecht-Agenten!