@echo off
echo === Google Cloud Deployment Automatisierung ===
echo.

REM Google Cloud SDK Pfad
set GCLOUD_PATH=C:\Users\%USERNAME%\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd

REM Projekt-Einstellungen
set PROJECT_ID=beaming-sunset-484720-e5
set SERVICE_NAME=jurismind-mietrecht
set REGION=europe-west1

echo 1. Authentifizierung prüfen...
%GCLOUD_PATH% auth list >nul 2>&1
if %errorlevel% neq 0 (
    echo Authentifizierung erforderlich...
    %GCLOUD_PATH% auth login
)

echo 2. Projekt setzen...
%GCLOUD_PATH% config set project %PROJECT_ID%

echo 3. APIs aktivieren...
%GCLOUD_PATH% services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com

echo 4. Container bauen und pushen...
%GCLOUD_PATH% builds submit --tag gcr.io/%PROJECT_ID%/%SERVICE_NAME% .

echo 5. Auf Cloud Run deployen...
%GCLOUD_PATH% run deploy %SERVICE_NAME% ^
    --image gcr.io/%PROJECT_ID%/%SERVICE_NAME% ^
    --platform managed ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --port 5000 ^
    --memory 1Gi ^
    --cpu 1

echo.
echo === Deployment abgeschlossen ===
echo Service-URL:
%GCLOUD_PATH% run services describe %SERVICE_NAME% --platform managed --region %REGION% --format "value(status.url)"

pause