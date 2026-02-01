@echo off
echo === JurisMind Google Cloud Deployment - Final Steps ===
echo.

REM Google Cloud SDK Pfad
set GCLOUD_PATH=C:\Users\%USERNAME%\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd

REM Projekt-Einstellungen
set PROJECT_ID=beaming-sunset-484720-e5
set SERVICE_NAME=jurismind-mietrecht
set REGION=europe-west1

echo Aktueller Status:
echo - Lokale App läuft auf http://localhost:5000
echo - Google Cloud authentifiziert
echo - Projekt: %PROJECT_ID%
echo.

echo Nächste Schritte:
echo 1. Manuelles Build des Containers:
echo    %GCLOUD_PATH% builds submit --tag gcr.io/%PROJECT_ID%/%SERVICE_NAME% .

echo.
echo 2. Nach erfolgreichem Build:
echo    %GCLOUD_PATH% run deploy %SERVICE_NAME% ^
    --image gcr.io/%PROJECT_ID%/%SERVICE_NAME% ^
    --platform managed ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --port 5000 ^
    --memory 1Gi ^
    --cpu 1

echo.
echo 3. Service-URL abrufen:
echo    %GCLOUD_PATH% run services describe %SERVICE_NAME% --platform managed --region %REGION% --format "value(status.url)"

echo.
echo Alternative: Direkte Bereitstellung über Cloud Console
echo https://console.cloud.google.com/run?project=%PROJECT_ID%

pause