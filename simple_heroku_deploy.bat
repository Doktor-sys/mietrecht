@echo off
REM Einfache Heroku-Bereitstellung
REM Dieses Skript führt die grundlegenden Schritte zur Bereitstellung aus

title Einfache Heroku-Bereitstellung

echo.
echo =====================================================
echo        EINFACHE HEROKU-BEREITSTELLUNG
echo =====================================================
echo.
echo Diese Anleitung hilft Ihnen Schritt für Schritt
echo bei der Bereitstellung der GitHub-Asana Integration.
echo.
pause

cls
echo.
echo SCHREIBEN SIE DEN API-TOKEN IN EINE DATEI
echo ==========================================
echo.
echo 1. Öffnen Sie Notepad (Editor)
echo 2. Fügen Sie Ihren Heroku API-Token ein
echo 3. Speichern Sie die Datei unter:
echo    C:\heroku_token.txt
echo.
echo Drücken Sie eine beliebige Taste, wenn Sie dies erledigt haben...
pause

cls
echo.
echo LESEN DES API-TOKENS AUS DER DATEI
echo ====================================
echo.
if not exist "C:\heroku_token.txt" (
    echo ❌ Fehler: Datei C:\heroku_token.txt nicht gefunden
    echo Bitte erstellen Sie die Datei mit Ihrem API-Token
    pause
    exit /b 1
)

set /p api_token=<"C:\heroku_token.txt"
if "%api_token%"=="" (
    echo ❌ Fehler: Kein API-Token in der Datei gefunden
    pause
    exit /b 1
)

echo ✅ API-Token erfolgreich gelesen

echo.
echo SETZEN DES API-TOKENS ALS UMGEBUNGSVARIABLE
echo ============================================
set HEROKU_API_KEY=%api_token%
echo ✅ API-Token als Umgebungsvariable gesetzt

echo.
echo ÜBERPRÜFUNG DER AUTHENTIFIZIERUNG
echo =================================
heroku auth:whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Authentifizierung fehlgeschlagen
    echo Mögliche Ursachen:
    echo 1. API-Token ist ungültig
    echo 2. API-Token wurde nicht korrekt in die Datei geschrieben
    echo 3. API-Token wurde abgeschnitten (zu kurz)
    echo.
    echo Lösung:
    echo 1. Überprüfen Sie den API-Token auf https://dashboard.heroku.com/account
    echo 2. Kopieren Sie den vollständigen Token
    echo 3. Speichern Sie ihn erneut in C:\heroku_token.txt
    pause
    exit /b 1
)

echo ✅ Authentifizierung erfolgreich
timeout /t 2 /nobreak >nul

cls
echo.
echo NAVIGATION ZUM PROJEKTVERZEICHNIS
echo ==================================
cd /d "d:\ - 2025 - 22.06- copy C\_AA_Postfach 01.01.2025\03.07.2025 Arbeit 02.11.2025\JurisMind - Mietrecht 01"
if %errorlevel% neq 0 (
    echo ❌ Fehler: Konnte nicht zum Projektverzeichnis navigieren
    pause
    exit /b 1
)
echo ✅ Projektverzeichnis erreicht

echo.
echo ÜBERPRÜFUNG/ERSTELLUNG DER HEROKU APP
echo ======================================
heroku apps:info -a github-asana-integration-smartlaw >nul 2>&1
if %errorlevel% neq 0 (
    echo Heroku App existiert nicht, erstelle neue App...
    heroku create github-asana-integration-smartlaw
    if %errorlevel% neq 0 (
        echo ❌ Fehler beim Erstellen der Heroku App
        echo Möglicherweise ist der App-Name bereits vergeben
        pause
        exit /b 1
    )
    echo ✅ Heroku App erstellt
) else (
    echo ✅ Heroku App existiert bereits
)

timeout /t 2 /nobreak >nul

cls
echo.
echo ERSTELLEN DER UMGEBUNGSVARIABLEN-DATEI
echo ======================================
echo.
echo Jetzt müssen Sie Ihre Zugangsdaten eingeben:
echo.
echo 1. Asana Personal Access Token
echo 2. GitHub Webhook Secret
echo 3. Asana Workspace ID (optional)
echo.
echo ÖFFNEN SIE DIE DATEI "C:\heroku_config.txt" IN NOTEPAD
echo UND TRAGEN SIE DIE FOLGENDEN ZEILEN EIN:
echo.
echo ASANA_TOKEN=Ihr_Asana_Token_hier
echo GITHUB_SECRET=Ihr_GitHub_Secret_hier
echo WORKSPACE_ID=Ihre_Workspace_ID_hier_(optional)
echo.
echo Drücken Sie eine beliebige Taste, wenn Sie die Datei erstellt haben...
pause

