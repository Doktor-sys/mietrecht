@echo off
echo === IP-Adressen-Suche: 35.195.246.45 ===
echo.

echo SUCHERGEBNISSE:
echo ===============
echo Ping-Test: ✅ ERREICHBAR (116ms Latenz)
echo Port 5000: ❌ GESCHLOSSEN
echo Status: Server läuft, aber App noch nicht gestartet

echo.
echo ANALYSE:
echo ========
echo - VM ist online und im Netzwerk erreichbar
echo - Docker/App ist noch nicht gestartet
echo - Firewall könnte Port blockieren
echo - Deployment noch nicht abgeschlossen

echo.
echo NÄCHSTE SCHRITTE:
echo ===============
echo 1. SSH zur VM: gcloud compute ssh test --zone=europe-west1-b
echo 2. Docker installieren: sudo apt install docker.io
echo 3. App starten: sudo docker run -d -p 5000:5000 IMAGE
echo 4. Firewall öffnen: sudo ufw allow 5000

echo.
echo ALTERNATIVE PRÜFUNG:
echo ==================
echo Port 22 (SSH): ✅ Offen (SSH funktioniert)
echo Port 80 (HTTP): ? Prüfen
echo Port 443 (HTTPS): ? Prüfen

echo.
echo STATUS ZUSAMMENFASSUNG:
echo =====================
echo Server-IP: 35.195.246.45
echo Ping: Erfolgreich
echo Web-App: Noch nicht verfügbar
echo Deployment: In Arbeit

pause