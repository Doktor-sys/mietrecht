@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

title Mietrecht Web App - Test Console
color 0A
mode con:cols=100 lines=30

:start
cls
echo ========================================
echo   Mietrecht Web App - Test Console
echo ========================================
echo.

REM Change to the web interface directory
cd /d "%~dp0mietrecht-webinterface"

REM Check if we're in the correct directory
if not exist "package.json" (
    echo [FEHLER] Web-App-Verzeichnis nicht gefunden!
    echo Bitte stellen Sie sicher, dass das Verzeichnis 'mietrecht-webinterface' existiert.
    pause
    exit /b 1
)

echo [1] Prüfe Node.js Installation...
where node >nul 2>&1
if errorlevel 1 (
    echo [FEHLER] Node.js ist nicht installiert oder nicht im PATH.
    echo Bitte installieren Sie Node.js von https://nodejs.org/
    pause
    exit /b 1
)

node --version

REM Check for npm
echo.
echo [2] Prüfe npm Installation...
where npm >nul 2>&1
if errorlevel 1 (
    echo [WARNUNG] npm nicht gefunden. Versuche Fortsetzung...
) else (
    npm --version
)

REM Install dependencies if node_modules doesn't exist
echo.
echo [3] Prüfe Abhängigkeiten...
if not exist "node_modules" (
    echo [INFO] Installiere Abhängigkeiten...
    call npm install --no-optional
    if errorlevel 1 (
        echo [WARNUNG] Fehler bei der Installation der Abhängigkeiten.
        echo Fortsetzung ohne Aktualisierung der Abhängigkeiten...
    )
) else (
    echo [OK] Abhängigkeiten sind installiert.
)

REM Start the web application
echo.
echo [4] Starte Mietrecht Web App...
echo [INFO] Die Anwendung startet jetzt. Bitte warten...
echo [HINWEIS] Drücken Sie Strg+C, um die Anwendung zu beenden.
echo.
echo ========================================

REM Run the web application
call npm start

REM This will only be reached if the application exits
if errorlevel 1 (
    echo.
    echo [FEHLER] Die Anwendung wurde unerwartet beendet.
    echo Bitte überprüfen Sie die obigen Fehlermeldungen.
)

echo.
pause
exit /b 0
