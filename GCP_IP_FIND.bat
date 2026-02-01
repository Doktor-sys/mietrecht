@echo off
echo === Google Cloud Server-IP finden ===
echo.

echo SCHRITTE IN GOOGLE CLOUD CONSOLE:
echo =================================

echo 1. Browser öffnet automatisch:
echo    https://console.cloud.google.com/compute/instances?project=beaming-sunset-484720-e5

echo.
echo 2. SUCHEN SIE:
echo    - Column "Name" - Ihre VM Instanz
echo    - Column "Zone" - Standort (z.B. europe-west1-b)
echo    - Column "External IP" - Das ist Ihre Server-IP!

echo.
echo 3. WICHTIGE INFOS:
echo    - Status muss "RUNNING" sein
echo    - Merken Sie sich Zone und Name
echo    - External IP kann sich ändern (wenn nicht reserviert)

echo.
echo 4. SSH ZUGANG:
echo    - Klick auf SSH Button in der Zeile
echo    - Oder: gcloud compute ssh INSTANCE_NAME --zone ZONE

echo.
echo 5. FIREWALL REGELN:
echo    - Navigation: VPC Network ^> Firewall
echo    - Regel für Port 5000 erstellen
echo    - Allow tcp:5000 von 0.0.0.0/0

echo.
echo TYPISCHE IP-FORMATE:
echo ===================
echo Extern: 35.xxx.xxx.xxx (öffentliche IP)
echo Intern: 10.xxx.xxx.xxx (private IP)
echo Für Upload: EXTERNE IP verwenden!

echo.
echo NACH DEM FINDEN:
echo ================
echo 1. IP in upload_to_server_configured.sh eintragen
echo 2. Zone und Instance Name merken
echo 3. gcloud SDK ggf. authentifizieren

pause