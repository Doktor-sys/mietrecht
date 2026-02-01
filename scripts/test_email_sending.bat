@echo off
REM Test Email Sending for Mietrecht Agent
REM Dieses Skript testet den E-Mail-Versand des Mietrecht Agents

echo Teste E-Mail-Versand des Mietrecht Agents
echo ======================================
echo Dieses Skript testet den E-Mail-Versand des Mietrecht Agents
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

echo Starte E-Mail-Versand-Test...
echo.
npm run test:email

echo.
echo E-Mail-Versand-Test abgeschlossen.
pause