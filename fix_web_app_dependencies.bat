@echo off
chcp 65001 >nul
echo ========================================================
echo   SmartLaw Web-App - Dependency Fix Script
echo ========================================================
echo.
echo Dieses Skript behebt die AJV-Abhängigkeitsprobleme.
echo.
echo WICHTIG: Bitte schließen Sie ALLE anderen Terminals und
echo          Visual Studio Code, bevor Sie fortfahren!
echo.
pause

cd /d "%~dp0web-app"

echo.
echo [1/4] Lösche alte node_modules...
if exist "node_modules" (
    rmdir /s /q node_modules 2>nul
    if exist "node_modules" (
        echo [WARNING] Einige Dateien konnten nicht gelöscht werden.
        echo Bitte schließen Sie alle Programme und versuchen Sie es erneut.
        pause
        exit /b 1
    )
)

echo [2/4] Lösche package-lock.json...
if exist "package-lock.json" del /f /q package-lock.json

echo [3/4] Installiere Abhängigkeiten (dies kann einige Minuten dauern)...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Installation fehlgeschlagen.
    echo Bitte versuchen Sie:
    echo   1. Alle Programme schließen
    echo   2. Dieses Skript als Administrator ausführen
    pause
    exit /b 1
)

echo.
echo [4/4] Teste Web-App Start...
echo.
echo Die Web-App wird jetzt gestartet. Wenn sie ohne Fehler lädt,
echo war die Reparatur erfolgreich!
echo.
pause

call npm start

cd ..
