@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:menu
cls
echo ========================================================
echo   SmartLaw Mietrecht - Entwicklungsumgebung
   echo ========================================================
echo.
echo [1] Mit Docker starten (empfohlen)
echo [2] Ohne Docker starten
echo [3] Abbrechen
echo.
set /p choice="Bitte wählen Sie eine Option [1-3]: "

goto option_%choice% 2>nul || (
    echo.
    echo [FEHLER] Ungültige Auswahl. Bitte geben Sie eine Zahl zwischen 1 und 3 ein.
    timeout /t 3 >nul
    goto :menu
)

:option_1
    call :check_docker
    if errorlevel 1 (
        pause
        goto :menu
    )
    call :start_with_docker
    goto :eof

:option_2
    call :check_node
    if errorlevel 1 (
        pause
        goto :menu
    )
    call :start_without_docker
    goto :eof

:option_3
    echo.
    echo "Vorgang abgebrochen."
    timeout /t 2 >nul
    exit /b 0

:check_docker
    echo.
    echo [INFO] Prüfe Docker Installation...
    docker --version >nul 2>&1
    if errorlevel 1 (
        echo [FEHLER] Docker ist nicht installiert oder nicht im PATH.
        echo Bitte installieren Sie Docker Desktop von: https://www.docker.com/products/docker-desktop
        exit /b 1
    )
    
    docker ps >nul 2>&1
    if errorlevel 1 (
        echo [FEHLER] Docker Daemon läuft nicht.
        echo Bitte starten Sie Docker Desktop und warten Sie, bis es vollständig gestartet ist.
        exit /b 1
    )
    
    echo [OK] Docker ist installiert und läuft.
    exit /b 0

:check_node
    echo.
    echo [INFO] Prüfe Node.js Installation...
    where node >nul 2>&1
    if errorlevel 1 (
        echo [FEHLER] Node.js ist nicht installiert oder nicht im PATH.
        echo Bitte installieren Sie Node.js LTS von: https://nodejs.org/
        exit /b 1
    )
    
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js %NODE_VERSION% ist installiert.
    
    where npm >nul 2>&1
    if errorlevel 1 (
        echo [FEHLER] npm ist nicht im PATH verfügbar.
        exit /b 1
    )
    
    echo [OK] npm ist verfügbar.
    exit /b 0

:start_with_docker
    echo.
    echo [INFO] Starte Anwendung mit Docker...
    
    cd /d "%~dp0"
    
    echo [INFO] Erstelle und starte Docker-Container...
    docker-compose up -d --build
    
    if errorlevel 1 (
        echo [FEHLER] Fehler beim Starten der Docker-Container.
        exit /b 1
    )
    
    echo.
    echo ========================================================
    echo   Anwendung wird gestartet...
    echo   - Frontend: http://localhost:3000
    echo   - Backend:  http://localhost:3001
    echo   - Prisma Studio: http://localhost:5555
    echo.
    echo   Tipp: Docker-Container können mit 'docker-compose down' gestoppt werden.
    echo ========================================================
    
    start http://localhost:3000
    exit /b 0

:start_without_docker
    echo.
    echo [INFO] Starte Anwendung ohne Docker...
    
    cd /d "%~dp0"
    
    echo [INFO] Installiere Abhängigkeiten...
    call npm install
    
    if errorlevel 1 (
        echo [FEHLER] Fehler beim Installieren der Abhängigkeiten.
        exit /b 1
    )
    
    cd services/backend
    
    echo [INFO] Installiere Backend-Abhängigkeiten...
    call npm install
    
    if errorlevel 1 (
        echo [FEHLER] Fehler beim Installieren der Backend-Abhängigkeiten.
        exit /b 1
    )
    
    echo [INFO] Generiere Prisma Client...
    call npx prisma generate
    
    if errorlevel 1 (
        echo [FEHLER] Fehler beim Generieren des Prisma Clients.
        echo Versuche mit --force...
        call npx prisma generate --force
        
        if errorlevel 1 (
            echo [FEHLER] Konnte den Prisma Client nicht generieren.
            exit /b 1
        )
    fi
    
    echo [INFO] Starte Backend-Server...
    start "Backend" cmd /k "npm run dev"
    
    cd ../..
    cd web-app
    
    echo [INFO] Installiere Frontend-Abhängigkeiten...
    call npm install
    
    if errorlevel 1 (
        echo [FEHLER] Fehler beim Installieren der Frontend-Abhängigkeiten.
        exit /b 1
    )
    
    echo [INFO] Starte Frontend-Entwicklungsserver...
    start "Frontend" cmd /k "npm run dev"
    
    echo.
    echo ========================================================
    echo   Anwendung wird gestartet...
    echo   - Frontend: http://localhost:3000
    echo   - Backend:  http://localhost:3001
    echo.
    echo   Tipp: Drücken Sie Strg+C in den geöffneten Konsolen,
    echo   um die Server zu stoppen.
    echo ========================================================
    
    start http://localhost:3000
    exit /b 0
