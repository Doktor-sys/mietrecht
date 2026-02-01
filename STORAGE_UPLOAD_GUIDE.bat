@echo off
echo === GCP Storage Bucket Setup ===
echo.

echo SCHRITTE IN GOOGLE CLOUD STORAGE:
echo =================================

echo 1. BROWSER ÖFFNET AUTOMATISCH:
echo    https://console.cloud.google.com/storage/browser?project=beaming-sunset-484720-e5

echo.
echo 2. BUCKET ERSTELLEN:
echo    - Klick "CREATE BUCKET"
echo    - Name: mietrecht-deploy
echo    - Location: europe-west1
echo    - Storage Class: Standard
echo    - Access: Uniform

echo.
echo 3. DATEI HOCHLADEN:
echo    - In Bucket klicken
echo    - "UPLOAD FILES" wählen
echo    - mietrecht_simple.zip auswählen
echo    - Hochladen starten

echo.
echo 4. DOWNLOAD-URL KOPIEREN:
echo    - Auf ZIP-Datei klicken
echo    - "Copy URL" Button
echo    - URL speichern (ähnlich: https://storage.googleapis.com/mietrecht-deploy/mietrecht_simple.zip)

echo.
echo 5. SSH SESSION STARTEN:
echo    gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5

echo.
echo AUF DER VM AUSFÜHREN:
echo ===================
echo wget "DEINE_DOWNLOAD_URL"
echo unzip mietrecht_simple.zip
echo sudo apt update && sudo apt install docker.io -y
echo sudo docker build -t mietrecht .
echo sudo docker run -d -p 5000:5000 mietrecht

pause