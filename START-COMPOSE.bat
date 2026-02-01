@echo off
cls
echo ==========================================================
echo       Docker Compose Start fuer Windows
echo ==========================================================
echo.

echo 1. Stoppe alte Container...
docker-compose down 2>nul

echo 2. Erstelle docker-compose.yml...
(
echo version: '3.8'
echo.
echo services:
echo   mietrecht-app:
echo     build: .
echo     container_name: mietrecht-compose
echo     ports:
echo       - "7000:5000"
echo     volumes:
echo       - ./app_simple.py:/app/app_simple.py
echo       - ./requirements.txt:/app/requirements.txt
echo     environment:
echo       - FLASK_ENV=development
echo     restart: unless-stopped
) > docker-compose.yml

echo 3. Starte mit Docker Compose...
docker-compose up -d --build

echo 4. Warte auf Start...
timeout /t 5 >nul

echo 5. Pruefe Status...
docker-compose ps

echo.
echo ==========================================================
echo Wenn alles OK: http://localhost:7000
echo Logs anzeigen: docker-compose logs -f
echo ==========================================================
echo.
pause