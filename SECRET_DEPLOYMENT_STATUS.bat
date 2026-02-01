@echo off
echo === JurisMind Google Cloud Secret Deployment ===
echo.

echo DURCHGEFÜHRTE SCHRITTE:
echo =====================
echo 1. ✅ Google Secret Manager API aktiviert
echo 2. ✅ Secret "jurismind-env" erstellt mit .env Inhalt
echo 3. ✅ Dockerfile.secret ohne .env COPY erstellt
echo 4. ⚠️  Deployment mit --set-secrets versucht
echo 5. ⚠️  Service antwortet mit 404 (nicht bereit)

echo.
echo AKTUELLER STATUS:
echo =================
echo Service-URL: https://jurismind-mietrecht-777379434356.europe-west1.run.app
echo Status: 404 - Nicht gefunden
echo Grund: Container startet nicht korrekt

echo.
echo MÖGLICHE URSACHEN:
echo =================
echo 1. Secret-Mount funktioniert nicht wie erwartet
echo 2. Umgebungsvariablen werden nicht korrekt geladen
echo 3. Applikation findet Konfiguration nicht

echo.
echo NÄCHSTE SCHRITTE:
echo ===============
echo 1. Prüfe Cloud Run Logs im Google Cloud Console
echo 2. Teste lokale Docker-Ausführung mit Secret
echo 3. Alternative: Environment Variables direkt setzen

echo.
echo ALTERNATIVE LÖSUNG:
echo =================
echo Lokale Entwicklung weiterhin verfügbar:
echo ✅ http://localhost:5000

pause