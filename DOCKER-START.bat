@echo off
cls
echo ==========================================================
echo       Docker Desktop Start & Repair
echo ==========================================================
echo.

echo 1. Pruefe ob Docker Desktop laeuft...
tasklist | findstr "Docker Desktop" >nul
if %errorlevel%==0 (
    echo Docker Desktop ist bereits gestartet.
) else (
    echo Starte Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Warte 30 Sekunden fuer Start...
    timeout /t 30 >nul
)

echo 2. Pruefe Docker Service...
sc query com.docker.service >nul
if %errorlevel%==0 (
    echo Docker Service laeuft.
) else (
    echo Starte Docker Service...
    net start com.docker.service 2>nul
)

echo 3. Setze Docker Context...
docker context use default 2>nul
docker version 2>nul
if %errorlevel%==0 (
    echo Docker ist erreichbar.
) else (
    echo.
    echo ==========================================================
    echo       FEHLER: Docker nicht erreichbar!
    echo ==========================================================
    echo.
    echo Bitte:
    echo 1. Docker Desktop manuell starten
    echo 2. Auf das Whale-Icon warten (Taskleiste)
    echo 3. Als Administrator ausfuehren!
    echo.
    pause
    exit /b 1
)

echo 4. Pruefe WSL2 Integration (falls aktiv)...
wsl --list 2>nul | findstr "docker" >nul
if %errorlevel%==0 (
    echo WSL2 Integration aktiv.
)

echo 5. Teste einfachen Docker Befehl...
docker run --rm hello-world
if %errorlevel%==0 (
    echo.
    echo ==========================================================
    echo       DOCKER FUNKTIONIERT!
    echo ==========================================================
) else (
    echo.
    echo ==========================================================
    echo       DOCKER FEHLER!
    echo ==========================================================
)

echo.
pause