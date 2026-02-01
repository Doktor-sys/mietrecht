@echo off
chcp 65001 >nul

echo ========================================================
echo   SmartLaw Mietrecht - Simple Starter 🚀
echo ========================================================
echo.

REM Starte Backend
echo Starte Backend...
start "Backend" cmd /k "cd services\backend && npm install --legacy-peer-deps && npm run dev"

REM Warte 10 Sekunden
timeout /t 10 /nobreak >nul

REM Starte Web App
echo Starte Web App...
start "Web App" cmd /k "cd web-app && npm install --legacy-peer-deps && npm start"

echo.
echo Services:
echo   - Backend: http://localhost:3001
echo   - Web App: http://localhost:3000
echo.
echo Druecken Sie eine beliebige Taste zum Beenden...
pause >nul

REM Beende alle Node-Prozesse
taskkill /f /im node.exe >nul 2>&1

exit