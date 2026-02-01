@echo off
REM Vollständige Bereitstellung der GitHub-Asana Integration
REM Dieses Skript führt alle notwendigen Schritte für die Bereitstellung aus

echo ========================================
echo GitHub-Asana Integration Bereitstellung
echo ========================================
echo.

echo Schritt 1: Heroku Authentifizierung...
echo ----------------------------------------
echo Bitte melden Sie sich im geöffneten Browser mit Ihren Heroku-Anmeldeinformationen an.
echo Drücken Sie eine beliebige Taste, um fortzufahren...
pause >nul
heroku login

echo.
echo Schritt 2: Heroku App Überprüfung...
echo ----------------------------------------
heroku apps:info -a github-asana-integration-smartlaw >nul 2>&1
if %errorlevel% neq 0 (
    echo Erstelle Heroku App...
    heroku create github-asana-integration-smartlaw
    if %errorlevel% neq 0 (
        echo Fehler beim Erstellen der Heroku App
        pause
        exit /b 1
    )
) else (
    echo Heroku App ist bereits vorhanden
)

echo.
echo Schritt 3: Umgebungsvariablen konfigurieren...
echo ----------------------------------------
echo Bitte geben Sie Ihre Asana Personal Access Token ein:
set /p asana_token="Token: "
heroku config:set ASANA_ACCESS_TOKEN=%asana_token% -a github-asana-integration-smartlaw

echo Bitte geben Sie Ihr GitHub Webhook Secret ein:
set /p github_secret="Secret: "
heroku config:set GITHUB_WEBHOOK_SECRET=%github_secret% -a github-asana-integration-smartlaw

echo Bitte geben Sie Ihre Asana Workspace ID ein (optional, Enter drücken zum Überspringen):
set /p workspace_id="Workspace ID: "
if defined workspace_id (
    heroku config:set ASANA_WORKSPACE_ID=%workspace_id% -a github-asana-integration-smartlaw
)

echo.
echo Schritt 4: Auf Heroku bereitstellen...
echo ----------------------------------------
echo Bereitstellung läuft...
git push heroku main
if %errorlevel% neq 0 (
    echo Fehler bei der Bereitstellung
    pause
    exit /b 1
)

echo.
echo Schritt 5: Anwendung überprüfen...
echo ----------------------------------------
heroku ps -a github-asana-integration-smartlaw >nul 2>&1
if %errorlevel% neq 0 (
    echo Warnung: Anwendung läuft möglicherweise nicht korrekt
) else (
    echo Anwendung läuft erfolgreich
)

echo.
echo ========================================
echo Bereitstellung abgeschlossen!
echo ========================================
echo.
echo Nächste Schritte:
echo 1. Konfigurieren Sie den GitHub Webhook mit der URL:
echo    https://github-asana-integration-smartlaw.herokuapp.com/webhook/github
echo.
echo 2. Testen Sie die Integration mit einem Commit, der eine Task-ID enthält
echo.
echo 3. Überprüfen Sie die Protokolle mit: heroku logs --tail -a github-asana-integration-smartlaw
echo.
echo 4. Öffnen Sie die Anwendung im Browser mit: heroku open -a github-asana-integration-smartlaw
echo.
pause