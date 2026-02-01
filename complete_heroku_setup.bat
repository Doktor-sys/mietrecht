@echo off
REM Vollständige Heroku-Setup und Bereitstellung
REM Dieses Skript führt alle notwendigen Schritte für das Heroku-Setup aus

echo ========================================
echo Heroku Setup und Bereitstellung
echo ========================================
echo.

echo Schritt 1: API-Token eingeben
echo --------------------------------
echo Bitte geben Sie Ihren Heroku API-Token ein:
echo (Kopieren Sie ihn von https://dashboard.heroku.com/account)
set /p api_token="API-Token: "

echo.
echo Schritt 2: Heroku CLI authentifizieren
echo --------------------------------------
set HEROKU_API_KEY=%api_token%
echo API-Token wurde gesetzt

echo.
echo Schritt 3: Authentifizierung überprüfen
echo --------------------------------------
heroku auth:whoami
if %errorlevel% neq 0 (
    echo ❌ Authentifizierung fehlgeschlagen
    echo Überprüfen Sie den API-Token und versuchen Sie es erneut
    pause
    exit /b 1
)
echo ✅ Authentifizierung erfolgreich

echo.
echo Schritt 4: Navigation zum Projektverzeichnis
echo ------------------------------------------
cd /d "d:\ - 2025 - 22.06- copy C\_AA_Postfach 01.01.2025\03.07.2025 Arbeit 02.11.2025\JurisMind - Mietrecht 01"
if %errorlevel% neq 0 (
    echo ❌ Fehler: Konnte nicht zum Projektverzeichnis navigieren
    pause
    exit /b 1
)
echo ✅ Projektverzeichnis erreicht

echo.
echo Schritt 5: Heroku App überprüfen/erstellen
echo ------------------------------------------
heroku apps:info -a github-asana-integration-smartlaw >nul 2>&1
if %errorlevel% neq 0 (
    echo Heroku App existiert nicht, erstelle neue App...
    heroku create github-asana-integration-smartlaw
    if %errorlevel% neq 0 (
        echo ❌ Fehler beim Erstellen der Heroku App
        pause
        exit /b 1
    )
    echo ✅ Heroku App erstellt
) else (
    echo ✅ Heroku App existiert bereits
)

echo.
echo Schritt 6: Umgebungsvariablen konfigurieren
echo ------------------------------------------
echo Bitte geben Sie Ihren Asana Personal Access Token ein:
set /p asana_token="Asana Token: "
heroku config:set ASANA_ACCESS_TOKEN=%asana_token% -a github-asana-integration-smartlaw

echo Bitte geben Sie Ihr GitHub Webhook Secret ein:
set /p github_secret="GitHub Secret: "
heroku config:set GITHUB_WEBHOOK_SECRET=%github_secret% -a github-asana-integration-smartlaw

echo Bitte geben Sie Ihre Asana Workspace ID ein (optional, Enter drücken zum Überspringen):
set /p workspace_id="Workspace ID: "
if defined workspace_id (
    heroku config:set ASANA_WORKSPACE_ID=%workspace_id% -a github-asana-integration-smartlaw
    echo ✅ Umgebungsvariablen konfiguriert
) else (
    echo ✅ Umgebungsvariablen konfiguriert (Workspace ID übersprungen)
)

echo.
echo Schritt 7: Auf Heroku bereitstellen
echo -----------------------------------
echo Bereitstellung läuft, bitte warten...
git push heroku main
if %errorlevel% neq 0 (
    echo ❌ Fehler bei der Bereitstellung
    echo Überprüfen Sie die Fehlermeldungen oben
    pause
    exit /b 1
)
echo ✅ Bereitstellung erfolgreich

echo.
echo Schritt 8: Anwendung überprüfen
echo -------------------------------
heroku ps -a github-asana-integration-smartlaw >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ Warnung: Anwendung läuft möglicherweise nicht korrekt
) else (
    echo ✅ Anwendung läuft erfolgreich
)

echo.
echo ========================================
echo Heroku Setup und Bereitstellung abgeschlossen!
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
echo Detaillierte Anweisungen finden Sie in der Datei CREATE_HEROKU_API_TOKEN.md
echo.
pause