@echo off
echo === JurisMind Mietrecht - Täglicher Workflow ===
echo.

echo MORGENROUTINE:
echo =============
echo 1. Docker Desktop starten
echo 2. Start_Real_Mietrecht.bat ausführen
echo 3. Warten bis alle Services gestartet sind (~30 Sekunden)
echo 4. Browser öffnet automatisch http://localhost:5000

echo.
echo ARBEITSABLAUF:
echo ============
echo 1. Code-Änderungen in mietrecht_full.py vornehmen
echo 2. Speichern - Änderungen sind sofort aktiv (Hot-Reload)
echo 3. Im Browser aktualisieren um Änderungen zu sehen
echo 4. Bei Fehlern: Container-Logs prüfen

echo.
echo PROBLEMLOSER BETRIEB:
echo ===================
echo ✅ Schnelle Startzeit (~30 Sekunden)
echo ✅ Sofortige Code-Änderungen sichtbar
echo ✅ Alle Services integriert verfügbar
echo ✅ Stabile Entwicklungsumgebung

echo.
echo WICHTIGE DATEIEN:
echo ===============
echo Hauptscript: Start_Real_Mietrecht.bat
echo Konfiguration: docker-compose.mietrecht_full.yml
echo Anwendung: mietrecht_full.py
echo Umgebung: .env Dateien

echo.
echo SUPPORT:
echo =======
echo Bei Problemen:
echo 1. Docker Desktop neu starten
echo 2. Container stoppen: docker-compose -f docker-compose.mietrecht_full.yml down
echo 3. Neu starten mit Start_Real_Mietrecht.bat

pause