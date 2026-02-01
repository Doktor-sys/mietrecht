@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Einfache lokale Testumgebung für SmartLaw Mietrecht
REM Verbesserte Version mit erweiterten Checks und Fehlerbehandlung
REM ========================================================

echo ========================================================
echo   SmartLaw Mietrecht - Lokale Testumgebung 🚀
echo ========================================================
echo.

REM Prüfe Node.js Installation
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js nicht gefunden.
    echo Bitte installieren Sie Node.js von https://nodejs.org/
    pause
    exit /b 1
)

REM Prüfe Node.js Version (mindestens v16 empfohlen)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [INFO] Node.js Version: %NODE_VERSION%

REM Prüfe Docker-Compose Installation (unterstützt beide Varianten)
echo [INFO] Prüfe Docker Compose Installation...

REM Setze Standard auf 'docker compose' (neue Syntax - Docker Desktop v2.40+)
set DOCKER_COMPOSE_CMD=docker compose

REM Teste ob 'docker compose' funktioniert (verwende errorlevel direkt für bessere Zuverlässigkeit)
docker compose version >nul 2>&1
if errorlevel 1 (
    REM Falls nicht, versuche 'docker-compose' (alte Syntax)
    docker-compose version >nul 2>&1
    if errorlevel 1 (
        REM Beide Varianten fehlgeschlagen
        goto compose_not_found
    )
    set DOCKER_COMPOSE_CMD=docker-compose
    echo [INFO] Verwende 'docker-compose' (alte Syntax)
    goto docker_compose_found
)

echo [INFO] Verwende 'docker compose' (neue Syntax)
goto docker_compose_found

:compose_not_found
echo [ERROR] Docker Compose nicht gefunden oder nicht funktionsfähig.
echo.
echo Bitte stellen Sie sicher, dass:
echo   1. Docker Desktop installiert ist
echo   2. Docker Desktop gestartet ist ^(prüfen Sie das System-Tray^)
echo   3. Docker Compose verfügbar ist ^(sollte mit Docker Desktop installiert werden^)
echo.
echo Testen Sie manuell in einer CMD:
echo   docker compose version
echo   oder
echo   docker-compose version
echo.
echo Falls Docker Desktop läuft, versuchen Sie:
echo   1. Docker Desktop neu zu starten
echo   2. Dieses Skript als Administrator auszuführen
echo.
pause
exit /b 1

:docker_compose_found

REM Prüfe ob Docker Daemon läuft
echo [INFO] Prüfe Docker Status...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker läuft nicht oder ist nicht ansprechbar.
    echo Bitte starten Sie Docker Desktop und warten Sie, bis es bereit ist.
    echo.
    echo Wenn Docker bereits läuft, versuchen Sie, dieses Fenster als Administrator zu starten.
    pause
    exit /b 1
)

REM Prüfe Port-Konflikte
echo [INFO] Prüfe Port-Verfügbarkeit...
set PORT_ERROR=0
set ASK_CONTINUE=0
set PORT_5432_FREE=1
set PORT_3001_FREE=1
set PORT_3000_FREE=1

REM Prüfe Port 5432 (PostgreSQL)
netstat -ano 2>nul | findstr /C:":5432" | findstr /C:"LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Port 5432 ist bereits belegt ^(evtl. durch lokales PostgreSQL^).
    echo Dies kann dazu führen, dass der Docker-Postgres Container NICHT startet.
    set PORT_5432_FREE=0
    set ASK_CONTINUE=1
    
    REM Prüfe spezifisch nach dem Dienst
    net start 2>nul | findstr /i "postgresql-x64-18" >nul 2>&1
    if not errorlevel 1 (
        echo [TIP] Der Dienst 'postgresql-x64-18' wurde als Ursache erkannt.
        echo Bitte führen Sie diesen Befehl in einer Admin-CMD aus:
        echo   net stop postgresql-x64-18
    ) else (
        echo [TIP] Bitte beenden Sie alle lokalen PostgreSQL-Dienste, um Port 5432 freizugeben.
    )
) else (
    echo [OK] Port 5432 ist verfügbar.
)

REM Prüfe Port 3001 (Backend)
netstat -ano 2>nul | findstr /C:":3001" | findstr /C:"LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Port 3001 ist bereits belegt. Backend könnte nicht starten.
    set PORT_3001_FREE=0
    set PORT_ERROR=1
    set ASK_CONTINUE=1
) else (
    echo [OK] Port 3001 ist verfügbar.
)

REM Prüfe Port 3000 (Web-App)
netstat -ano 2>nul | findstr /C:":3000" | findstr /C:"LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Port 3000 ist bereits belegt. Web-App könnte nicht starten.
    set PORT_3000_FREE=0
    set PORT_ERROR=1
    set ASK_CONTINUE=1
) else (
    echo [OK] Port 3000 ist verfügbar.
)

