@echo off
echo === JurisMind Deployment Troubleshooting ===
echo.

echo AKTUELLES PROBLEM:
echo =================
echo Build fehlschlägt immer wegen fehlender .env Datei
echo Obwohl .dockerignore geändert wurde

echo.
echo VERIFIKATION:
echo =============
echo 1. Prüfe ob .env Datei existiert:
dir .env

echo.
echo 2. Prüfe .dockerignore Inhalt:
findstr /C:".env" .dockerignore

echo.
echo 3. Prüfe aktuelle Build-Logs:
echo https://console.cloud.google.com/cloud-build/builds?project=beaming-sunset-484720-e5

echo.
echo LÖSUNGSANSÄTZE:
echo ===============
echo A) Erstelle Dummy .env für Build:
echo    copy .env .env.build

echo B) Verwende Google Cloud Secret Manager:
echo    gcloud secrets create jurismind-env --data-file=.env

echo C) Manuelles Deployment über Cloud Console:
echo    https://console.cloud.google.com/run/create?project=beaming-sunset-484720-e5

echo D) Lokale Alternative - Docker Hub:
echo    docker build -t jurismind/mietrecht . 
echo    docker push jurismind/mietrecht
echo    Dann in Cloud Run "Container image URL" eingeben

echo.
echo LOKALE APP:
echo ===========
echo ✅ Funktioniert: http://localhost:5000
echo ✅ Entwicklungsumgebung stabil

pause