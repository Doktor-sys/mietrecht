# Heroku API-Token erstellen und verwenden

## Übersicht

Da Ihr Heroku-Konto MFA (Multi-Factor Authentication) aktiviert hat und Sie einen FIDO-Schlüssel besitzen, müssen Sie einen API-Token erstellen, um die CLI zu authentifizieren.

## Schritt 1: Heroku API-Token erstellen

1. Öffnen Sie einen Webbrowser und gehen Sie zu https://dashboard.heroku.com/account

2. Melden Sie sich mit Ihrer E-Mail und Ihrem Passwort an

3. Führen Sie die MFA-Authentifizierung mit Ihrem FIDO-Schlüssel durch:
   - Wenn Sie dazu aufgefordert werden, tippen Sie auf Ihren FIDO-Schlüssel
   - Befolgen Sie die Anweisungen auf dem Bildschirm

4. Scrollen Sie zum Abschnitt "API Key" auf der Account-Seite

5. Klicken Sie auf die Schaltfläche "Reveal" neben "API Key"

6. Kopieren Sie den angezeigten API-Token (ein langer String aus Buchstaben und Zahlen)

## Schritt 2: Heroku CLI mit API-Token authentifizieren

Öffnen Sie eine neue PowerShell-/Eingabeaufforderung und führen Sie die folgenden Befehle aus:

1. Setzen Sie den API-Token als Umgebungsvariable:
   ```powershell
   $env:HEROKU_API_KEY="IHRE_KOPIERTE_API_TOKEN_HIER"
   ```

2. Überprüfen Sie die Authentifizierung:
   ```powershell
   heroku auth:whoami
   ```

   Wenn die Authentifizierung erfolgreich ist, sollte Ihre Heroku-E-Mail-Adresse angezeigt werden.

## Schritt 3: Heroku App erstellen oder überprüfen

Nach erfolgreicher Authentifizierung können Sie die App erstellen oder überprüfen:

1. Überprüfen Sie, ob die App bereits existiert:
   ```powershell
   heroku apps:info -a github-asana-integration-smartlaw
   ```

2. Wenn die App nicht existiert, erstellen Sie sie:
   ```powershell
   heroku create github-asana-integration-smartlaw
   ```

## Schritt 4: Umgebungsvariablen konfigurieren

Legen Sie die erforderlichen Umgebungsvariablen fest:

1. Asana Access Token:
   ```powershell
   heroku config:set ASANA_ACCESS_TOKEN=IHR_TATSÄCHLICHER_ASANA_TOKEN_HIER -a github-asana-integration-smartlaw
   ```

2. GitHub Webhook Secret:
   ```powershell
   heroku config:set GITHUB_WEBHOOK_SECRET=IHR_TATSÄCHLICHER_GITHUB_SECRET_HIER -a github-asana-integration-smartlaw
   ```

3. Asana Workspace ID (optional):
   ```powershell
   heroku config:set ASANA_WORKSPACE_ID=IHRE_TATSÄCHLICHE_WORKSPACE_ID_HIER -a github-asana-integration-smartlaw
   ```

## Schritt 5: Auf Heroku bereitstellen

Navigieren Sie zum Projektverzeichnis und führen Sie die Bereitstellung durch:
```powershell
cd "d:\ - 2025 - 22.06- copy C\_AA_Postfach 01.01.2025\03.07.2025 Arbeit 02.11.2025\JurisMind - Mietrecht 01"
git push heroku main
```

## Fehlerbehebung

Wenn Sie Probleme mit der Authentifizierung haben:

1. Stellen Sie sicher, dass der API-Token korrekt kopiert wurde (ohne Leerzeichen am Anfang oder Ende)
2. Überprüfen Sie, ob der API-Token nicht abgelaufen ist
3. Erstellen Sie ggf. einen neuen API-Token in den Heroku-Account-Einstellungen

## Support

Für weitere Hilfe wenden Sie sich an:
- Heroku Support: https://help.heroku.com/