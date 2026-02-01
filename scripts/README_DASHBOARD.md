# Mietrecht Agent Dashboard

Diese Dokumentation beschreibt das Dashboard des Mietrecht-Agenten, das Echtzeit-Überwachung, Leistungsdaten und Analysen bereitstellt.

## Übersicht

Das Dashboard bietet eine umfassende Übersicht über den Status und die Leistung des Mietrecht-Agenten:

1. **Agent Status** - Aktueller Ausführungsstatus
2. **Leistungsdaten** - Metriken zur Agentenleistung
3. **Datenquellen Status** - Verfügbarkeit der Gerichtsdatenbanken
4. **Neueste Entscheidungen** - Kürzlich verarbeitete Gerichtsentscheidungen
5. **Systemprotokolle** - Aktuelle Systemereignisse und Fehler

## Funktionen

### Agent Status

Zeigt den aktuellen Status des Agenten an:

- **Aktueller Status** - Ob der Agent läuft oder gestoppt ist
- **Letzte Ausführung** - Zeitpunkt der letzten erfolgreichen Ausführung
- **Nächste Ausführung** - Geplanter Zeitpunkt der nächsten Ausführung

### Leistungsdaten

Präsentiert wichtige Leistungsmetriken:

- **Verarbeitete Entscheidungen** - Gesamtzahl der verarbeiteten Entscheidungen
- **Erfolgreiche Ausführungen** - Anzahl der erfolgreichen Agentenausführungen
- **Fehlgeschlagene Ausführungen** - Anzahl der fehlgeschlagenen Ausführungen
- **Durchschnittliche Antwortzeit** - Durchschnittliche Antwortzeit der APIs in ms
- **Cache-Trefferquote** - Prozentsatz der Anfragen, die aus dem Cache bedient wurden
- **Aktive Anfragen** - Anzahl der aktuell laufenden API-Anfragen

### Datenquellen Status

Überwacht die Verfügbarkeit der verwendeten Datenquellen:

- **Bundesgerichtshof (BGH)** - Status und letzte Prüfung
- **Landgerichte** - Status und letzte Prüfung
- **Bundesverfassungsgericht (BVerfG)** - Status und letzte Prüfung
- **Beck-Online** - Status und letzte Prüfung

### Neueste Entscheidungen

Zeigt eine Liste der kürzlich verarbeiteten Gerichtsentscheidungen:

- **Gericht** - Ausstellendes Gericht
- **Aktenzeichen** - Offizielle Aktennummer
- **Datum** - Datum der Entscheidung
- **Themen** - Relevante Rechtsgebiete
- **Wichtigkeit** - Klassifizierung der Wichtigkeit
- **Status** - Verarbeitungsstatus

### Systemprotokolle

Zeigt aktuelle Systemereignisse und Fehlermeldungen:

- **Zeitstempel** - Wann das Ereignis aufgetreten ist
- **Log-Level** - Schweregrad (Info, Warnung, Fehler)
- **Nachricht** - Beschreibung des Ereignisses

## Verwendung

### Zugriff auf das Dashboard

Das Dashboard ist über den Web-Konfigurationsserver unter `http://localhost:3000/dashboard` erreichbar.

### Automatische Aktualisierung

Das Dashboard aktualisiert sich automatisch alle 30 Sekunden, um aktuelle Daten anzuzeigen.

### Ausführung der Tests

```bash
# Teste die Dashboard-Funktionalität
npm run test-dashboard
```

## Technische Details

### Server-Komponenten

- **Erweiterte API-Endpunkte** - Zusätzliche Endpunkte für Dashboard-Daten
- **In-Memory Speicher** - Temporärer Speicher für Dashboard-Metriken
- **Mock-Daten** - Simulierte Daten für Demonstration

### Frontend-Komponenten

- **HTML5** - Struktur des Dashboards
- **CSS3** - Responsives Design und Styling
- **Vanilla JavaScript** - Client-seitige Logik und Aktualisierung

### API-Endpunkte

- `GET /dashboard` - Abrufen der Dashboard-Seite
- `GET /api/dashboard` - Abrufen der Dashboard-Daten
- `POST /api/dashboard/update` - Aktualisieren der Dashboard-Daten (für Simulation)
- `GET /api/recent-decisions` - Abrufen der neuesten Entscheidungen
- `GET /api/logs` - Abrufen der Systemprotokolle

## Entwicklung

### Abhängigkeiten

- express: Web-Framework
- Alle anderen Abhängigkeiten aus vorhergehenden Phasen

### Dateistruktur

```
web_config_server.js         # Erweiterter Server mit Dashboard-Endpunkten
public/                     # Frontend-Ressourcen für das Dashboard
  ├── dashboard.html         # Dashboard-Hauptseite
  ├── dashboard.css          # Dashboard-Styling
  └── dashboard.js           # Dashboard-JavaScript-Logik
```

### Testskripte

- `test_dashboard.js` - Testet die Dashboard-Funktionalität

## Nächste Schritte

1. **Persistente Speicherung** - Speichern von Dashboard-Daten in einer Datenbank
2. **Echtzeit-Websockets** - Implementierung von Websockets für Echtzeit-Aktualisierungen
3. **Erweiterte Analysen** - Hinzufügen von Diagrammen und statistischen Analysen
4. **Benutzerberechtigungen** - Implementierung von Zugriffskontrollen für das Dashboard