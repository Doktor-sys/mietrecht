@echo off
echo === Server-IP Konfiguration ===
echo.

echo SCHRITTE ZUR KONFIGURATION:
echo ========================
echo 1. Server-IP ermitteln:
echo    - Ubuntu: ifconfig oder ip addr
echo    - Cloud: Dashboard oder DNS-Name

echo.
echo 2. In upload_to_server_configured.sh eintragen:
echo    Zeile 9: SERVER_IP="IHRE_IP_ADRESSE"
echo    Zeile 10: SERVER_USER="ubuntu" (oder root)

echo.
echo 3. SSH-Zugang einrichten:
echo    Option A: SSH-Key kopieren
echo    Option B: Passwort-Authentifizierung

echo.
echo 4. Firewall öffnen:
echo    sudo ufw allow 22/tcp
echo    sudo ufw allow 5000/tcp

echo.
echo 5. Testverbindung:
echo    ssh username@server_ip

echo.
echo ERSETZEN SIE DIESE WERTE:
echo =======================
echo ALT: SERVER_IP="ihre-server-ip-hier-einfügen"
echo NEU: SERVER_IP="192.168.1.100" (Beispiel)

echo.
echo NACH DER KONFIGURATION:
echo =====================
echo 1. upload_to_server_configured.sh ausführen
echo 2. Deployment.zip wird automatisch erstellt
echo 3. Dateien werden auf Server hochgeladen
echo 4. App startet unter http://SERVER_IP:5000

pause