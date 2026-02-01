# JurisMind Server Bereitstellung - Kurzanleitung

## Voraussetzungen
- Ubuntu 22.04/24.04 Server mit Docker
- Domain mit DNS-A-Record auf Server-IP
- SSH-Zugang als root

## Schnellstart (auf dem Server):

```bash
# 1. Projektordner erstellen
mkdir -p /opt/jurismind
cd /opt/jurismind

# 2. deployment.zip hochladen (von Ihrem lokalen Rechner)
# scp deployment.zip root@ihre-server-ip:/opt/jurismind/

# 3. Entpacken
unzip deployment.zip

# 4. Umgebungsvariablen konfigurieren
nano .env
# Wichtige Variablen:
# - FLASK_SECRET_KEY=ihre-lange-zufällige-secret-key
# - DATABASE_URL=postgresql://user:pass@localhost/db

# 5. Docker Compose starten
docker compose -f docker-compose.prod.yml up -d --build

# 6. Status prüfen
docker ps
curl -I https://ihre-domain.de
```

## Wichtige Dateien im Paket:
- `mietrecht_full.py` - Haupt-Flask-Anwendung
- `Dockerfile` - Container-Build-Instruktionen
- `docker-compose.prod.yml` - Produktionskonfiguration mit Caddy (HTTPS)
- `requirements.txt` - Python-Abhängigkeiten
- `static/` - CSS, JS und Bilddateien
- `.env` - Umgebungskonfiguration

## Nach der Bereitstellung:
1. Prüfen Sie `https://ihre-domain.de` im Browser
2. Stellen Sie sicher, dass das SSL-Zertifikat aktiv ist (Schloss-Symbol)
3. Testen Sie die API-Endpunkte
4. Konfigurieren Sie regelmäßige Backups

## Updates einspielen:
```bash
cd /opt/jurismind
# Neue deployment.zip hochladen und entpacken
unzip -o deployment.zip
docker compose -f docker-compose.prod.yml up -d --build
```