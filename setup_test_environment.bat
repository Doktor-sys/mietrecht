@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Initialisiere Variablen
set "DOCKER_AVAILABLE=0"
set "HEROKU_AVAILABLE=0"
set "DOCKER_SOURCE=1"
set "ERROR_FOUND=0"

REM Komplette Testumgebung Setup für SmartLaw Mietrecht
REM ========================================================

REM Wechsle zum Verzeichnis des Skripts (funktioniert auch laufwerkübergreifend)
cd /d "%~dp0"

:main_menu
cls
echo ========================================================
echo   SmartLaw Mietrecht - Komplette Testumgebung Setup 🚀
echo ========================================================
echo.
echo Welche Testumgebung möchten Sie einrichten?
echo 1) Lokale Docker Testumgebung (Lokal bauen oder Docker Hub)
echo 2) Heroku Testumgebung
echo 3) Beide Umgebungen
echo 4) Lokale Testumgebung ohne Docker (Direktausführung)
echo 5) Beenden
echo.
choice /c 12345 /m "Bitte wählen Sie eine Option"
set "MAIN_CHOICE=%errorlevel%"

if "%MAIN_CHOICE%"=="5" goto :finish
if "%MAIN_CHOICE%"=="4" goto :setup_local_no_docker
if "%MAIN_CHOICE%"=="3" goto :setup_both
if "%MAIN_CHOICE%"=="2" goto :setup_heroku_only
if "%MAIN_CHOICE%"=="1" goto :setup_docker_menu
goto :main_menu

:setup_docker_menu
echo.
echo Welche Docker-Quelle möchten Sie nutzen?
echo 1) Lokal bauen (Source Code)
echo 2) Docker Hub (doktor21 Repository - https://hub.docker.com/repositories/doktor21)
echo 3) Zurück zum Hauptmenü
echo.
choice /c 123 /m "Bitte wählen Sie die Quelle"
set "DOCKER_SOURCE_CHOICE=%errorlevel%"

if "%DOCKER_SOURCE_CHOICE%"=="3" goto :main_menu
set /a DOCKER_SOURCE=%DOCKER_SOURCE_CHOICE%
set "CURR_MAIN_CHOICE=1"
goto :check_requirements

:setup_heroku_only
set "CURR_MAIN_CHOICE=2"
goto :check_requirements

:setup_local_no_docker
set "CURR_MAIN_CHOICE=4"
goto :do_local_no_docker

:setup_both
echo.
echo Welche Docker-Quelle möchten Sie für den lokalen Teil nutzen?
echo 1) Lokal bauen (Source Code)
echo 2) Docker Hub (doktor21 Repository)
echo.
choice /c 12 /m "Bitte wählen Sie die Quelle"
set /a DOCKER_SOURCE=%errorlevel%
set "CURR_MAIN_CHOICE=3"
goto :check_requirements

:check_requirements
echo.
echo Überprüfe Voraussetzungen...

REM Prüfe Docker Installation
where docker >nul 2>&1
if !errorlevel! equ 0 (
    echo [INFO] Docker gefunden
    set "DOCKER_AVAILABLE=1"
) else (
    REM Prüfe spezifische Docker-Pfade
    set "DOCKER_PATH_FOUND=0"
    for %%p in (
        "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
        "C:\Program Files\Docker\bin\docker.exe"
        "C:\Program Files\Docker\Docker\docker.exe"
        "C:\Program Files\Docker\docker.exe"
        "%ProgramData%\DockerDesktop\version-bin\docker.exe"
        "%LocalAppData%\Docker\resources\bin\docker.exe"
    ) do (
        if exist "%%~p" (
            echo [INFO] Docker unter %%~p gefunden
            set "DOCKER_BIN=%%~dpp"
            set "DOCKER_PATH_FOUND=1"
        )
    )

    if "!DOCKER_PATH_FOUND!"=="1" (
        set "DOCKER_AVAILABLE=1"
        set "PATH=!PATH!;!DOCKER_BIN!"
    ) else (
        if "%CURR_MAIN_CHOICE%"=="1" echo [WARN] Docker nicht im PATH und nicht in Standardpfaden gefunden.
        if "%CURR_MAIN_CHOICE%"=="3" echo [WARN] Docker nicht im PATH und nicht in Standardpfaden gefunden.
        set "DOCKER_AVAILABLE=0"
    )
)

