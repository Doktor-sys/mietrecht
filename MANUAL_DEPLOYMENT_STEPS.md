# Manuelle Bereitstellungsschritte für GitHub-Asana Integration

## Voraussetzungen

Bevor Sie mit der Bereitstellung beginnen, stellen Sie sicher, dass folgende Voraussetzungen erfüllt sind:

1. Heroku-Konto erstellt (https://signup.heroku.com/)
2. Heroku CLI installiert
3. Git installiert und im PATH
4. Asana Personal Access Token
5. GitHub Webhook Secret

## Schritt 1: Heroku Authentifizierung

1. Öffnen Sie eine neue PowerShell-/Eingabeaufforderung
2. Führen Sie den folgenden Befehl aus:
   ```
   heroku login
   ```
3. Drücken Sie eine beliebige Taste, um den Browser zu öffnen
4. Melden Sie sich mit Ihren Heroku-Anmeldeinformationen an

## Schritt 2: Heroku App erstellen oder überprüfen

1. Navigieren Sie zum Projektverzeichnis:
   ```
   cd "d:\ - 2025 - 22.06- copy C\_AA_Postfach 01.01.2025\03.07.2025 Arbeit 02.11.2025\JurisMind - Mietrecht 01"
   ```

2. Überprüfen Sie, ob die App bereits existiert:
   ```
   heroku apps:info -a github-asana-integration-smartlaw
   ```

3. Wenn die App nicht existiert, erstellen Sie sie:
   ```
   heroku create github-asana-integration-smartlaw
   ```

## Schritt 3: Umgebungsvariablen konfigurieren

1. Legen Sie den Asana Access Token fest:
   ```
   heroku config:set ASANA_ACCESS_TOKEN=IHR_TATSÄCHLICHER_ASANA_TOKEN_HIER -a github-asana-integration-smartlaw
   ```

2. Legen Sie das GitHub Webhook Secret fest:
   ```
   heroku config:set GITHUB_WEBHOOK_SECRET=IHR_TATSÄCHLICHER_GITHUB_SECRET_HIER -a github-asana-integration-smartlaw
   ```

3. Legen Sie die Asana Workspace ID fest (optional):
   ```
   heroku config:set ASANA_WORKSPACE_ID=IHRE_TATSÄCHLICHE_WORKSPACE_ID_HIER -a github-asana-integration-smartlaw
   ```

## Schritt 4: Auf Heroku bereitstellen

1. Stellen Sie sicher, dass Sie sich im Projektverzeichnis befinden:
   ```
   cd "d:\ - 2025 - 22.06- copy C\_AA_Postfach 01.01.2025\03.07.2025 Arbeit 02.11.2025\JurisMind - Mietrecht 01"
   ```

2. Führen Sie die Bereitstellung durch:
   ```
   git push heroku main
   ```

## Schritt 5: Bereitstellung überprüfen

1. Überprüfen Sie den Anwendungsstatus:
   ```
   heroku ps -a github-asana-integration-smartlaw
   ```

2. Zeigen Sie die Anwendungsprotokolle an:
   ```
   heroku logs --tail -a github-asana-integration-smartlaw
   ```

## Schritt 6: GitHub Webhook konfigurieren

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

## Schritt 7: Integration testen

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