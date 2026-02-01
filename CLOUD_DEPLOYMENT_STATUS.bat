@echo off
echo === JurisMind Google Cloud Deployment - Status Report ===
echo.

REM Google Cloud SDK Pfad
set GCLOUD_PATH=C:\Users\%USERNAME%\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd

REM Projekt-Einstellungen
set PROJECT_ID=beaming-sunset-484720-e5
set SERVICE_NAME=jurismind-mietrecht
set REGION=europe-west1

echo AKTUELLER STATUS:
echo =================
echo ✅ Google Cloud SDK installiert und authentifiziert
echo ✅ Projekt: %PROJECT_ID% konfiguriert
echo ✅ Artifact Registry Repository erstellt
echo ✅ Lokale Entwicklungsumgebung läuft (http://localhost:5000)
echo ⚠️  Container-Builds fehlgeschlagen wegen .env Problemen
echo ⚠️  Cloud Run Deployment blockiert durch fehlende Images

echo.
echo DIAGNOSE:
echo =========
echo Problem: .env Datei wird vom Build-Kontext ausgeschlossen
echo Lösung: Entferne .env aus Dockerfile oder verwende Secrets

echo.
echo NÄCHSTE SCHRITTE:
echo ===============
echo 1. Manuelles Build ohne .env:
echo    Erstelle Dockerfile ohne COPY .env Zeile

echo.
echo 2. Alternative Deployment-Optionen:
echo    a) Google Cloud Console verwenden
echo    b) GitHub Actions CI/CD einrichten
echo    c) Terraform für Infrastructure as Code

echo.
echo 3. Direkter Link zur Cloud Console:
echo    https://console.cloud.google.com/run?project=%PROJECT_ID%

echo.
echo 4. Lokale App ist voll funktionsfähig:
echo    http://localhost:5000

pause