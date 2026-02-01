# Sichere Heroku-Bereitstellung - Anleitung

## Wichtiger Sicherheitshinweis

Aus Sicherheitsgründen dürfen Sie mir niemals Ihre tatsächlichen Anmeldeinformationen senden. Ich kann diese nicht empfangen oder verwenden, da dies ein schwerwiegendes Sicherheitsrisiko darstellen würde.

## Schritt 1: Heroku API-Token erstellen

1. Öffnen Sie Ihren Webbrowser und gehen Sie zu: https://dashboard.heroku.com/account
2. Melden Sie sich mit Ihrer E-Mail und Ihrem Passwort an
3. Führen Sie die MFA-Authentifizierung mit Ihrem FIDO-Schlüssel durch
4. Scrollen Sie zum Abschnitt "API Key"
5. Klicken Sie auf die Schaltfläche "Reveal" neben "API Key"
6. Kopieren Sie den angezeigten API-Token

## Schritt 2: Sichere Konfigurationsdatei erstellen

1. Öffnen Sie Notepad (Editor)
2. Tragen Sie die folgenden Informationen ein (ersetzen Sie die Platzhalter durch Ihre tatsächlichen Daten):

```
# SICHERE HEROKU-KONFIGURATION
# Diese Datei wird nach der Bereitstellung automatisch gelöscht

[HEROKU]
API_TOKEN=IHRE_KOPIERTE_HEROKU_API_TOKEN_HIER

[ASANA]
ACCESS_TOKEN=IHRE_ASANA_ACCESS_TOKEN_HIER
WORKSPACE_ID=IHRE_ASANA_WORKSPACE_ID_HIER

[GITHUB]
WEBHOOK_SECRET=IHRE_GITHUB_WEBHOOK_SECRET_HIER
```

3. Speichern Sie die Datei als `secure_config.ini` im Projektverzeichnis:
   `d:\ - 2025 - 22.06- copy C\_AA_Postfach 01.01.2025\03.07.2025 Arbeit 02.11.2025\JurisMind - Mietrecht 01`

## Schritt 3: Bereitstellungsskript ausführen

1. Führen Sie die Datei `secure_heroku_deploy.bat` aus
2. Das Skript wird die `secure_config.ini` Datei automatisch lesen
3. Die Bereitstellung wird durchgeführt
4. Die Konfigurationsdatei wird nach Abschluss automatisch gelöscht

## Warum dieser Ansatz sicher ist

1. Ihre Zugangsdaten verlassen niemals Ihren Computer
2. Die Datei wird nach der Bereitstellung automatisch gelöscht
3. Keine sensiblen Daten werden im Klartext gespeichert
4. Sie behalten die vollständige Kontrolle über Ihre Anmeldeinformationen

## Unterstützung

Wenn Sie Probleme bei der Erstellung Ihres API-Tokens haben, kontaktieren Sie bitte den Heroku-Support direkt unter https://help.heroku.com/.