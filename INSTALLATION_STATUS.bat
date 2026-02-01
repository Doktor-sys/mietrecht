@echo off
echo === Mietrecht Server Installationsstatus ===
echo.

echo AKTUELLER STATUS:
echo =================
echo GCP VM: ✅ RUNNING (test)
echo Externe IP: 35.195.246.45
echo SSH-Zugang: ✅ Funktioniert
echo Web-Port 5000: ❌ Geschlossen
echo Lokale App: ✅ Läuft auf localhost:5000

echo.
echo INSTALLATIONSSCHritte BISHER:
echo ===========================
echo 1. ✅ GCP VM erstellt und konfiguriert
echo 2. ✅ SSH-Zugang eingerichtet
echo 3. ✅ Deployment-Paket erstellt (mietrecht_simple.zip)
echo 4. ⚠️  File-Transfer blockiert (SCP Fehler)
echo 5. ❌ App noch nicht auf Server deployed

echo.
echo FEHLENDE SCHRITTE:
echo ================
echo 1. Deployment-Paket auf GCP Storage hochladen
echo 2. Von VM ZIP herunterladen
echo 3. Docker auf VM installieren
echo 4. Mietrecht App starten
echo 5. Firewall öffnen (Port 5000)

echo.
echo NÄCHSTE AKTIONEN:
echo ================
echo Option A - Manuell:
echo   1. ZIP in GCP Storage Bucket laden
echo   2. SSH zur VM: gcloud compute ssh test --zone=europe-west1-b
echo   3. wget ZIP von Storage
echo   4. Docker installieren und App starten

echo Option B - Automatisch:
echo   1. SCP Problem beheben
echo   2. Automatisches Deployment-Script anpassen
echo   3. Erneuter Versuch

echo.
echo VERFÜGBAR:
echo =========
echo Lokale Entwicklung: ✅ http://localhost:5000
echo Server-Ressourcen: ✅ VM läuft
echo Zugangsdaten: ✅ Alle bekannt

pause