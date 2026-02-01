@echo off
echo === Schritte 1-4 Ausführung gestartet ===
echo.

echo AKTUELLE AKTIONEN:
echo =================
echo 1. ✅ GCP Storage Console im Browser geöffnet
echo 2. ✅ Lokaler Ordner im Explorer geöffnet
echo 3. ✅ SSH Session zur VM gestartet
echo 4. ⏳ Warte auf manuelle Aktionen

echo.
echo JETZT MANUELL AUSFÜHREN:
echo ======================

echo SCHritt 1: BUCKET ERSTELLEN
echo 1. Im Browser: "CREATE BUCKET"
echo 2. Name: mietrecht-deploy
echo 3. Location: europe-west1
echo 4. Storage Class: Standard

echo SCHritt 2: DATEI HOCHLADEN
echo 1. In Bucket klicken
echo 2. "UPLOAD FILES" wählen
echo 3. mietrecht_simple.zip aus Ordner auswählen
echo 4. Hochladen starten

echo SCHritt 3: URL KOPIEREN
echo 1. Auf hochgeladene ZIP klicken
echo 2. "Copy URL" Button verwenden
echo 3. URL speichern

echo SCHritt 4: SSH SESSION
echo 1. Warte bis SSH verbunden ist
echo 2. Bereit für Download-Befehl

echo.
echo DANACH AUTOMATISCH:
echo ==================
echo 5. wget "DEINE_KOPIERTE_URL"
echo 6. unzip und Docker installieren
echo 7. App starten

pause