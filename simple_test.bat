@echo off
title Mietrecht Agent - Debug Console
color 0A
mode con:cols=100 lines=30

:start
cls
echo ========================================
echo   Mietrecht Agent - Debug Konsole
echo ========================================
echo.

echo [1] Systemumgebung prüfen
where node >nul 2>&1
if errorlevel 1 (
    echo [FEHLER] Node.js ist nicht installiert oder nicht im PATH
    echo Bitte installieren Sie Node.js von https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js gefunden:
node --version

echo.
echo [2] Projektverzeichnis:
cd /d "%~dp0"
echo %CD%

if not exist "package.json" (
    echo [FEHLER] package.json nicht gefunden!
    pause
    exit /b 1
)

echo.
echo [3] Starte einfachen Test...
node -e "console.log('Test erfolgreich!');"
if errorlevel 1 (
    echo [FEHLER] Einfacher Test fehlgeschlagen
    pause
    exit /b 1
)

echo.
echo [4] Versuche Mietrecht Agent zu starten...
if not exist "scripts\mietrecht_agent_de.js" (
    echo [FEHLER] mietrecht_agent_de.js nicht gefunden!
    pause
    exit /b 1
)

node scripts/mietrecht_agent_de.js
set exit_code=%errorlevel%

echo.
if %exit_code% EQU 0 (
    echo [ERFOLG] Mietrecht Agent wurde erfolgreich beendet.
) else (
    echo [FEHLER] Mietrecht Agent wurde mit Fehlercode %exit_code% beendet.
)

echo.
echo ========================================
echo Drücken Sie eine beliebige Taste, um das Fenster zu schließen...
>nul pause
exit /b 0
