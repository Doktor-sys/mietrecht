@echo off
echo === Manuelles GCP Deployment ===
echo.

echo SCHRITT 1: Vereinfachtes Paket erstellen
powershell -ExecutionPolicy Bypass -File "pack_simple.ps1"

echo.
echo SCHRITT 2: ZIP im Browser öffnen
echo Öffne diesen Ordner im Explorer:
explorer .

echo.
echo SCHRITT 3: Manueller Upload
echo 1. Lade mietrecht_simple.zip in Google Cloud Storage hoch
echo 2. Gehe zu: console.cloud.google.com/storage
echo 3. Erstelle Bucket "mietrecht-deploy"
echo 4. Lade ZIP in Bucket

echo.
echo SCHRITT 4: Von Server herunterladen
echo Öffne SSH Session:
echo gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5

echo.
echo SCHRITT 5: Auf Server ausführen
echo Befehle auf VM:
echo wget "GS_BUCKET_URL/mietrecht_simple.zip"
echo unzip mietrecht_simple.zip
echo sudo apt update ^&^& sudo apt install docker.io -y
echo sudo docker build -t mietrecht .
echo sudo docker run -d -p 5000:5000 mietrecht

pause