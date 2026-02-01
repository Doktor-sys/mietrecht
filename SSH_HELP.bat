@echo off
echo === SSH Deployment Hilfe ===
echo.

echo PROBLEM:
echo ========
echo Automatische Befehle schlagen wegen Berechtigungen fehl.
echo Lösung: Manuelle SSH Session mit kopierten Befehlen.

echo.
echo SCHritte IN SSH SESSION:
echo ======================

echo 1. ÖFFNE SSH:
echo gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5

echo.
echo 2. KOPERE DIESE BEFEHLE:
echo =====================
echo wget https://storage.googleapis.com/mietrecht-deploy/mietrecht_simple.zip
echo unzip mietrecht_simple.zip
echo sudo apt update
echo sudo apt install docker.io -y
echo sudo docker build -t mietrecht .
echo sudo docker run -d -p 5000:5000 mietrecht

echo.
echo 3. VERIFIKATION:
echo ===============
echo curl http://localhost:5000
echo Browser: http://35.195.246.45:5000

echo.
echo TIPPS:
echo =====
echo - Befehle einzeln ausführen
echo - Bei Berechtigungsfehlern: sudo verwenden
echo - Bei Port-Konflikten: sudo netstat -tulpn | grep 5000

pause