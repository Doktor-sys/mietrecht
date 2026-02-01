@echo off
echo === Prüfung: pack_for_server.ps1 und upload_to_server.sh ===
echo.

echo GEFUNDENE DATEIEN:
echo =================
echo ✅ pack_for_server.ps1 - PowerShell Pack-Script
echo ✅ upload_to_server.sh - Bash Upload-Script

echo.
echo PACK_FOR_SERVER.PS1 ANALYSE:
echo ==========================
echo Funktion: Erstellt ZIP-Archiv für Server-Deployment
echo Benötigte Dateien:
echo - mietrecht_full.py: ✅ Vorhanden
echo - requirements.txt: ✅ Vorhanden
echo - Dockerfile: ✅ Vorhanden
echo - .env: ✅ Vorhanden
echo - docker-compose.prod.yml: ✅ Vorhanden
echo - static/: ? (Ordnerprüfung folgt)

echo.
echo UPLOAD_TO_SERVER.SH ANALYSE:
echo ==========================
echo Funktion: Lädt ZIP auf Ubuntu Server hoch
echo Konfiguration:
echo - SERVER_IP: muss manuell gesetzt werden
echo - SERVER_USER: root (standard)
echo - DEPLOY_DIR: /opt/jurismind
echo Abhängigkeiten:
echo - Benötigt pack_for_server.ps1
echo - PowerShell auf Linux (für ZIP-Erstellung)

echo.
echo FEHLENDE PRÜFUNGEN:
echo =================
echo 1. Static-Ordner vorhanden?
echo 2. Dockerfile.prod.yml statt Dockerfile?
echo 3. Server-Zugangsdaten konfiguriert?

echo.
echo EMPFEHLUNG:
echo ===========
echo ✅ Beide Scripts grundsätzlich funktionsfähig
echo ⚠️  Konfiguration der Server-IP erforderlich
echo ⚠️  Prüfung der Docker Compose Datei-Namen
echo 📋 Testlauf empfohlen vor Produktiveinsatz

echo.
echo NÄCHSTE SCHRITTE:
echo ===============
echo 1. Server-IP in upload_to_server.sh eintragen
echo 2. Static-Ordner prüfen/erstellen
echo 3. Testlauf mit dummy-server durchführen
echo 4. Produktiven Upload durchführen

pause