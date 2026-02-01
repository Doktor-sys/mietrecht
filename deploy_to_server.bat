@echo off
setlocal enabledelayedexpansion

set SERVER_IP=35.195.246.45
set SERVER_USER=root
set REMOTE_DIR=/opt/jurismind
set ZIP_FILE=deployment.zip
set PROJECT=beaming-sunset-484720-e5
set INSTANCE_NAME=
set ZONE=
set DOMAIN=
set EMAIL=

if not "%~1"=="" set SERVER_IP=%~1
if not "%~2"=="" set SERVER_USER=%~2
if not "%~3"=="" set INSTANCE_NAME=%~3
if not "%~4"=="" set ZONE=%~4
if not "%~5"=="" set DOMAIN=%~5
if not "%~6"=="" set EMAIL=%~6

cd /d "%~dp0"

if not exist "%ZIP_FILE%" (
  powershell -Command "Compress-Archive -Path mietrecht_full.py, requirements.txt, Dockerfile, docker-compose.prod.yml, static, templates, .env, install.sh -DestinationPath deployment.zip -Force"
  if errorlevel 1 (
    echo Fehler beim Erstellen von deployment.zip
    exit /b 1
  )
)

where gcloud >nul 2>nul
if %errorlevel%==0 (
  if not "%INSTANCE_NAME%"=="" if not "%ZONE%"=="" (
    gcloud compute firewall-rules describe allow-http --project=%PROJECT% >nul 2>nul
    if errorlevel 1 (
      gcloud compute firewall-rules create allow-http --allow tcp:80 --direction=INGRESS --target-tags=http-server --source-ranges=0.0.0.0/0 --network=default --project=%PROJECT%
    )
    gcloud compute firewall-rules describe allow-https --project=%PROJECT% >nul 2>nul
    if errorlevel 1 (
      gcloud compute firewall-rules create allow-https --allow tcp:443 --direction=INGRESS --target-tags=https-server --source-ranges=0.0.0.0/0 --network=default --project=%PROJECT%
    )
    gcloud compute instances add-tags %INSTANCE_NAME% --tags=http-server,https-server --zone=%ZONE% --project=%PROJECT%
  )
)

ssh %SERVER_USER%@%SERVER_IP% "sudo mkdir -p %REMOTE_DIR%"
if errorlevel 1 (
  echo SSH-Verbindung fehlgeschlagen
  exit /b 1
)

scp "%ZIP_FILE%" %SERVER_USER%@%SERVER_IP%:%REMOTE_DIR%/
if errorlevel 1 (
  echo Datei-Upload fehlgeschlagen
  exit /b 1
)

if "%DOMAIN%"=="" (
  ssh %SERVER_USER%@%SERVER_IP% "sudo apt update && sudo apt install -y unzip && cd %REMOTE_DIR% && unzip -o deployment.zip && chmod +x install.sh && sudo ./install.sh"
) else (
  ssh %SERVER_USER%@%SERVER_IP% "sudo apt update && sudo apt install -y unzip && cd %REMOTE_DIR% && unzip -o deployment.zip && chmod +x install.sh && DOMAIN='%DOMAIN%' EMAIL='%EMAIL%' sudo ./install.sh"
)
if errorlevel 1 (
  echo Installation fehlgeschlagen
  exit /b 1
)

echo Fertig
exit /b 0
