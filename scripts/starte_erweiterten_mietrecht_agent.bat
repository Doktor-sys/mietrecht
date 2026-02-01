@echo off
REM Starte den erweiterten Mietrecht-Agenten

REM Setze das Arbeitsverzeichnis auf das Script-Verzeichnis
cd /d "%~dp0"

REM Starte den Agenten
node enhanced_mietrecht_agent.js

REM Warte auf Benutzereingabe bevor das Fenster geschlossen wird
pause