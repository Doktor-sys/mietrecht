# GitHub-Asana Integration Bereitstellungscheckliste

## Übersicht

Diese Checkliste hilft dabei, alle notwendigen Schritte für die Bereitstellung der GitHub-Asana Integration auf Heroku zu verfolgen.

## Voraussetzungen

### [ ] Heroku-Konto
- [ ] Heroku-Konto erstellt
- [ ] MFA aktiviert (FIDO-Schlüssel bereit)
- [ ] API-Token generiert und gesichert

### [ ] Asana-Zugangsdaten
- [ ] Asana Personal Access Token erstellt
- [ ] Asana Workspace ID identifiziert
- [ ] Berechtigungen für relevante Projekte überprüft

### [ ] GitHub-Konfiguration
- [ ] GitHub Webhook Secret generiert
- [ ] Repository-Zugriff bestätigt
- [ ] Berechtigungen für Webhook-Konfiguration überprüft

## Lokale Vorbereitung

### [ ] Projektstruktur überprüfen
- [ ] Alle erforderlichen Dateien im Git-Repository
- [ ] Procfile vorhanden und korrekt
- [ ] package.json mit allen Abhängigkeiten
- [ ] Umgebungsvariablen korrekt dokumentiert

### [ ] Letzte Tests
- [ ] Health-Check-Endpunkt funktioniert lokal
- [ ] Webhook-Handler akzeptiert Ereignisse
- [ ] Signaturvalidierung implementiert
- [ ] Fehlerbehandlung vorhanden

## Heroku-Bereitstellung

### [ ] Heroku CLI Authentifizierung
- [ ] API-Token als Umgebungsvariable gesetzt
- [ ] Authentifizierung erfolgreich getestet
- [ ] Zugriff auf Ziel-App bestätigt

### [ ] App-Erstellung/Konfiguration
- [ ] Heroku App erstellt oder ausgewählt
- [ ] App-Name: github-asana-integration-smartlaw
- [ ] Region und Stack überprüft

### [ ] Umgebungsvariablen konfigurieren
- [ ] ASANA_ACCESS_TOKEN gesetzt
- [ ] GITHUB_WEBHOOK_SECRET gesetzt
- [ ] ASANA_WORKSPACE_ID gesetzt (optional)

### [ ] Bereitstellung
- [ ] Git-Repository aktuell
- [ ] Hauptbranch identifiziert (main/master)
- [ ] Bereitstellung erfolgreich abgeschlossen
- [ ] App läuft ohne Fehler

### [ ] Nachbereitung
- [ ] Logs überprüfen
- [ ] Skalierungseinstellungen anpassen (wenn nötig)
- [ ] Domäne konfigurieren (wenn nötig)

## GitHub-Webhook-Konfiguration

### [ ] Webhook hinzufügen
- [ ] Payload URL: https://github-asana-integration-smartlaw.herokuapp.com/webhook/github
- [ ] Content type: application/json
- [ ] Secret: GITHUB_WEBHOOK_SECRET
- [ ] Events auswählen:
  - [ ] Pushes
  - [ ] Pull requests

### [ ] Webhook testen
- [ ] Test-Push-Ereignis senden
- [ ] Test-Pull-Request-Ereignis senden
- [ ] Erfolgreiche Zustellung bestätigen

## Integrationstests

### [ ] Asana-Integration testen
- [ ] Commits mit Task-IDs aktualisieren Asana-Tasks
- [ ] Pull Requests verknüpfen Asana-Tasks
- [ ] Korrekte Formatierung der Updates

### [ ] Fehlerfälle testen
- [ ] Ungültige Signaturen werden abgelehnt
- [ ] Fehlende Umgebungsvariablen werden behandelt
- [ ] Netzwerkfehler werden ordnungsgemäß behandelt

## Dokumentation und Schulung

### [ ] Interne Dokumentation
- [ ] Bereitstellungsprozess dokumentiert
- [ ] Fehlerbehebungsdokumentation erstellt
- [ ] Kontaktdaten für Support festgelegt

### [ ] Team-Schulung
- [ ] Commit-Format erläutern
- [ ] Erwartetes Verhalten beschreiben
- [ ] Problemlösungsverfahren erklären

## Überwachung und Wartung

### [ ] Logging konfigurieren
- [ ] Strukturierte Logs aktiviert
- [ ] Fehler- und Warnmeldungen identifiziert
- [ ] Log-Archivierung eingerichtet

### [ ] Alarmierung einrichten
- [ ] Fehlerbedingungen definiert
- [ ] Benachrichtigungskanäle konfiguriert
- [ ] Eskalationsprozesse dokumentiert

## Abschluss

### [ ] End-to-End-Test
- [ ] Vollständiger Workflow von Commit bis Asana-Update
- [ ] Erfolgreiche Ausführung ohne manuelle Eingriffe
- [ ] Alle Integrationen funktionieren ordnungsgemäß

### [ ] Rollback-Plan
- [ ] Wiederherstellungsverfahren dokumentiert
- [ ] Backup-Konfigurationen gesichert
- [ ] Kontaktdaten für Notfallunterstützung

## Nützliche Befehle

```bash
# Heroku Authentifizierung
heroku login
# oder mit API-Token
$env:HEROKU_API_KEY="IHRE_API_TOKEN"

# App-Informationen
heroku apps:info -a github-asana-integration-smartlaw

# Logs anzeigen
heroku logs --tail -a github-asana-integration-smartlaw

# Umgebungsvariablen setzen
heroku config:set VARIABLE_NAME=WERT -a github-asana-integration-smartlaw

# Bereitstellung
git push heroku main

# App neu starten
heroku restart -a github-asana-integration-smartlaw
```

## Support-Kontakte

- Heroku Support: https://help.heroku.com/
- Asana API Support: https://developers.asana.com/docs
- GitHub Webhooks Support: https://docs.github.com/en/developers/webhooks-and-events/webhooks