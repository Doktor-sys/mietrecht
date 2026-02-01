@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================================
echo   SmartLaw Mietrecht - Vollständiges Programm 🚀
echo ========================================================
echo.

REM Prüfe ob Docker läuft
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker läuft nicht. Bitte starte Docker Desktop.
    pause
    exit /b 1
)

REM Sicherstellen dass .env Dateien existieren
if not exist "services\backend\.env" (
    echo [INFO] Erstelle Standard-Backend .env...
    echo PORT=3001 > services\backend\.env
    echo NODE_ENV=development >> services\backend\.env
    echo DATABASE_URL=postgresql://smartlaw_user:smartlaw_password@localhost:5432/smartlaw_dev >> services\backend\.env
    echo REDIS_URL=redis://localhost:6379 >> services\backend\.env
    echo JWT_SECRET=dev-secret-key-12345 >> services\backend\.env
)

if not exist "web-app\.env" (
    echo [INFO] Erstelle Standard-Web-App .env...
    echo REACT_APP_API_URL=http://localhost:3001 > web-app\.env
)

echo [INFO] Starte alle Container...
echo (Dies kann beim ersten Mal ein paar Minuten dauern)
docker-compose -f docker-compose.mietrecht_full.yml up -d

echo.
echo [INFO] Warte auf den Start der Services...
timeout /t 10 /nobreak >nul

echo.
echo [INFO] Öffne Mietrecht Flask-App im Browser (Port 5000)...
start http://localhost:5000

echo.
echo ========================================================
echo   Das Programm wurde gestartet! 🎉
echo   Flask-App (Mietrecht) läuft auf: http://localhost:5000
echo   Backend (Node.js) läuft auf: http://localhost:3001
echo   Frontend (React) läuft auf: http://localhost:7000
echo ========================================================
echo.
echo Drücke eine Taste, um die Protokolle (Logs) anzuzeigen...
pause >nul
docker-compose -f docker-compose.mietrecht_full.yml logs -f
