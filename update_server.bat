@echo off
echo ========================================
echo  JurisMind Server Update Script
echo ========================================
echo.
echo Aktualisiere Server mit der bereinigten Anwendung...
echo.

echo 1. Stoppe laufende Container...
docker-compose -f docker-compose.prod.yml down

echo.
echo 2. Baue neues Image mit bereinigter Anwendung...
docker-compose -f docker-compose.prod.yml build --no-cache

echo.
echo 3. Starte Server mit neuer Version...
docker-compose -f docker-compose.prod.yml up -d

echo.
echo 4. Zeige Container-Status...
docker-compose -f docker-compose.prod.yml ps

echo.
echo 5. Zeige Logs der letzten 20 Zeilen...
docker-compose -f docker-compose.prod.yml logs --tail=20

echo.
echo ========================================
echo Server-Update abgeschlossen!
echo.
echo Die Anwendung sollte jetzt unter folgenden URLs verfügbar sein:
echo - https://35-195-246-45.nip.io/smartlaw-agent
echo - https://mietrecht.jurismind.app/smartlaw-agent
echo ========================================
pause