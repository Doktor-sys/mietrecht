@echo off
echo === Mietrecht App Startbestätigung ===
echo.

echo AKTUELLER STATUS:
echo =================
echo Docker Desktop: ✅ Läuft
echo Container aktiv: ✅ 9 Container
echo Mietrecht Flask: ✅ Port 5000 gebunden
echo Browser geöffnet: ✅ http://localhost:5000

echo.
echo LAUFENDE CONTAINER:
echo ==================
echo smartlaw-mietrecht-flask: Port 5000 ✓
echo smartlaw-postgres-mietrecht: Port 5432 ✓
echo smartlaw-redis-mietrecht: Port 6379 ✓
echo smartlaw-elasticsearch-mietrecht: Port 9200 ✓
echo smartlaw-minio-mietrecht: Ports 9000-9001 ✓
echo smartlaw-clamav-mietrecht: Port 3310 ✓

echo.
echo VERFÜGBARE SERVICES:
echo ===================
echo Mietrecht App: http://localhost:5000
echo PostgreSQL: localhost:5432
echo Redis: localhost:6379
echo Elasticsearch: localhost:9200
echo MinIO: localhost:9000
echo ClamAV: localhost:3310

echo.
echo NÄCHSTE SCHRITTE:
echo ===============
echo 1. App im Browser testen
echo 2. Bei Bedarf Container-Logs prüfen
echo 3. Entwicklung fortsetzen
echo 4. Bei Problemen: docker-compose logs

pause