REM Prüfe ob Docker Engine läuft
if "!DOCKER_AVAILABLE!"=="1" (
    docker info >nul 2>&1
    if !errorlevel! neq 0 (
        set "DOCKER_ENGINE_RUNNING=0"
        if "%CURR_MAIN_CHOICE%"=="1" set "DOCKER_ENGINE_RUNNING=1"
        if "%CURR_MAIN_CHOICE%"=="3" set "DOCKER_ENGINE_RUNNING=1"
        
        if "!DOCKER_ENGINE_RUNNING!"=="1" (
            echo [ERROR] Docker ist installiert, aber die Docker Engine läuft nicht.
            echo [TIP] Bitte starten Sie Docker Desktop.
        )
        set "DOCKER_AVAILABLE=0"
    ) else (
        echo [INFO] Docker Engine läuft
    )
)

REM Bestimme Docker Compose Befehl
set "COMPOSE_CMD=docker-compose"
where !COMPOSE_CMD! >nul 2>&1
if !errorlevel! neq 0 (
    docker compose version >nul 2>&1
    if !errorlevel! equ 0 (
        set "COMPOSE_CMD=docker compose"
        echo [INFO] Nutze 'docker compose' (V2)
    )
)

REM Prüfe Heroku CLI Installation
where heroku >nul 2>&1
if !errorlevel! equ 0 (
    echo [INFO] Heroku CLI gefunden
    set "HEROKU_AVAILABLE=1"
) else (
    set "HEROKU_FOUND=0"
    for %%p in (
        "C:\heroku\bin\heroku.cmd"
        "C:\heroku\bin\heroku.exe"
        "C:\heroku\heroku.cmd"
        "C:\heroku\heroku.exe"
        "%ProgramFiles%\heroku\bin\heroku.cmd"
        "%ProgramFiles%\heroku\bin\heroku.exe"
    ) do (
        if exist "%%~p" (
            echo [INFO] Heroku CLI unter %%~p gefunden
            set "HEROKU_AVAILABLE=1"
            set "HEROKU_FOUND=1"
            set "PATH=!PATH!;%%~dpp"
        )
    )
    if "!HEROKU_FOUND!"=="0" (
        if "%CURR_MAIN_CHOICE%"=="2" echo [WARN] Heroku CLI nicht gefunden.
        if "%CURR_MAIN_CHOICE%"=="3" echo [WARN] Heroku CLI nicht gefunden.
        set "HEROKU_AVAILABLE=0"
    )
)

REM Starte Setup basierend auf Auswahl
if "%CURR_MAIN_CHOICE%"=="1" goto :do_only_local
if "%CURR_MAIN_CHOICE%"=="2" goto :do_only_heroku
if "%CURR_MAIN_CHOICE%"=="3" goto :do_both
if "%CURR_MAIN_CHOICE%"=="4" goto :do_local_no_docker
goto :main_menu

:do_only_local
if "!DOCKER_AVAILABLE!"=="1" (
    call :do_setup_local
) else (
    echo [ERROR] Docker ist erforderlich für die lokale Testumgebung.
    pause
)
goto :finish

:do_only_heroku
if "!HEROKU_AVAILABLE!"=="1" (
    call :do_setup_heroku
) else (
    echo [ERROR] Heroku CLI ist erforderlich für die Heroku Testumgebung.
    pause
)
goto :finish

:do_both
set "ERROR_FOUND=0"
if "!DOCKER_AVAILABLE!"=="0" (
    echo [ERROR] Docker ist erforderlich für die lokale Testumgebung.
    set "ERROR_FOUND=1"
)
if "!HEROKU_AVAILABLE!"=="0" (
    echo [ERROR] Heroku CLI ist erforderlich für die Heroku Testumgebung.
    set "ERROR_FOUND=1"
)

if "!ERROR_FOUND!"=="0" (
    call :do_setup_local
    call :do_setup_heroku
) else (
    echo [ERROR] Voraussetzungen für beide Umgebungen nicht erfüllt.
    pause
)
goto :finish