REM Frage nur einmal, wenn Ports belegt sind
if !ASK_CONTINUE! equ 1 (
    echo.
    echo ========================================================
    echo   Port-Konflikt erkannt!
    echo ========================================================
    echo.
    echo Das Skript hat erkannt, dass mindestens ein Port bereits belegt ist.
    echo.
    if !PORT_5432_FREE! equ 0 echo   - Port 5432 ^(PostgreSQL^) ist belegt
    if !PORT_3001_FREE! equ 0 echo   - Port 3001 ^(Backend^) ist belegt
    if !PORT_3000_FREE! equ 0 echo   - Port 3000 ^(Web-App^) ist belegt
    echo.
    echo Sie können trotzdem fortfahren, aber die Services könnten nicht starten.
    echo.
    echo Möchten Sie trotzdem fortfahren? (Y/N)
    set /p continue="Auswahl: "
    if /i "!continue!" neq "Y" (
        echo.
        echo Skript abgebrochen.
        pause
        exit /b 1
    )
    echo.
    echo [INFO] Fortfahren trotz Port-Konflikten...
    echo.
) else (
    echo [INFO] Alle Ports sind verfügbar. ✓
)

REM Starte Docker-Infrastruktur
echo.
echo [INFO] Starte Infrastruktur via Docker ^(Postgres, Redis, etc.^)...
%DOCKER_COMPOSE_CMD% -f docker-compose.dev.yml up -d postgres redis elasticsearch minio clamav
if errorlevel 1 (
    echo [ERROR] Fehler beim Starten der Docker-Infrastruktur.
    echo Prüfen Sie die Docker-Logs mit: %DOCKER_COMPOSE_CMD% -f docker-compose.dev.yml logs
    pause
    exit /b 1
)

REM Warte auf Postgres-Bereitschaft
echo [INFO] Warte auf Postgres-Bereitschaft...
set retries=0

REM Prüfe zuerst ob Container läuft
docker ps --filter "name=smartlaw-postgres-dev" --format "{{.Names}}" | findstr "smartlaw-postgres-dev" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Postgres-Container läuft nicht!
    echo Bitte prüfen Sie: docker ps -a | findstr postgres
    pause
    exit /b 1
)

:wait_postgres
timeout /t 2 /nobreak >nul
set /a retries+=1

REM Zeige Fortschritt alle 5 Versuche
set /a show_progress=!retries! %% 5
if !show_progress! equ 0 (
    echo [INFO] Warte auf Postgres... Versuch !retries!/30
)

REM Prüfe ob Container noch läuft
docker ps --filter "name=smartlaw-postgres-dev" --format "{{.Names}}" | findstr "smartlaw-postgres-dev" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Postgres-Container wurde gestoppt!
    echo Prüfen Sie die Container-Logs: docker logs smartlaw-postgres-dev
    pause
    exit /b 1
)

REM Prüfe Postgres-Bereitschaft (mit expliziter Datenbank)
docker exec smartlaw-postgres-dev pg_isready -U smartlaw_user -d smartlaw_dev >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Postgres ist bereit nach !retries! Versuchen.
    goto postgres_ready
)

REM Timeout nach 30 Versuchen (60 Sekunden)
if !retries! geq 30 (
    echo [ERROR] Postgres ist nach 60 Sekunden nicht bereit.
    echo.
    echo [DEBUG] Container-Status:
    docker ps --filter "name=smartlaw-postgres-dev"
    echo.
    echo [DEBUG] Container-Logs (letzte 20 Zeilen):
    docker logs --tail 20 smartlaw-postgres-dev
    echo.
    echo [TIP] Versuchen Sie manuell: docker exec smartlaw-postgres-dev pg_isready -U smartlaw_user -d smartlaw_dev
    echo [TIP] Prüfen Sie die Datenbank: docker exec smartlaw-postgres-dev psql -U smartlaw_user -d smartlaw_dev -c "\l"
    echo [TIP] Oder prüfen Sie die Logs: docker logs smartlaw-postgres-dev
    pause
    exit /b 1
)
goto wait_postgres
:postgres_ready

REM Erstelle einfache .env Dateien falls nicht vorhanden
if not exist "services\backend\.env" (
    echo [INFO] Erstelle services\backend\.env...
    (
        echo PORT=3001
        echo NODE_ENV=development
        echo DATABASE_URL=postgresql://smartlaw_user:smartlaw_password@localhost:5432/smartlaw_dev
        echo REDIS_URL=redis://localhost:6379
        echo JWT_SECRET=dev-secret-key-12345
        echo OPENAI_API_KEY=mock-key
        echo ELASTICSEARCH_URL=http://localhost:9200
    ) > services\backend\.env
) else (
    echo [INFO] .env Datei existiert bereits. Falls Authentifizierungsfehler auftreten,
    echo löschen Sie die Datei 'services\backend\.env' und starten Sie das Skript neu.
)

