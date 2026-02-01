@echo off
echo === Mietrecht Deployment zu GCP Server ===
echo.

set SERVER_IP=35.195.246.45
set SERVER_USER=dr.nimmerrichter@gmail.com
set DEPLOY_DIR=/opt/jurismind

echo Server: %SERVER_IP%
echo Benutzer: %SERVER_USER%
echo Zielverzeichnis: %DEPLOY_DIR%
echo.

echo 1. Deployment-Paket prüfen...
if not exist "deployment.zip" (
    echo Fehler: deployment.zip nicht gefunden!
    powershell -ExecutionPolicy Bypass -File "pack_for_server.ps1"
)

echo.
echo 2. ZIP auf Server kopieren...
gcloud compute scp deployment.zip test:~/ --zone=europe-west1-b --project=beaming-sunset-484720-e5

echo.
echo 3. Auf Server entpacken...
gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5 --command="sudo mkdir -p %DEPLOY_DIR% && sudo unzip -o ~/deployment.zip -d %DEPLOY_DIR% && sudo rm ~/deployment.zip && sudo chown -R root:root %DEPLOY_DIR% && ls -la %DEPLOY_DIR%"

echo.
echo 4. Docker installieren (falls nötig)...
gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5 --command="sudo apt update && sudo apt install docker.io docker-compose -y || echo 'Docker bereits installiert'"

echo.
echo 5. Anwendung starten...
gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5 --command="cd %DEPLOY_DIR% && sudo docker-compose up -d"

echo.
echo === Deployment abgeschlossen ===
echo Zugriff: http://%SERVER_IP%:5000
echo Logs: gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5 --command="cd %DEPLOY_DIR% && sudo docker-compose logs"