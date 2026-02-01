@echo off
setlocal enabledelayedexpansion

REM Heroku Testumgebung Setup für SmartLaw Mietrecht
REM ========================================================

echo ========================================================
echo   SmartLaw Mietrecht - Heroku Testumgebung Setup 🚀
echo ========================================================
echo.

REM Prüfe ob Heroku CLI installiert ist
where heroku >nul 2>&1
if !errorlevel! neq 0 (
    REM Prüfe spezifischen Heroku-Pfad des Users
    if exist "C:\heroku\bin\heroku.cmd" (
        echo [INFO] Heroku CLI unter C:\heroku\bin gefunden
        set "PATH=!PATH!;C:\heroku\bin"
    ) else (
        if exist "C:\heroku\heroku.cmd" (
            echo [INFO] Heroku CLI unter C:\heroku gefunden
            set "PATH=!PATH!;C:\heroku"
        ) else (
            echo [ERROR] Heroku CLI nicht gefunden.
            echo Bitte installiere zuerst die Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
            pause
            exit /b 1
        )
    )
)

echo [INFO] Heroku CLI gefunden
echo.

REM Heroku Login
echo [1/5] Heroku Anmeldung...
echo Bitte melde dich im Browser mit deinen Heroku-Zugangsdaten an.
echo Drücke eine beliebige Taste um fortzufahren...
pause >nul
heroku login
if !errorlevel! neq 0 (
    echo [ERROR] Heroku Anmeldung fehlgeschlagen
    pause
    exit /b 1
)

echo.
echo [2/5] Erstelle Heroku App...
set APP_NAME=smartlaw-test-%RANDOM%
heroku create !APP_NAME!
if !errorlevel! neq 0 (
    echo [ERROR] Fehler beim Erstellen der Heroku App
    pause
    exit /b 1
)

echo.
echo [3/5] Provisioniere Add-ons...
heroku addons:create heroku-postgresql:hobby-dev --app !APP_NAME!
if !errorlevel! neq 0 (
    echo [WARN] PostgreSQL Add-on konnte nicht erstellt werden
)

heroku addons:create heroku-redis:hobby-dev --app !APP_NAME!
if !errorlevel! neq 0 (
    echo [WARN] Redis Add-on konnte nicht erstellt werden
)

echo.
echo [4/5] Konfiguriere Umgebungsvariablen...
REM Generiere zufälligen JWT Secret
for /f "usebackq tokens=*" %%A in (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2^>nul`) do set "JWT_SECRET=%%A"
if not defined JWT_SECRET (
    echo [WARN] Konnte keinen JWT Secret generieren, verwende Standardwert
    set "JWT_SECRET=super-secret-jwt-key-for-testing-only"
)

heroku config:set NODE_ENV=production --app !APP_NAME!
heroku config:set JWT_SECRET=!JWT_SECRET! --app !APP_NAME!

echo.
echo [5/5] Deploy auf Heroku...
git push heroku HEAD:main
if !errorlevel! neq 0 (
    echo [ERROR] Deployment fehlgeschlagen. 
    echo Stellen Sie sicher, dass Sie sich auf einem Branch mit Commits befinden.
    pause
    exit /b 1
)


echo.
echo ========================================================
echo   Heroku Testumgebung erfolgreich eingerichtet! 🎉
echo ========================================================
echo.
echo App Name: !APP_NAME!
echo URL: https://!APP_NAME!.herokuapp.com
echo.
echo Nützliche Befehle:
echo   - Logs anzeigen: heroku logs --tail --app !APP_NAME!
echo   - Datenbank migrieren: heroku run "npm run db:migrate" --app !APP_NAME!
echo   - App neu starten: heroku restart --app !APP_NAME!
echo.
echo Zum Beenden beliebige Taste drücken...
pause >nul