if not exist "web-app\.env" (
    echo [INFO] Erstelle web-app\.env...
    (
        echo REACT_APP_API_URL=http://localhost:3001
        echo REACT_APP_ENV=development
    ) > web-app\.env
)

REM Installiere Abhängigkeiten und bereite Datenbank vor
echo.
echo [INFO] Bereite Backend vor...
if not exist "services\backend" (
    echo [ERROR] Verzeichnis services\backend nicht gefunden.
    echo Bitte stellen Sie sicher, dass Sie das Skript aus dem Hauptverzeichnis ausführen.
    pause
    exit /b 1
)
cd services\backend
if errorlevel 1 (
    echo [ERROR] Fehler beim Wechseln in services\backend
    pause
    exit /b 1
)

REM Prüfe ob node_modules existiert (optional: überspringe npm install wenn vorhanden)
if not exist "node_modules" (
    echo [INFO] Installiere Backend-Abhängigkeiten...
    echo [INFO] Hinweis: Optional Dependencies werden übersprungen, um Kompilierungsprobleme zu vermeiden.
    call npm install --no-optional
    if errorlevel 1 (
        echo [WARNING] npm install hatte Fehler, aber versuche fortzufahren...
        echo [TIP] Falls Probleme auftreten, führen Sie manuell aus: npm install --no-optional
    )
) else (
    echo [INFO] node_modules existiert bereits. Überspringe npm install.
    echo [TIP] Führen Sie 'npm install --no-optional' manuell aus, falls Abhängigkeiten aktualisiert wurden.
)

echo [INFO] Generiere Prisma Client...
REM Prüfe ob Prisma lokal funktioniert
if exist "node_modules\.bin\prisma.cmd" (
    echo [INFO] Versuche lokale Prisma-Version...
    node_modules\.bin\prisma.cmd --version >nul 2>&1
    if not errorlevel 1 (
        echo [INFO] Verwende lokale Prisma-Version...
        call node_modules\.bin\prisma.cmd generate
        if not errorlevel 1 (
            goto prisma_generate_done
        )
        echo [WARNING] Lokale Prisma-Version funktioniert nicht, verwende npx...
    )
)
REM Verwende npx als Fallback
echo [INFO] Verwende npx für Prisma (lädt Prisma temporär)...
echo [INFO] Hinweis: Dies kann beim ersten Mal etwas dauern...
call npx --package=prisma@5.1.0 --yes=false prisma generate
if errorlevel 1 (
    echo [ERROR] Fehler beim Generieren des Prisma Clients.
    echo [TIP] Prüfen Sie, ob Prisma korrekt installiert ist: npm list prisma
    echo [TIP] Oder installieren Sie Prisma manuell: npm install prisma@5.1.0 --save-dev
    cd ..\..
    pause
    exit /b 1
)
:prisma_generate_done

echo [INFO] Synchronisiere Datenbankschema...
REM Prüfe ob .env Datei existiert
if not exist ".env" (
    echo [WARNING] .env Datei nicht gefunden. Prüfe ob DATABASE_URL gesetzt ist...
    if "%DATABASE_URL%"=="" (
        echo [ERROR] DATABASE_URL nicht gesetzt. Bitte prüfen Sie services\backend\.env
        cd ..\..
        pause
        exit /b 1
    )
)

REM Verwende lokale Prisma-Version aus node_modules, falls vorhanden und funktionsfähig
if exist "node_modules\.bin\prisma.cmd" (
    node_modules\.bin\prisma.cmd --version >nul 2>&1
    if not errorlevel 1 (
        call node_modules\.bin\prisma.cmd db push --accept-data-loss
        if not errorlevel 1 (
            goto prisma_push_done
        )
    )
)
REM Verwende npx als Fallback
echo [INFO] Verwende npx für Prisma db push...
call npx --package=prisma@5.1.0 --yes=false prisma db push --accept-data-loss
:prisma_push_done
if errorlevel 1 (
    echo [ERROR] Fehler beim Prisma Setup.
    echo.
    echo [DEBUG] Prüfe Datenbankverbindung...
    docker exec smartlaw-postgres-dev pg_isready -U smartlaw_user -d smartlaw_dev
    echo.
    echo Bitte prüfen Sie:
    echo   1. DATABASE_URL in services\backend\.env ist korrekt
    echo     Standard: postgresql://smartlaw_user:smartlaw_password@localhost:5432/smartlaw_dev
    echo   2. Postgres-Container läuft: docker ps | findstr postgres
    echo   3. Postgres-Logs: docker logs smartlaw-postgres-dev
    echo.
    cd ..\..
    pause
    exit /b 1
)

