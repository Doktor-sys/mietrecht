@echo off
REM Starte den Web-Konfigurationsserver des Mietrecht-Agenten

REM Setze das Arbeitsverzeichnis auf das Script-Verzeichnis
cd /d "%~dp0"

REM Starte den Web-Server
node web_config_server.js

REM Warte auf Benutzereingabe bevor das Fenster geschlossen wird
pause