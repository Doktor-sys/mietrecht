@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

set "TIMESTAMP=%DATE:/=-%_%TIME::=-%"
set "TIMESTAMP=!TIMESTAMP: =0!"
set "LOGFILE=web_app_debug_!TIMESTAMP!.log"

echo Starting debug session at %DATE% %TIME% > "%LOGFILE%"
echo ======================================== >> "%LOGFILE%"

title Mietrecht Web App - Debug Console
color 0A
mode con:cols=120 lines=40

echo [INFO] Debug-Sitzung gestartet am %DATE% %TIME%
echo [INFO] Log-Datei: %CD%\%LOGFILE%
echo.

REM Change to web app directory
cd /d "%~dp0mietrecht-webinterface"

echo [1] Prüfe Node.js...
where node >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo [FEHLER] Node.js nicht gefunden! >> "%LOGFILE%"
    echo [FEHLER] Node.js nicht gefunden! Bitte installieren Sie Node.js von https://nodejs.org/
    goto :error
) else (
    node --version >> "%LOGFILE%" 2>&1
    echo [OK] Node.js gefunden
)

echo [2] Installiere Abhängigkeiten...
call npm install --no-optional >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo [WARNUNG] Fehler bei der Installation der Abhängigkeiten, fahre fort...
    echo [WARNUNG] Fehler bei der Installation der Abhängigkeiten >> "%LOGFILE%"
)

echo [3] Starte Anwendung...
echo [INFO] Bitte warten, die Anwendung startet...
echo [INFO] Drücken Sie Strg+C, um die Anwendung zu beenden.
echo ========================================
echo.

echo [INFO] Starte Anwendung... >> "%LOGFILE%"
node server.js >> "%LOGFILE%" 2>&1
set "EXIT_CODE=!ERRORLEVEL!"

echo. >> "%LOGFILE%"
echo [INFO] Anwendung wurde mit Code !EXIT_CODE! beendet >> "%LOGFILE%"

if !EXIT_CODE! NEQ 0 (
    echo [FEHLER] Die Anwendung wurde unerwartet beendet (Fehlercode: !EXIT_CODE!)
    echo [FEHLER] Bitte überprüfen Sie die Log-Datei: %CD%\%LOGFILE%
) else (
    echo [INFO] Anwendung wurde ordnungsgemäß beendet.
)

goto :end

:error
echo [FEHLER] Ein kritischer Fehler ist aufgetreten.
echo [INFO] Bitte überprüfen Sie die Log-Datei: %CD%\%LOGFILE%

:end
echo.
echo ========================================
echo Debug-Informationen wurden gespeichert in:
echo %CD%\%LOGFILE%
echo ========================================
echo.
pause
exit /b 0
