@echo off
echo === Automatisches Mietrecht Deployment ===
echo.

echo SCHRITT 1: DATEIEN VORBEREITEN
echo =============================
echo Bucket: gs://mietrecht-deploy/
echo ZIP: mietrecht_simple.zip
echo Status: Bereit zum Deployment

echo.
echo SCHRITT 2: SCP TRANSFER
echo ====================
echo Befehl:
echo gcloud compute scp mietrecht_simple.zip test:/tmp/ --zone=europe-west1-b --project=beaming-sunset-484720-e5

echo.
echo SCHRITT 3: SSH BEFEHLE
echo ====================
echo 1. Entpacken:
echo    unzip /tmp/mietrecht_simple.zip
echo 2. Docker installieren:
echo    sudo apt update && sudo apt install docker.io -y
echo 3. App bauen:
echo    sudo docker build -t mietrecht .
echo 4. App starten:
echo    sudo docker run -d -p 5000:5000 mietrecht

echo.
echo SCHRITT 4: VERIFIKATION
echo =====================
echo curl http://localhost:5000
echo Browser: http://35.195.246.45:5000

echo.
echo FALLBACK OPTION:
echo ===============
echo Bei Problemen:
echo 1. Manuelle SSH: gcloud compute ssh test --zone=europe-west1-b
echo 2. Befehle einzeln ausfuehren
echo 3. Bei Berechtigungsfehlern: sudo verwenden

pause