@echo off
echo === Mietrecht App SSH Deployment ===
echo.

echo AUSZUFÜHRENDE BEFEHLE:
echo =====================

echo 1. DOWNLOAD:
echo wget https://storage.googleapis.com/mietrecht-deploy/mietrecht_simple.zip

echo 2. ENTZIPEN:
echo unzip mietrecht_simple.zip

echo 3. DOCKER INSTALLIEREN:
echo sudo apt update && sudo apt install docker.io -y

echo 4. APP Bauen:
echo sudo docker build -t mietrecht .

echo 5. APP STARTEN:
echo sudo docker run -d -p 5000:5000 mietrecht

echo.
echo ALTERNATIVE EINZELBEFEHLE:
echo =======================
echo gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5 --command="wget https://storage.googleapis.com/mietrecht-deploy/mietrecht_simple.zip"
echo gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5 --command="unzip mietrecht_simple.zip"
echo gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5 --command="sudo apt update && sudo apt install docker.io -y"
echo gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5 --command="sudo docker build -t mietrecht ."
echo gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5 --command="sudo docker run -d -p 5000:5000 mietrecht"

echo.
echo VERIFIKATION:
echo =============
echo curl http://localhost:5000
echo Browser: http://35.195.246.45:5000

pause