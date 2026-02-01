@echo off
REM Heroku API-Token Authentifizierung
REM Dieses Skript hilft bei der Authentifizierung mit einem API-Token

echo ========================================
echo Heroku API-Token Authentifizierung
echo ========================================
echo.

echo Schritt 1: API-Token eingeben
echo --------------------------------
echo Bitte geben Sie Ihren Heroku API-Token ein:
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
echo Schritt 4: Heroku App überprüfen
echo --------------------------------
heroku apps:info -a github-asana-integration-smartlaw >nul 2>&1
if %errorlevel% neq 0 (
    echo Heroku App existiert nicht, erstelle neue App...
    heroku create github-asana-integration-smartlaw
    if %errorlevel% neq 0 (
        echo Fehler beim Erstellen der Heroku App
        pause
        exit /b 1
    )
    echo ✅ Heroku App erstellt
) else (
    echo ✅ Heroku App existiert bereits
)

echo.
echo ========================================
echo API-Token Authentifizierung abgeschlossen!
echo ========================================
echo.
echo Sie können nun mit der Bereitstellung fortfahren:
echo 1. Umgebungsvariablen konfigurieren
echo 2. Auf Heroku bereitstellen
echo.
echo Detaillierte Anweisungen finden Sie in der Datei HEROKU_API_TOKEN_INSTRUCTIONS.md
echo.
pause