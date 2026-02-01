@echo off
echo === JurisMind Cloud Run Fehlerdiagnose ===
echo.

echo IDENTIFIZIERTES PROBLEM:
echo ======================
echo ROOT CAUSE: .env Datei fehlt im Cloud Build Kontext
echo SYMPTOME: Weiße Seite unter https://jurismind-mietrecht-777379434356.europe-west1.run.app
echo STATUS: Container startet nicht weil Image-Build fehlschlägt

echo.
echo FEHLERDETAILS:
echo ==============
echo Fehlermeldung: "COPY failed: file not found in build context or excluded by .dockerignore: stat .env: file does not exist"
echo Build-ID: d9d3c1d3-bbc8-441e-9364-8fdc4102af5d
echo Repository: europe-west1-docker.pkg.dev/beaming-sunset-484720-e5/jurismind-repo

echo.
echo VERSUCHTE LÖSUNGEN:
echo ==================
echo 1. ✅ Google Secret Manager eingerichtet
echo 2. ✅ Secret "jurismind-env" erstellt
echo 3. ✅ Dockerfile.secret ohne .env COPY erstellt
echo 4. ⚠️  --set-secrets Parameter verwendet
echo 5. ❌ Build immer noch fehlerhaft wegen .env

echo.
echo TECHNISCHE ANALYSE:
echo ==================
echo Problem: .dockerignore schließt .env aus, aber Dockerfile benötigt sie
echo Konflikt: Secret-Mount funktioniert nicht mit aktuellem Setup
echo Lösung: Entweder .env ins Build-Kontext aufnehmen ODER vollständig auf Secrets umstellen

echo.
echo EMPFEHLUNG:
echo ===========
echo ✅ BEHALTE LOKALE ENTWICKLUNG (http://localhost:5000)
echo ⚠️  CLOUD DEPLOYMENT: Manuelle Konfiguration in Google Cloud Console erforderlich
echo ❌ Automatisches Deployment blockiert durch .env/Secret Konflikt

echo.
echo NÄCHSTE SCHRITTE FÜR CLOUD:
echo ========================
echo 1. Manuelles Deployment über Google Cloud Console
echo 2. Environment Variables direkt in Cloud Run konfigurieren
echo 3. ODER: Lokale Docker-Ausführung mit manuellem Secret-Mount testen

pause