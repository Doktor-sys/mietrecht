# Heroku API-Token Erstellung und Verwendung

## Übersicht

Da für Ihr Heroku-Konto die Multi-Faktor-Authentifizierung (MFA) aktiviert ist, müssen Sie einen API-Token erstellen, um die CLI zu authentifizieren.

## Schritt 1: Heroku API-Token erstellen

1. Öffnen Sie einen Webbrowser und melden Sie sich bei Ihrem Heroku-Konto an:
   - Gehen Sie zu https://id.heroku.com/login
   - Melden Sie sich mit Ihrer E-Mail und Ihrem Passwort an
   - Führen Sie die MFA-Authentifizierung durch

2. Navigieren Sie zu den Account-Einstellungen:
   - Klicken Sie in der oberen rechten Ecke auf Ihr Profilbild
   - Wählen Sie "Account settings" aus dem Dropdown-Menü

3. API-Token erstellen:
   - Scrollen Sie zum Abschnitt "API Key"
   - Klicken Sie auf die Schaltfläche "Reveal" oder "Show API Key"
   - Kopieren Sie den angezeigten API-Token

## Schritt 2: Heroku CLI mit API-Token authentifizieren

1. Öffnen Sie eine neue PowerShell-/Eingabeaufforderung

2. Führen Sie den folgenden Befehl aus und ersetzen Sie `IHRE_EMAIL` durch Ihre Heroku-E-Mail und `IHRE_API_TOKEN` durch den kopierten API-Token:
   ```
   heroku autocomplete --refresh-cache
   $env:HEROKU_API_KEY="IHRE_API_TOKEN"
   heroku auth:whoami
   ```

   Oder alternativ:
   ```
   heroku auth:token
   ```
   Und dann den API-Token eingeben, wenn Sie dazu aufgefordert werden.

## Schritt 3: Heroku App erstellen oder überprüfen

Nach erfolgreicher Authentifizierung können Sie die App erstellen oder überprüfen:

1. Überprüfen Sie, ob die App bereits existiert:
   ```
   heroku apps:info -a github-asana-integration-smartlaw
   ```

2. Wenn die App nicht existiert, erstellen Sie sie:
   ```
   heroku create github-asana-integration-smartlaw
   ```

## Schritt 4: Umgebungsvariablen konfigurieren

Legen Sie die erforderlichen Umgebungsvariablen fest:

1. Asana Access Token:
   ```
   heroku config:set ASANA_ACCESS_TOKEN=IHR_TATSÄCHLICHER_ASANA_TOKEN_HIER -a github-asana-integration-smartlaw
   ```

2. GitHub Webhook Secret:
   ```
   heroku config:set GITHUB_WEBHOOK_SECRET=IHR_TATSÄCHLICHER_GITHUB_SECRET_HIER -a github-asana-integration-smartlaw
   ```

3. Asana Workspace ID (optional):
   ```
   heroku config:set ASANA_WORKSPACE_ID=IHRE_TATSÄCHLICHE_WORKSPACE_ID_HIER -a github-asana-integration-smartlaw
   ```

## Schritt 5: Auf Heroku bereitstellen

Führen Sie die Bereitstellung durch:
```
git push heroku main
```

## Fehlerbehebung

Wenn Sie Probleme mit der Authentifizierung haben:

1. Stellen Sie sicher, dass der API-Token korrekt kopiert wurde
2. Überprüfen Sie, ob der API-Token nicht abgelaufen ist
3. Erstellen Sie ggf. einen neuen API-Token in den Heroku-Account-Einstellungen

## Support

Für weitere Hilfe wenden Sie sich an:
- Heroku Support: https://help.heroku.com/