notepad "C:\heroku_config.txt"
echo.
echo Drücken Sie eine beliebige Taste, wenn Sie die Datei gespeichert haben...
pause

cls
echo.
echo LESEN DER KONFIGURATIONSDATEI
echo =============================
echo.
if not exist "C:\heroku_config.txt" (
    echo ❌ Fehler: Datei C:\heroku_config.txt nicht gefunden
    pause
    exit /b 1
)

:: Standardwerte setzen
set asana_token=
set github_secret=
set workspace_id=

:: Konfigurationsdatei lesen
for /f "tokens=*" %%i in (C:\heroku_config.txt) do (
    set line=%%i
    if "!line:~0,12!"=="ASANA_TOKEN=" (
        set asana_token=!line:~12!
    )
    if "!line:~0,15!"=="GITHUB_SECRET=" (
        set github_secret=!line:~15!
    )
    if "!line:~0,13!"=="WORKSPACE_ID=" (
        set workspace_id=!line:~13!
    )
)

if "%asana_token%"=="" (
    echo ❌ Fehler: ASANA_TOKEN nicht in der Konfigurationsdatei gefunden
    pause
    exit /b 1
)

if "%github_secret%"=="" (
    echo ❌ Fehler: GITHUB_SECRET nicht in der Konfigurationsdatei gefunden
    pause
    exit /b 1
)

echo ✅ Konfiguration erfolgreich gelesen

echo.
echo SETZEN DER UMGEBUNGSVARIABLEN IN HEROKU
echo =======================================
heroku config:set ASANA_ACCESS_TOKEN=%asana_token% -a github-asana-integration-smartlaw
if %errorlevel% neq 0 (
    echo ❌ Fehler beim Setzen der Asana-Token-Variable
    pause
    exit /b 1
)

heroku config:set GITHUB_WEBHOOK_SECRET=%github_secret% -a github-asana-integration-smartlaw
if %errorlevel% neq 0 (
    echo ❌ Fehler beim Setzen der GitHub-Secret-Variable
    pause
    exit /b 1
)

if not "%workspace_id%"=="" (
    heroku config:set ASANA_WORKSPACE_ID=%workspace_id% -a github-asana-integration-smartlaw
    if %errorlevel% neq 0 (
        echo ⚠ Warnung: Fehler beim Setzen der Workspace-ID-Variable (fortfahren)
    ) else (
        echo ✅ Workspace-ID gesetzt
    )
) else (
    echo ℹ Workspace-ID übersprungen (optional)
)

echo ✅ Umgebungsvariablen konfiguriert

timeout /t 2 /nobreak >nul

cls
echo.
echo START DER BEREITSTELLUNG
echo =======================
echo.
echo Die Bereitstellung wird jetzt gestartet...
echo Dies kann einige Minuten dauern.
echo.
git push heroku main
if %errorlevel% neq 0 (
    echo ❌ Fehler bei der Bereitstellung
    echo Mögliche Ursachen:
    echo 1. Netzwerkprobleme
    echo 2. Git-Konfigurationsprobleme
    echo 3. Heroku-Serverprobleme
    pause
    exit /b 1
)
echo ✅ Bereitstellung erfolgreich abgeschlossen

echo.
echo ÜBERPRÜFUNG DER ANWENDUNG
echo ========================
heroku ps -a github-asana-integration-smartlaw >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ Warnung: Anwendung läuft möglicherweise nicht korrekt
) else (
    echo ✅ Anwendung läuft erfolgreich
)

echo.
echo =====================================================
echo        BEREITSTELLUNG ABGESCHLOSSEN!
echo =====================================================
echo.
echo IHRE ANWENDUNG IST JETZT VERFÜGBAR UNTER:
echo https://github-asana-integration-smartlaw.herokuapp.com
echo.
echo NÄCHSTE SCHRITTE:
echo 1. Konfigurieren Sie den GitHub Webhook mit der URL:
echo    https://github-asana-integration-smartlaw.herokuapp.com/webhook/github
echo.
echo 2. Testen Sie die Integration mit einem Commit:
echo    git commit -m "task-123: Test-Commit" --allow-empty
echo    git push origin main
echo.
echo 3. Überprüfen Sie die Protokolle mit:
echo    heroku logs --tail -a github-asana-integration-smartlaw
echo.
echo WICHTIGE DATEIEN:
echo - API-Token wurde aus C:\heroku_token.txt gelesen
echo - Konfiguration wurde aus C:\heroku_config.txt gelesen
echo - Sie können diese Dateien jetzt löschen, um Sicherheit zu gewährleisten
echo.
echo Drücken Sie eine beliebige Taste, um das Fenster zu schließen...
pause