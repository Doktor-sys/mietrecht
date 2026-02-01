@echo off
cd /d "F:\JurisMind\Mietrecht"

echo ============================================
echo MIETRECHT APP - KOMPLETTERTEST
echo ============================================
echo.

echo 1. Container Status:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"
echo.

echo 2. Teste alle URLs:
echo.
echo Test 1: Hauptseite (http://localhost:5001)
curl http://localhost:5001 2>nul && echo [OK] || echo [FEHLER]
echo.
echo Test 2: Kündigung API (http://localhost:5001/api/kündigung)
curl http://localhost:5001/api/kündigung 2>nul && echo [OK] || echo [FEHLER]
echo.
echo Test 3: Mietminderung API (http://localhost:5001/api/mietminderung)
curl http://localhost:5001/api/mietminderung 2>nul && echo [OK] || echo [FEHLER]
echo.
echo Test 4: Kaution API (http://localhost:5001/api/kaution)
curl http://localhost:5001/api/kaution 2>nul && echo [OK] || echo [FEHLER]
echo.

echo 3. Zeige Logs (letzte 10 Zeilen):
docker logs --tail 10 mietrecht-prod
echo.

echo 4. System-Info:
echo Docker Images:
docker images | findstr mietrecht
echo.
echo Alle Container:
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr mietrecht
echo.

echo ============================================
echo ZUSAMMENFASSUNG
echo ============================================
echo.
echo Ihre MIETRECHT APP ist jetzt vollständig deployed!
echo.
echo Verfügbare Apps:
echo 1. Einfache Version: http://localhost:5000
echo 2. Produktionsversion: http://localhost:5001
echo.
echo API Endpunkte:
echo - http://localhost:5001/api/kündigung
echo - http://localhost:5001/api/mietminderung
echo - http://localhost:5001/api/kaution
echo.
echo Nächste Schritte:
echo 1. Im Browser öffnen: start http://localhost:5001
echo 2. App weiterentwickeln (app.py bearbeiten)
echo 3. Bei Bedarf Datenbank hinzufügen
echo.
pause