@echo off
echo === Nächster Schritt: Manuelle SSH Deployment ===
echo.

echo SCHRITT 1: SSH SESSION ÖFFNEN
echo ===========================
echo Führe diesen Befehl im Terminal aus:
echo gcloud compute ssh test --zone=europe-west1-b --project=beaming-sunset-484720-e5

echo.
echo SCHRITT 2: DATEI ÜBERTRAGEN
echo =======================
echo In der SSH Session:
echo scp achim@mietrecht:/f/JurisMind/Mietrecht/mietrecht_simple.zip ~/

echo.
echo SCHRITT 3: BEFEHLE AUSFÜHREN
echo ========================
echo 1. Entpacken:
echo    unzip mietrecht_simple.zip

echo 2. Docker installieren:
echo    sudo apt update
echo    sudo apt install docker.io -y

echo 3. App bauen:
echo    sudo docker build -t mietrecht .

echo 4. App starten:
echo    sudo docker run -d -p 5000:5000 mietrecht

echo.
echo SCHRITT 4: VERIFIKATION
echo =====================
echo Prüfe ob App läuft:
echo curl http://localhost:5000

echo Teste im Browser:
echo http://35.195.246.45:5000

echo.
echo FEHLERBEHEBUNG:
echo ===============
echo Bei Berechtigungsfehlern: sudo vor Befehlen
echo Bei Port-Konflikten: sudo netstat -tulpn | grep 5000
echo Logs anzeigen: sudo docker logs CONTAINER_ID

pause