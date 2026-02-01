@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================================
echo   Mietrecht Agent - Testumgebung
echo ========================================================
echo.

REM Check for Node.js installation
where node >nul 2>&1
if errorlevel 1 (
    echo [FEHLER] Node.js ist nicht installiert.
    echo Bitte installieren Sie Node.js von https://nodejs.org/
    pause
    exit /b 1
)

REM Check for npm
where npm >nul 2>&1
if errorlevel 1 (
    echo [FEHLER] npm ist nicht verfügbar.
    echo Bitte stellen Sie sicher, dass Node.js korrekt installiert ist.
    pause
    exit /b 1
)

echo [INFO] Prüfe Systemvoraussetzungen...
node -v
npm -v
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installiere Abhängigkeiten...
    call npm install
    if errorlevel 1 (
        echo [FEHLER] Fehler bei der Installation der Abhängigkeiten.
        pause
        exit /b 1
    )
)

echo [INFO] Starte Tests...
echo.

REM Run unit tests
echo [TEST] Führe Unit-Tests aus...
call npm test -- --testPathIgnorePatterns=integration --testPathIgnorePatterns=e2e
if errorlevel 1 (
    echo [FEHLER] Unit-Tests fehlgeschlagen.
    pause
    exit /b 1
)

REM Run integration tests
echo.
echo [TEST] Führe Integrationstests aus...
call npm run test:integration
if errorlevel 1 (
    echo [WARNUNG] Einige Integrationstests sind fehlgeschlagen.
    echo Fortfahren mit den verbleibenden Tests...
)

REM Run notification tests
echo.
echo [TEST] Überprüfe Benachrichtigungen...
call npm run test:notifications
if errorlevel 1 (
    echo [WARNUNG] Probleme mit Benachrichtigungen gefunden.
)

echo.
echo ========================================================
echo   Testabschluss
echo ========================================================
echo [ERFOLG] Grundlegende Tests wurden erfolgreich abgeschlossen!
echo.
echo Nächste Schritte:
echo 1. Detaillierte Testberichte finden Sie im Ordner 'reports/'
echo 2. Für erweiterte Tests führen Sie 'npm run test:e2e' aus
echo 3. Starten Sie die Anwendung mit 'npm start' oder 'start_local_simple_improved.bat'
echo.
pause