:do_local_no_docker
    echo.
    echo [LOKAL] Starte lokale Testumgebung ohne Docker...
    
    REM Prüfe Node.js Installation
    where node >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Node.js nicht gefunden. Bitte installieren Sie Node.js.
        pause
        goto :finish
    )
    
    REM Prüfe npm Installation
    where npm >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] npm nicht gefunden. Bitte installieren Sie Node.js mit npm.
        pause
        goto :finish
    )
    
    echo [INFO] Node.js und npm gefunden
    
    REM Erstelle .env Dateien falls nicht vorhanden
    if not exist "services\backend\.env" (
        echo [INFO] Erstelle services\backend\.env...
        echo PORT=3001 > services\backend\.env
        echo NODE_ENV=development >> services\backend\.env
        echo DATABASE_URL=postgresql://postgres:password@localhost:5432/smartlaw_dev >> services\backend\.env
    )
    
    if not exist "web-app\.env" (
        echo [INFO] Erstelle web-app\.env...
        echo REACT_APP_API_URL=http://localhost:3001 > web-app\.env
        echo REACT_APP_ENV=development >> web-app\.env
    )
    
    REM Installiere Abhängigkeiten
    echo [INFO] Installiere Backend-Abhängigkeiten...
    cd services\backend
    call npm install --legacy-peer-deps
    if !errorlevel! neq 0 (
        echo [ERROR] Fehler beim Installieren der Backend-Abhängigkeiten
        cd ..\..
        pause
        goto :finish
    )
    
    echo [INFO] Installiere Web-App-Abhängigkeiten...
    cd ..\web-app
    call npm install --legacy-peer-deps
    if !errorlevel! neq 0 (
        echo [ERROR] Fehler beim Installieren der Web-App-Abhängigkeiten
        cd ..\..
        pause
        goto :finish
    )
    
    cd ..\..
    
    REM Starte Services in separaten Prozessen
    echo.
    echo [INFO] Starte Backend und Web-App in separaten Fenstern...
    echo.
    
    REM Starte Backend
    start "SmartLaw Backend" cmd /k "cd services\backend && npm run dev"
    
    REM Warte kurz
    timeout /t 5 /nobreak >nul
    
    REM Starte Web-App
    start "SmartLaw Web App" cmd /k "cd web-app && npm start"
    
    echo.
    echo ========================================================
    echo   Lokale Testumgebung gestartet! 🎉
    echo ========================================================
    echo.
    echo Services:
    echo   - Backend: http://localhost:3001
    echo   - Web App: http://localhost:3000
    echo.
    echo Drücken Sie eine beliebige Taste zum Fortfahren...
    pause >nul
    
    goto :finish

:do_setup_local
    set "COMPOSE_FILE=docker-compose.test.yml"
    if "!DOCKER_SOURCE!"=="2" (
        set "COMPOSE_FILE=docker-compose.hub.yml"
        echo.
        echo [DOCKER HUB] Nutze Images von doktor21 Repository...
        echo [LINK] https://hub.docker.com/repositories/doktor21
    ) else (
        echo.
        echo [LOCAL BUILD] Baue Images aus Source Code...
    )

    if not exist "!COMPOSE_FILE!" (
        echo [ERROR] !COMPOSE_FILE! nicht gefunden!
        goto :eof
    )

    if "!DOCKER_SOURCE!"=="2" (
        echo [DOCKER HUB] Pulling latest images...
        !COMPOSE_CMD! -f !COMPOSE_FILE! pull
    )

    REM Prüfe .env Dateien
    if not exist "services\backend\.env.test" (
        echo [INFO] Erstelle services\backend\.env.test...
        echo # SmartLaw Backend - Test Environment Variables > services\backend\.env.test
        echo PORT=3001 >> services\backend\.env.test
        echo NODE_ENV=test >> services\backend\.env.test
        echo DATABASE_URL=postgresql://smartlaw_user:smartlaw_password@postgres:5432/smartlaw_test >> services\backend\.env.test
        echo REDIS_URL=redis://redis:6379 >> services\backend\.env.test
    )
    if not exist "web-app\.env.test" (
        echo [INFO] Erstelle web-app\.env.test...
        echo # SmartLaw Web App - Test Environment Variables > web-app\.env.test
        echo REACT_APP_API_URL=http://localhost:3002 >> web-app\.env.test
        echo REACT_APP_ENV=test >> web-app\.env.test
    )

    echo [DOCKER] Starte Umgebung (!COMPOSE_FILE!)...
    !COMPOSE_CMD! -f !COMPOSE_FILE! up -d --build
    if !errorlevel! neq 0 (
        echo [ERROR] Fehler beim Starten der Docker Umgebung
        goto :eof
    )
    
    echo [DOCKER] Warte auf Datenbankinitialisierung (10 Sekunden)...
    timeout /t 10 /nobreak >nul
    
    echo [DOCKER] Führe Datenbankmigration durch...
    !COMPOSE_CMD! -f !COMPOSE_FILE! run --rm backend npm run db:migrate
    
    echo.
    echo [DOCKER] Testumgebung ist bereit! 🐳
    echo PostgreSQL: 5433, Redis: 6380, Backend: 3002, Web: 3003
    goto :eof

:do_setup_heroku
    echo.
    echo [HEROKU] Starte Heroku Testumgebung Setup...
    call setup_heroku_test_env.bat
    goto :eof

:finish
echo.
echo ========================================================
echo   Setup abgeschlossen! 🎉
echo ========================================================
echo.
echo Zum Beenden Taste drücken...
pause >nul
endlocal
exit /b
