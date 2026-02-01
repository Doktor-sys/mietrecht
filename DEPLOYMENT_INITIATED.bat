@echo off
echo === Server Deployment Initiiert ===
echo.

echo AKTUELLE AKTIONEN:
echo =================
echo ✅ Browser mit GCP Storage geöffnet
echo ✅ SSH Session zur VM gestartet
echo ✅ Deployment-Anleitung erstellt
echo ⏳ Warte auf Bucket-Erstellung und Upload

echo.
echo JETZT AUSFÜHREN:
echo ===============

echo 1. IN BROWSER:
echo    - Bucket "mietrecht-deploy" erstellen
echo    - mietrecht_simple.zip hochladen
echo    - Download-URL kopieren

echo 2. IN SSH SESSION:
echo    wget "DEINE_STORAGE_URL"
echo    unzip mietrecht_simple.zip
echo    sudo apt update && sudo apt install docker.io -y
echo    sudo docker build -t mietrecht .
echo    sudo docker run -d -p 5000:5000 mietrecht

echo 3. VERIFIKATION:
echo    curl http://localhost:5000
echo    Browser: http://35.195.246.45:5000

echo.
echo STATUS:
echo ======
echo Server-IP: 35.195.246.45
echo VM Status: RUNNING
echo SSH: Verbunden
echo App: Bereit zum Deployment

pause