echo [INFO] Bereite Web-App vor...
cd ..\web-app
if errorlevel 1 (
    echo [ERROR] Fehler beim Wechseln in web-app
    echo Aktuelles Verzeichnis: %CD%
    pause
    exit /b 1
)
if not exist "package.json" (
    echo [ERROR] package.json nicht gefunden in web-app
    echo Aktuelles Verzeichnis: %CD%
    pause
    exit /b 1
)

REM Fix für AJV-Fehler (nur wenn node_modules existiert)
if exist "node_modules\ajv-keywords" (
    echo [INFO] Prüfe AJV-Abhängigkeiten...
    REM Prüfe ob bereits korrekte Version installiert ist
    call npm list ajv >nul 2>&1
    if errorlevel 1 (
        echo [INFO] Fixe AJV-Abhängigkeiten in der Web-App...
        call npm install ajv@^8.12.0 ajv-keywords@^5.1.0 --save-dev
    )
)

if not exist "node_modules" (
    echo [INFO] Installiere Web-App-Abhängigkeiten...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Fehler beim Installieren der Web-App-Abhängigkeiten
        cd ..\..
        pause
        exit /b 1
    )
) else (
    echo [INFO] node_modules existiert bereits. Überspringe npm install.
    echo [TIP] Führen Sie 'npm install' manuell aus, falls Abhängigkeiten aktualisiert wurden.
)

cd ..\..
if errorlevel 1 (
    echo [ERROR] Fehler beim Zurückwechseln ins Hauptverzeichnis
    pause
    exit /b 1
)

REM Prüfe ob wir im richtigen Verzeichnis sind
if not exist "docker-compose.dev.yml" (
    echo [ERROR] docker-compose.dev.yml nicht gefunden.
    echo Aktuelles Verzeichnis: %CD%
    echo Bitte stellen Sie sicher, dass Sie das Skript aus dem Hauptverzeichnis ausführen.
    pause
    exit /b 1
)

REM Starte Services
echo.
echo [INFO] Starte Backend und Web-App...
echo.
echo [TIP] Die Services werden in separaten Fenstern geöffnet.
echo [TIP] Zum Beenden: Schließen Sie die Fenster oder drücken Sie Strg+C in den jeweiligen Fenstern.
echo.

REM Prüfe ob Backend-Verzeichnis existiert
if not exist "services\backend\package.json" (
    echo [ERROR] Backend package.json nicht gefunden.
    echo Bitte stellen Sie sicher, dass das Backend-Verzeichnis korrekt ist.
    pause
    exit /b 1
)

REM Prüfe ob Web-App-Verzeichnis existiert
if not exist "web-app\package.json" (
    echo [ERROR] Web-App package.json nicht gefunden.
    echo Bitte stellen Sie sicher, dass das web-app-Verzeichnis korrekt ist.
    pause
    exit /b 1
)

REM Starte Backend in separatem Fenster
echo [INFO] Starte Backend-Service...
echo [DEBUG] Backend-Pfad: %CD%\services\backend
start "SmartLaw Backend" cmd /k "cd /d %CD%\services\backend & npm run dev"
REM start gibt immer errorlevel 0 zurück, daher keine Prüfung hier

REM Warte kurz, bevor Web-App gestartet wird
timeout /t 5 /nobreak >nul

REM Starte Web-App in separatem Fenster
echo [INFO] Starte Web-App-Service...
echo [DEBUG] Web-App-Pfad: %CD%\web-app
start "SmartLaw Web App" cmd /k "cd /d %CD%\web-app & npm start"
REM start gibt immer errorlevel 0 zurück, daher keine Prüfung hier

echo.
echo ========================================================
echo   Testumgebung gestartet! 🎉
echo ========================================================
echo.
echo Services:
echo   - Backend:    http://localhost:3001
echo   - Web-App:    http://localhost:3000
echo   - MinIO:      http://localhost:9001
echo.
echo Docker-Container:
echo   - Postgres:      smartlaw-postgres-dev
echo   - Redis:         smartlaw-redis-dev
echo   - Elasticsearch: smartlaw-elasticsearch-dev
echo   - MinIO:         smartlaw-minio-dev
echo   - ClamAV:        smartlaw-clamav-dev
echo.
echo Zum Stoppen der Docker-Container:
echo   %DOCKER_COMPOSE_CMD% -f docker-compose.dev.yml down
echo.
echo Drücken Sie eine beliebige Taste zum Beenden dieses Skripts.
echo ^(Die gestarteten Services laufen weiter^)
pause >nul

endlocal
exit /b 0

