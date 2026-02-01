@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Einfache lokale Testumgebung für SmartLaw Mietrecht
REM ========================================================

echo ========================================================
echo   SmartLaw Mietrecht - Lokale Testumgebung 🚀
echo ========================================================
echo.

REM Prüfe Node.js Installation
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js nicht gefunden.
    pause
    exit /b 1
)

REM Prüfe ob Docker Daemon läuft
echo [INFO] Prüfe Docker Status...
docker ps 1>nul 2>nul
if errorlevel 1 (
    echo [ERROR] Docker läuft nicht oder ist nicht ansprechbar.
    echo Bitte starten Sie Docker Desktop und warten Sie, bis es bereit ist.
    echo.
    echo Wenn Docker bereits läuft, versuchen Sie, dieses Fenster als Administrator zu starten.
    pause
    exit /b 1
)

REM Prüfe ob Port 5432 belegt ist (ggf. durch lokales Postgres)
netstat -ano | findstr ":5432" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 5432 ist bereits belegt (evtl. durch lokales PostgreSQL).
    echo Dies kann dazu führen, dass der Docker-Postgres Container NICHT startet.
    
    REM Prüfe spezifisch nach dem Dienst, den wir vorhin gefunden haben
    net start | findstr /i "postgresql-x64-18" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [TIP] Der Dienst 'postgresql-x64-18' wurde als Ursache erkannt.
        echo Bitte führen Sie diesen Befehl in einer Admin-CMD aus:
        echo   net stop postgresql-x64-18
    ) else (
        echo [TIP] Bitte beenden Sie alle lokalen PostgreSQL-Dienste, um Port 5432 freizugeben.
    )
    echo.
    echo Möchten Sie trotzdem fortfahren? (Y/N)
    set /p continue="Auswahl: "
    if /i "!continue!" neq "Y" exit /b 1
)

echo [INFO] Starte Infrastruktur via Docker ^(Postgres, Redis, etc.^)...
docker-compose -f docker-compose.dev.yml up -d postgres redis elasticsearch minio clamav
if %errorlevel% neq 0 (
    echo [ERROR] Fehler beim Starten der Docker-Infrastruktur.
    pause
    exit /b 1
)

REM Erstelle einfache .env Dateien falls nicht vorhanden oder korrupt
if not exist "services\backend\.env" (
    echo [INFO] Erstelle services\backend\.env...
    echo PORT=3001 > services\backend\.env
    echo NODE_ENV=development >> services\backend\.env
    echo DATABASE_URL=postgresql://smartlaw_user:smartlaw_password@localhost:5432/smartlaw_dev >> services\backend\.env
    echo REDIS_URL=redis://localhost:6379 >> services\backend\.env
    echo JWT_SECRET=dev-secret-key-12345 >> services\backend\.env
    echo OPENAI_API_KEY=mock-key >> services\backend\.env
    echo ELASTICSEARCH_URL=http://localhost:9200 >> services\backend\.env
) else (
    echo [INFO] .env Datei existiert bereits. Falls Authentifizierungsfehler auftreten,
    echo löschen Sie die Datei 'services\backend\.env' und starten Sie das Skript neu.
)

if not exist "web-app\.env" (
    echo [INFO] Erstelle web-app\.env...
    echo REACT_APP_API_URL=http://localhost:3001 > web-app\.env
    echo REACT_APP_ENV=development >> web-app\.env
)

REM Installiere Abhängigkeiten und bereite Datenbank vor
echo [INFO] Bereite Backend vor...
cd services\backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Fehler beim Installieren der Backend-Abhängigkeiten
    cd ..\..
    pause
    exit /b 1
)

echo [INFO] Generiere Prisma Client und synchronisiere Schema...
call npx prisma generate
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
    echo [ERROR] Fehler beim Prisma Setup.
    echo Bitte prüfen Sie, ob Ihre DATABASE_URL in services\backend\.env korrekt ist.
    echo Standard: postgresql://smartlaw_user:smartlaw_password@localhost:5432/smartlaw_dev
    cd ..\..
    pause
    exit /b 1
)

echo [INFO] Bereite Web-App vor...
cd ..\web-app

REM Fix für AJV-Fehler (Kompatibel mit react-scripts 5.0.1)
if exist "node_modules\ajv-keywords" (
    echo [INFO] Fixe AJV-Abhängigkeiten in der Web-App...
    call npm install ajv@^8.12.0 ajv-keywords@^5.1.0 --save-dev
)

call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Fehler beim Installieren der Web-App-Abhängigkeiten
    cd ..\..
    pause
    exit /b 1
)

cd ..\..

REM Starte Services
echo.
echo [INFO] Starte Backend und Web-App...
echo.

start "SmartLaw Backend" cmd /k "cd services\backend && npm run dev"
timeout /t 5 /nobreak >nul
start "SmartLaw Web App" cmd /k "cd web-app && npm start"

echo.
echo ========================================================
echo   Testumgebung gestartet! 🎉
echo ========================================================
echo.
echo Drücken Sie eine beliebige Taste zum Beenden dieses Skripts.
pause >nul

endlocal
exit /b 0
