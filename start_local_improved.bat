@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================================
echo   SmartLaw Mietrecht - Improved Local Starter 🚀
echo ========================================================
echo.

REM Wechsle zum Verzeichnis des Skripts
cd /d "%~dp0"

REM Prüfe Node.js Installation
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js nicht gefunden.
    echo Bitte installieren Sie Node.js von https://nodejs.org/
    pause
    exit /b 1
)

REM Prüfe npm Installation
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm nicht gefunden.
    echo Bitte installieren Sie Node.js mit npm von https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js und npm gefunden
echo.

REM Erstelle benötigte Verzeichnisse
if not exist "services\backend" mkdir services\backend
if not exist "web-app" mkdir web-app

REM Erstelle .env Dateien falls nicht vorhanden
echo [INFO] Erstelle Umgebungsdateien...

REM Backend .env
if not exist "services\backend\.env" (
    echo [INFO] Erstelle services\backend\.env...
    echo PORT=3001 > services\backend\.env
    echo NODE_ENV=development >> services\backend\.env
    echo DATABASE_URL=postgresql://postgres:password@localhost:5432/smartlaw_dev >> services\backend\.env
)

REM Web App .env
if not exist "web-app\.env" (
    echo [INFO] Erstelle web-app\.env...
    echo REACT_APP_API_URL=http://localhost:3001 > web-app\.env
    echo REACT_APP_ENV=development >> web-app\.env
)

REM Installiere Backend-Abhängigkeiten
echo [INFO] Installiere Backend-Abhängigkeiten...
cd services\backend

REM Lösche alte node_modules und Cache
if exist "node_modules" rd /s /q node_modules >nul 2>&1
if exist "package-lock.json" del package-lock.json >nul 2>&1
npm cache clean --force >nul 2>&1

REM Installiere mit verschiedenen Methoden
npm install --legacy-peer-deps --silent
if %errorlevel% neq 0 (
    echo [WARN] --legacy-peer-deps fehlgeschlagen, versuche normale Installation...
    npm install --silent
    if %errorlevel% neq 0 (
        echo [WARN] Normale Installation fehlgeschlagen, versuche mit --force...
        npm install --force --silent
    )
)

if %errorlevel% neq 0 (
    echo [ERROR] Backend-Abhängigkeiten Installation fehlgeschlagen.
    cd ..\..
    pause
    exit /b 1
)

cd ..\..

REM Installiere Web-App-Abhängigkeiten
echo [INFO] Installiere Web-App-Abhängigkeiten...
cd web-app

REM Lösche alte node_modules und Cache
if exist "node_modules" rd /s /q node_modules >nul 2>&1
if exist "package-lock.json" del package-lock.json >nul 2>&1
npm cache clean --force >nul 2>&1

REM Installiere mit verschiedenen Methoden
npm install --legacy-peer-deps --silent
if %errorlevel% neq 0 (
    echo [WARN] --legacy-peer-deps fehlgeschlagen, versuche normale Installation...
    npm install --silent
    if %errorlevel% neq 0 (
        echo [WARN] Normale Installation fehlgeschlagen, versuche mit --force...
        npm install --force --silent
    )
)

if %errorlevel% neq 0 (
    echo [ERROR] Web-App-Abhängigkeiten Installation fehlgeschlagen.
    cd ..
    pause
    exit /b 1
)

cd ..

REM Starte Services in separaten Prozessen
echo.
echo [INFO] Starte Backend und Web-App...
echo.

REM Starte Backend im Entwicklungsmodus
echo [INFO] Starte Backend Service...
start "SmartLaw Backend" cmd /k "cd services\backend && npm run dev"

REM Warte kurz für Datenbankinitialisierung
timeout /t 10 /nobreak >nul

REM Starte Web-App
echo [INFO] Starte Web-App...
start "SmartLaw Web App" cmd /k "cd web-app && npm start"

echo.
echo ========================================================
echo   Lokale Umgebung gestartet! 🎉
echo ========================================================
echo.
echo Services:
echo   - Backend: http://localhost:3001
echo   - Web App: http://localhost:3000
echo.
echo Hinweis: Die Services laufen in separaten Konsolenfenstern
echo.
echo Drücken Sie eine beliebige Taste zum Beenden...
pause >nul

REM Beende alle gestarteten Prozesse
taskkill /f /im node.exe >nul 2>&1

endlocal
exit /b 0