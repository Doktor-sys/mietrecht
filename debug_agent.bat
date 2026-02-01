@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

REM Log-Datei im gleichen Verzeichnis erstellen
set "LOGFILE=debug_log_%date:/=-%_%time::=-%.txt"
set "LOGFILE=!LOGFILE: =_!"

echo Debug-Sitzung startet am %date% %time% > "%LOGFILE%"
echo ======================================= >> "%LOGFILE%"
echo. >> "%LOGFILE%"

echo [DEBUG] Starte Mietrecht Agent in Debug-Modus...
echo [DEBUG] Log wird gespeichert in: %CD%\%LOGFILE%

REM 1. Systemumgebung prüfen
echo. >> "%LOGFILE%"
echo === Systemumgebung ====================== >> "%LOGFILE%"
ver >> "%LOGFILE%"
echo. >> "%LOGFILE%"

REM 2. Node.js Installation prüfen
where node >nul 2>&1
if errorlevel 1 (
    echo [FEHLER] Node.js ist nicht installiert oder nicht im PATH. >> "%LOGFILE%"
    echo [FEHLER] Bitte installieren Sie Node.js von https://nodejs.org/ >> "%LOGFILE%"
    goto :error
) else (
    echo [OK] Node.js gefunden: >> "%LOGFILE%"
    node --version >> "%LOGFILE%" 2>&1
)

REM 3. npm Version prüfen
where npm >nul 2>&1
if errorlevel 1 (
    echo [WARNUNG] npm nicht gefunden. >> "%LOGFILE%"
) else (
    echo [OK] npm gefunden: >> "%LOGFILE%"
    npm --version >> "%LOGFILE%" 2>&1
)

REM 4. Projektabhängigkeiten prüfen
if not exist "node_modules" (
    echo [INFO] Installiere Projektabhängigkeiten... >> "%LOGFILE%"
    npm install --no-optional >> "%LOGFILE%" 2>&1
    if errorlevel 1 (
        echo [FEHLER] Fehler bei der Installation der Abhängigkeiten. >> "%LOGFILE%"
        goto :error
    )
)

REM 5. Starte den Agenten mit Debug-Ausgabe
echo. >> "%LOGFILE%"
echo === Starte Mietrecht Agent ============== >> "%LOGFILE%"
node scripts/mietrecht_agent_de.js >> "%LOGFILE%" 2>&1
set "EXIT_CODE=%ERRORLEVEL%"

echo. >> "%LOGFILE%"
if %EXIT_CODE% EQU 0 (
    echo [ERFOLG] Mietrecht Agent wurde erfolgreich beendet. >> "%LOGFILE%"
) else (
    echo [FEHLER] Mietrecht Agent wurde mit Fehlercode %EXIT_CODE% beendet. >> "%LOGFILE%"
)

goto :end

:error
echo. >> "%LOGFILE%"
echo === FEHLER AUFGETRETEN ================== >> "%LOGFILE%"
echo Ein Fehler ist aufgetreten. Bitte überprüfen Sie die Log-Datei: %CD%\%LOGFILE% >> "%LOGFILE%"

:end
echo. >> "%LOGFILE%"
echo ======================================= >> "%LOGFILE%"
echo Debug-Sitzung beendet am %date% %time% >> "%LOGFILE%"

echo.
echo =======================================
echo  Debug-Informationen wurden gespeichert in:
echo  %CD%\%LOGFILE%
echo =======================================
echo.
pause
