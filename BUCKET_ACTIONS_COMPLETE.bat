@echo off
echo === Automatische Bucket-Aktionen abgeschlossen ===
echo.

echo DURCHGEFÜHRTE AKTIONEN:
echo =====================
echo 1. ✅ Bucket "mietrecht-deploy" erstellt
echo 2. ✅ mietrecht_simple.zip hochgeladen
echo 3. ✅ Download-URL generiert
echo 4. ⚠️  SSH Session läuft im Hintergrund

echo.
echo DOWNLOAD-INFORMATIONEN:
echo ======================
echo Bucket: gs://mietrecht-deploy/
echo Datei: mietrecht_simple.zip
echo Download-URL: https://storage.googleapis.com/mietrecht-deploy/mietrecht_simple.zip

echo.
echo NÄCHSTE SCHRITTE IN SSH:
echo ======================
echo 1. Warte bis SSH verbunden ist
echo 2. Führe aus:
echo    wget https://storage.googleapis.com/mietrecht-deploy/mietrecht_simple.zip
echo    unzip mietrecht_simple.zip
echo    sudo apt update && sudo apt install docker.io -y
echo    sudo docker build -t mietrecht .
echo    sudo docker run -d -p 5000:5000 mietrecht

echo.
echo VERIFIKATION:
echo =============
echo Nach Deployment: http://35.195.246.45:5000

pause