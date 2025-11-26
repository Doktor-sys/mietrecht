@echo off
REM Mietrecht Urteilsagent Batch-Datei
REM Dieses Skript startet den deutschen Mietrecht Urteilsagent-Prototyp

echo Mietrecht Urteilsagent Prototyp
echo ==============================
echo Dieses Skript demonstriert die Funktionalitaet des Mietrecht Urteilsagents
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

echo Starte Mietrecht Urteilsagent Prototyp...
echo.
node mietrecht_agent_de.js

echo.
echo Mietrecht Urteilsagent Prototyp abgeschlossen.
pause