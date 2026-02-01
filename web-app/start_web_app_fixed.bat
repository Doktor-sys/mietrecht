@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================================
echo   SmartLaw Web App - Fixed Starter 🚀
echo ========================================================
echo.

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

REM Erstelle .env Datei falls nicht vorhanden
if not exist ".env" (
    echo [INFO] Erstelle .env...
    echo REACT_APP_API_URL=http://localhost:3001 > .env
    echo REACT_APP_ENV=development >> .env
)

REM Lösche node_modules und Cache falls vorhanden
echo [INFO] Bereinige alte Installation...
if exist "node_modules" (
    echo [INFO] Lösche node_modules...
    rd /s /q node_modules >nul 2>&1
)

if exist "package-lock.json" (
    echo [INFO] Lösche package-lock.json...
    del package-lock.json >nul 2>&1
)

echo [INFO] Bereinige npm Cache...
npm cache clean --force >nul 2>&1

REM Installiere Abhängigkeiten mit verschiedenen Methoden
echo [INFO] Installiere Abhängigkeiten...
echo [INFO] Versuche Installation mit --legacy-peer-deps...
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
    echo [ERROR] Installation der Abhängigkeiten fehlgeschlagen.
    echo Mögliche Lösungen:
    echo 1. Prüfen Sie Ihre Internetverbindung
    echo 2. Starten Sie Docker Desktop neu
    echo 3. Starten Sie Ihre Command Line als Administrator
    pause
    exit /b 1
)

echo [INFO] Abhängigkeiten erfolgreich installiert.
echo.

REM Starte die Anwendung
echo [INFO] Starte Web App...
echo.
echo Services werden in separaten Fenstern gestartet:
echo   - Web App: http://localhost:3000
echo.
echo Drücken Sie eine beliebige Taste zum Starten...
pause >nul

npm start

endlocal
exit /b 0