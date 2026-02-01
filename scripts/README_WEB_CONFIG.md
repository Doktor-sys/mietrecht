# Webbasierte Konfiguration des Mietrecht-Agenten

Diese Dokumentation beschreibt die webbasierte Konfigurationsoberfläche für den Mietrecht-Agenten, die eine benutzerfreundliche Verwaltung aller Einstellungen ermöglicht.

## Übersicht

Die webbasierte Konfigurationsoberfläche bietet eine intuitive Benutzeroberfläche zur Verwaltung aller Aspekte des Mietrecht-Agenten:

1. **Datenquellen-Konfiguration** - Verwaltung der Gerichtsdatenbanken
2. **NLP-Einstellungen** - Anpassung der natürlichen Sprachverarbeitung
3. **Integrationen** - Konfiguration von Asana und GitHub
4. **Benachrichtigungen** - E-Mail-Einstellungen
5. **Performance** - Caching und Ratenbegrenzung
6. **Anwalt-Konfiguration** - Verwaltung der Anwenderprofile

## Funktionen

### Datenquellen-Konfiguration

Verwalten Sie, welche Gerichtsdatenbanken der Agent abfragt:

- **Bundesgerichtshof (BGH)** - Aktivierung und Konfiguration
- **Landgerichte** - Aktivierung und Konfiguration
- **Bundesverfassungsgericht (BVerfG)** - Aktivierung und Konfiguration
- **Beck-Online** - Aktivierung und Konfiguration (benötigt Abonnement)

### NLP-Einstellungen

Passen Sie die natürliche Sprachverarbeitung an:

- **Automatische Zusammenfassung** - Aktivierung der Zusammenfassungsfunktion
- **Themenextraktion** - Aktivierung der Themenextraktion
- **Entitätenextraktion** - Aktivierung der Entitätenextraktion
- **Wichtigkeitsklassifizierung** - Aktivierung der Wichtigkeitsklassifizierung
- **Praxisimplikationen** - Aktivierung der Praxisimplikationen

### Integrationen

Konfigurieren Sie externe Systeme:

- **Asana-Integration** - Projekt- und Workspace-Einstellungen
- **GitHub-Integration** - Repository-Einstellungen

### Benachrichtigungen

Verwalten Sie E-Mail-Benachrichtigungen:

- **SMTP-Einstellungen** - Server, Port, Sicherheit, Anmeldeinformationen
- **Aktivierung** - Ein-/Ausschalten von E-Mail-Benachrichtigungen

### Performance

Optimieren Sie die Leistung:

- **Caching** - Aktivierung und Zeit-to-Live-Einstellungen
- **Ratenbegrenzung** - Anzahl der Anfragen pro Minute
- **Wiederholungsversuche** - Maximale Anzahl und Verzögerung

### Anwalt-Konfiguration

Verwalten Sie Anwenderprofile:

- **Hinzufügen/Entfernen** - Neue Anwälte hinzufügen oder entfernen
- **Persönliche Daten** - Name, E-Mail, Kanzlei
- **Präferenzen** - Rechtsgebiete, Regionen, Gerichtsebenen, Themen, Häufigkeit, Wichtigkeitsschwelle

## Verwendung

### Starten des Web-Servers

```bash
# Starte den Web-Konfigurationsserver
npm run mietrecht-web-config
```

Der Server startet standardmäßig auf Port 3000. Sie können dann die Konfigurationsoberfläche unter `http://localhost:3000` aufrufen.

### Ausführung der Tests

```bash
# Teste den Web-Konfigurationsserver
npm run test-web-config
```

## Technische Details

### Server-Komponenten

- **Express.js** - Web-Framework für Node.js
- **RESTful API** - Endpunkte für Konfigurationsverwaltung
- **Statische Dateien** - Auslieferung der Frontend-Ressourcen

### Frontend-Komponenten

- **HTML5** - Struktur der Benutzeroberfläche
- **CSS3** - Styling und Responsivität
- **Vanilla JavaScript** - Client-seitige Logik

### API-Endpunkte

- `GET /api/config` - Abrufen der aktuellen Konfiguration
- `POST /api/config` - Aktualisieren der Konfiguration
- `GET /api/lawyers` - Abrufen der Anwalt-Liste
- `POST /api/lawyers` - Hinzufügen/Bearbeiten eines Anwalts
- `DELETE /api/lawyers/:id` - Löschen eines Anwalts

## Entwicklung

### Abhängigkeiten

- express: Web-Framework
- Alle anderen Abhängigkeiten aus vorhergehenden Phasen

### Dateistruktur

```
web_config_server.js        # Server-Logik
public/                     # Frontend-Ressourcen
  ├── index.html            # Hauptseite
  ├── styles.css            # Styling
  └── script.js             # Client-seitige Logik
```

### Testskripte

- `test_web_config_server.js` - Testet den Web-Konfigurationsserver

## Nächste Schritte

1. **Dashboard-Oberfläche** - Entwicklung eines Überwachungsdashboards
2. **Benutzerkonten** - Implementierung von Benutzeranmeldung und -verwaltung
3. **Audit-Logging** - Protokollierung aller Konfigurationsänderungen
4. **Internationalisierung** - Unterstützung mehrerer Sprachen