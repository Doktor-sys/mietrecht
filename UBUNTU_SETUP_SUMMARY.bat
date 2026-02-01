@echo off
echo === Mietrecht Ubuntu Server Setup ===
echo.

echo ERSTELLTE DATEIEN:
echo =================
echo 1. ubuntu_setup.sh - Ubuntu Installationsscript
echo 2. start_mietrecht_ubuntu.sh - Production Startscript  
echo 3. UBUNTU_INSTALLATION.md - Vollständige Anleitung

echo.
echo NÄCHSTE SCHRITTE:
echo ===============
echo 1. Ubuntu Server bereitstellen (20.04 LTS+)
echo 2. ubuntu_setup.sh auf Server kopieren und ausführen
echo 3. Anwendungsdateien übertragen:
echo    - mietrecht_full.py
echo    - Dockerfile.flask
echo    - docker-compose.mietrecht_full.yml
echo    - .env.build
echo 4. start_mietrecht_ubuntu.sh ausführen

echo.
echo SERVER ZUGRIFF:
echo ==============
echo URL: http://SERVER_IP:5000
echo SSH: ssh username@server_ip
echo SCP: scp * username@server_ip:~/mietrecht-app/

echo.
echo WICHTIGE HINWEISE:
echo ================
echo - Docker muss installiert sein
echo - Firewall Port 5000 muss offen sein
echo - API-Keys in .env konfigurieren
echo - Autostart-Service einrichten (optional)

echo.
echo VERWALTUNG:
echo ==========
echo Status: docker-compose ps
echo Logs: docker-compose logs -f
echo Stop: docker-compose down
echo Restart: docker-compose restart

pause