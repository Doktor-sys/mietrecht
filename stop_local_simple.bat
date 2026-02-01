@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================================
echo   SmartLaw Mietrecht - Stoppe Testumgebung 🛑
echo ========================================================
echo.

REM Prüfe Docker-Compose Installation
set DOCKER_COMPOSE_CMD=docker compose

REM Teste ob 'docker compose' funktioniert
docker compose version >nul 2>&1
if errorlevel 1 (
    REM Falls nicht, versuche 'docker-compose' (alte Syntax)
    docker-compose version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker Compose nicht gefunden.
        echo Bitte stellen Sie sicher, dass Docker Desktop installiert und gestartet ist.
        pause
        exit /b 1
    )
    set DOCKER_COMPOSE_CMD=docker-compose
)

echo [INFO] Stoppe Docker-Container...
%DOCKER_COMPOSE_CMD% -f docker-compose.dev.yml down

echo.
echo [INFO] Container gestoppt.
echo [TIP] Zum vollständigen Entfernen der Volumes verwenden Sie:
echo   %DOCKER_COMPOSE_CMD% -f docker-compose.dev.yml down -v
echo.
pause

