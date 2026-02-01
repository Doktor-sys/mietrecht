# Finale Bereitstellungsanleitung für GitHub-Asana Integration

## Übersicht

Diese Anleitung beschreibt die abschließenden Schritte zur Bereitstellung der GitHub-Asana Integration auf Heroku.

## Schritt 1: Heroku-Konto erstellen

1. Besuchen Sie https://signup.heroku.com/
2. Erstellen Sie ein neues Konto
3. Bestätigen Sie Ihre E-Mail-Adresse

## Schritt 2: Heroku CLI authentifizieren

1. Öffnen Sie eine neue PowerShell/Eingabeaufforderung
2. Führen Sie den folgenden Befehl aus:
   ```
   heroku login
   ```
3. Drücken Sie eine beliebige Taste, um den Browser zu öffnen
4. Melden Sie sich mit Ihren Heroku-Anmeldeinformationen an

## Schritt 3: Umgebungsvariablen konfigurieren

1. Nach erfolgreicher Anmeldung führen Sie die folgenden Befehle aus:

   ```
   # Asana Access Token festlegen
   heroku config:set ASANA_ACCESS_TOKEN=Ihr_tatsächlicher_Asana_Token_hier -a github-asana-integration-smartlaw
   
   # GitHub Webhook Secret festlegen
   heroku config:set GITHUB_WEBHOOK_SECRET=Ihr_tatsächliches_GitHub_Secret_hier -a github-asana-integration-smartlaw
   
   # Asana Workspace ID festlegen (optional)
   heroku config:set ASANA_WORKSPACE_ID=Ihre_tatsächliche_Workspace_ID_hier -a github-asana-integration-smartlaw
   ```

## Schritt 4: Auf Heroku bereitstellen

1. Stellen Sie sicher, dass Sie sich im Projektverzeichnis befinden:
   ```
   cd "d:\ - 2025 - 22.06- copy C\_AA_Postfach 01.01.2025\03.07.2025 Arbeit 02.11.2025\JurisMind - Mietrecht 01"
   ```

2. Stellen Sie die Anwendung bereit:
   ```
   git push heroku main
   ```

## Schritt 5: GitHub Webhook konfigurieren

1. Gehen Sie zu Ihrem GitHub-Repository
2. Navigieren Sie zu "Settings" > "Webhooks"
3. Klicken Sie auf "Add webhook"
4. Füllen Sie das Formular wie folgt aus:
   - Payload URL: `https://github-asana-integration-smartlaw.herokuapp.com/webhook/github`
   - Content type: `application/json`
   - Secret: Ihr GitHub Webhook Secret (gleich wie in Schritt 3)
   - Events: Wählen Sie "Let me select individual events" und aktivieren Sie:
     - Pushes
     - Pull requests
5. Klicken Sie auf "Add webhook"

## Schritt 6: Integration testen

1. Erstellen Sie einen Test-Commit mit einer Task-ID:
   ```
   git commit -m "task-123: Test-Commit für Integration" --allow-empty
   git push origin main
   ```

2. Überprüfen Sie in Asana, ob der Task aktualisiert wurde

## Fehlerbehebung

### Häufige Probleme

1. **Bereitstellungsfehler**:
   - Überprüfen Sie die Anwendungsprotokolle: `heroku logs --tail -a github-asana-integration-smartlaw`
   - Stellen Sie sicher, dass alle erforderlichen Dateien übertragen wurden

2. **Webhook-Zustellung fehlschlagen**:
   - Überprüfen Sie die Webhook-URL
   - Stellen Sie sicher, dass die Anwendung läuft: `heroku ps -a github-asana-integration-smartlaw`

3. **Authentifizierungsprobleme**:
   - Versuchen Sie eine erneute Anmeldung: `heroku login`
   - Überprüfen Sie, ob Sie zum richtigen Konto angemeldet sind: `heroku auth:whoami`

## Nützliche Heroku-Befehle

- Anwendungsstatus anzeigen: `heroku ps -a github-asana-integration-smartlaw`
- Anwendungsprotokolle anzeigen: `heroku logs --tail -a github-asana-integration-smartlaw`
- Anwendung neu starten: `heroku restart -a github-asana-integration-smartlaw`
- Anwendung im Browser öffnen: `heroku open -a github-asana-integration-smartlaw`

## Support

Für Probleme bei der Bereitstellung wenden Sie sich an:
- DevOps Team: devops@jurismind.de
- Heroku Support: https://help.heroku.com/
- GitHub Support: https://support.github.com/