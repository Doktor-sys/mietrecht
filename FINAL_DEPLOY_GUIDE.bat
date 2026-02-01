@echo off
echo === FERTIGE DEPLOYMENT-ANLEITUNG ===
echo.

echo AKTUELLE SITUATION:
echo ==================
echo ✅ Browser mit Storage Console geöffnet
echo ✅ SSH Session zur VM gestartet
echo ✅ mietrecht_simple.zip bereit zum Upload
echo ⏳ Warte auf Bucket-Erstellung und Upload

echo.
echo JETZT AUSFÜHREN:
echo ===============

echo 1. IN BROWSER (Storage Console):
echo    - Bucket "mietrecht-deploy" erstellen
echo    - mietrecht_simple.zip hochladen
echo    - Download-URL kopieren

echo.
echo 2. IN SSH SESSION (VM Terminal):
echo    wget "DEINE_KOPIERTE_URL"
echo    unzip mietrecht_simple.zip
echo    sudo apt update && sudo apt install docker.io -y
echo    sudo docker build -t mietrecht .
echo    sudo docker run -d -p 5000:5000 mietrecht

echo.
echo 3. VERIFIKATION:
echo    curl http://localhost:5000
echo    oder Browser: http://35.195.246.45:5000

echo.
echo WICHTIGE INFOS:
echo ==============
echo Server-IP: 35.195.246.45
echo VM Name: test
echo Zone: europe-west1-b
echo Projekt: beaming-sunset-484720-e5

echo.
echo TROUBLESHOOTING:
echo ================
echo - Bei Berechtigungsfehlern: sudo vor Befehlen
echo - Bei Port-Konflikten: sudo netstat -tulpn | grep 5000
echo - Logs: sudo docker logs CONTAINER_ID

pause