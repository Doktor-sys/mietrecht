@echo off
echo === Mietrecht App Server Deployment ===
echo.

echo SCHRITT 1: STORAGE BUCKET ERSTELLEN
echo ===================================
echo 1. Browser öffnet automatisch GCP Storage
echo 2. Klick "CREATE BUCKET"
echo 3. Name: mietrecht-deploy
echo 4. Location: europe-west1
echo 5. Storage Class: Standard

echo.
echo SCHRITT 2: DATEI HOCHLADEN
echo =======================
echo 1. In erstellten Bucket gehen
echo 2. "UPLOAD FILES" klicken
echo 3. mietrecht_simple.zip auswählen
echo 4. Hochladen starten
echo 5. Download-URL kopieren

echo.
echo SCHRITT 3: SSH ZUR VM
echo ===================
echo Befehl:
echo gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5

echo.
echo SCHRITT 4: AUF VM AUSFÜHREN
echo =======================
echo wget "DEINE_KOPIERTE_STORAGE_URL"
echo unzip mietrecht_simple.zip
echo sudo apt update
echo sudo apt install docker.io -y
echo sudo docker build -t mietrecht .
echo sudo docker run -d -p 5000:5000 mietrecht

echo.
echo SCHRITT 5: VERIFIKATION
echo =====================
echo curl http://localhost:5000
echo Browser: http://35.195.246.45:5000

echo.
echo WICHTIGE INFOS:
echo ==============
echo Server-IP: 35.195.246.45
echo VM: test (europe-west1-b)
echo Projekt: beaming-sunset-484720-e5

pause