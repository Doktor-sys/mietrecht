@echo off
REM Erweiterter Mietrecht Urteilsagent mit echten Daten
REM Dieses Skript startet den erweiterten Mietrecht Agenten mit echten Datenquellen

echo Erweiterter Mietrecht Urteilsagent
echo ================================
echo Dieses Skript startet den erweiterten Mietrecht Agenten mit echten Datenquellen
echo.

REM Prüfen ob Node.js installiert ist
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Fehler: Node.js ist nicht installiert oder nicht im PATH
    echo Bitte installieren Sie Node.js von https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js Version: 
node --version
echo.

echo Starte erweiterten Mietrecht Urteilsagent...
echo.
node mietrecht_agent_real_data.js

echo.
echo Erweiterter Mietrecht Urteilsagent abgeschlossen.
pause