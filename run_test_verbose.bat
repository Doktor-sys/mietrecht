@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================================
echo   Mietrecht Agent - Verbesserte Testumgebung
echo ========================================================
echo.

echo [DEBUG] Aktuelles Verzeichnis: %CD%
echo [DEBUG] Umgebungsvariablen:
set PATH
echo.

REM Check for Node.js installation
where node >nul 2>&1
if errorlevel 1 (
    echo [FEHLER] Node.js ist nicht installiert.
    echo Bitte installieren Sie Node.js von https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [OK] Node.js gefunden:
    node -v
)

REM Check for npm
where npm >nul 2>&1
if errorlevel 1 (
    echo [FEHLER] npm ist nicht verfügbar.
    echo Bitte stellen Sie sicher, dass Node.js korrekt installiert ist.
    pause
    exit /b 1
) else (
    echo [OK] npm gefunden:
    npm -v
)

echo.
echo [INFO] Prüfe Projektstruktur...
if not exist "package.json" (
    echo [FEHLER] package.json nicht gefunden. Bitte führen Sie das Skript aus dem Projektverzeichnis aus.
    pause
    exit /b 1
)

echo [OK] Projektstruktur in Ordnung.
echo.

echo [INFO] Starte Tests...
echo.

echo [TEST] Führe einfachen Test aus...
node -e "console.log('Test erfolgreich ausgeführt!')"
if errorlevel 1 (
    echo [FEHLER] Einfacher Test fehlgeschlagen.
) else (
    echo [OK] Einfacher Test erfolgreich.
)

echo.
echo ========================================================
echo   Testabschluss
echo ========================================================
echo.
echo Nächste Schritte:
echo 1. Manuelles Testen der Anwendung:
echo    - npm start               - Startet die Anwendung
echo    - npm test               - Führt alle Tests aus
echo    - npm run test:integration - Führt Integrationstests aus
echo.
echo 2. Weitere Optionen:
echo    - start_local_simple_improved.bat - Startet die lokale Entwicklungsumgebung
echo.
pause
