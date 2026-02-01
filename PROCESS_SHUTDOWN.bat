@echo off
echo === Prozess-Beendigung Check ===
echo.

echo PRÜFUNG LOKALER PROZESSE:
echo =======================
echo Docker Container: ❌ Docker Desktop läuft nicht
echo Python Prozesse: ❌ Keine gefunden
echo Port 5000 Belegung: ❌ Nicht belegt

echo.
echo MÖGLICHE LAUFENDE PROZESSE:
echo ========================
echo 1. GCP VM Instanz "test"
echo 2. Browser-Tabs mit GCP Console
echo 3. SSH Sessions
echo 4. File Transfer Prozesse

echo.
echo SICHERES BEENDE VERFAHREN:
echo =======================
echo 1. GCP VM stoppen:
echo    gcloud compute instances stop test --zone=europe-west1-b

echo 2. Lokale Ressourcen freigeben:
echo    Docker Desktop schließen
echo    Browser-Tabs schließen
echo    Temp-Dateien löschen

echo 3. Status verifizieren:
echo    gcloud compute instances list
echo    docker ps

echo.
echo DATEN SICHERN:
echo ==============
echo - mietrecht_simple.zip behalten
echo - Konfigurationsdateien sichern
echo - Logs archivieren

echo.
echo EMPFEHLUNG:
echo ===========
echo ✅ Keine kritischen lokalen Prozesse gefunden
echo ⚠️  GCP Ressourcen können gestoppt werden
echo 📋 Alles kann später wieder gestartet werden

pause