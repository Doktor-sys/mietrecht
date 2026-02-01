@echo off
echo === JurisMind Deployment Fehleranalyse ===
echo.

echo AKTUELLE SITUATION:
echo ==================
echo ❌ Cloud Build fehlschlägt immer wegen fehlender .env Datei
echo ✅ Lokale Entwicklung funktioniert perfekt (http://localhost:5000)
echo ⚠️  Cloud Run Service existiert aber startet nicht

echo.
echo FEHLERANALYSE:
echo ==============
echo Problem: Cloud Build verwendet falsches Dockerfile
echo Ursache: .dockerignore schließt .env aus, aber Dockerfile verlangt sie
echo Status: 5 fehlgeschlagene Builds hintereinander

echo.
echo VERFÜGBARE OPTIONEN:
echo ===================
echo 1. MANUELLES DEPLOYMENT:
echo    - Gehe zu: https://console.cloud.google.com/run
echo    - Erstelle neuen Service manuell
echo    - Wähle Container Image von Docker Hub

echo.
echo 2. LOKALE ALTERNATIVE:
echo    - Docker Hub Account erstellen
echo    - docker build -t username/mietrecht .
echo    - docker push username/mietrecht
echo    - Image in Cloud Run verwenden

echo.
echo 3. DIREKTE LÖSUNG:
echo    - Erstelle Google Cloud Secret für .env
echo    - Referenziere Secret im Dockerfile

echo.
echo EMPFEHLUNG:
echo ===========
echo ✅ BLEIBE BEI LOKALER ENTWICKLUNG
echo ✅ http://localhost:5000 ist voll funktionsfähig
echo ✅ Cloud Deployment bei Bedarf später nachholen

echo.
echo TECHNISCHE DETAILS:
echo ==================
echo Projekt: beaming-sunset-484720-e5
echo Region: europe-west1
echo Letzter Build: ceb1e2b1-0656-4021-a51b-2e019ba071ea
echo Fehler: COPY .env - Datei nicht gefunden

pause