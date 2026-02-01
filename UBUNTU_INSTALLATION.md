# Mietrecht App Ubuntu Server Installation

## Systemvoraussetzungen
- Ubuntu 20.04 LTS oder neuer
- Mindestens 4GB RAM
- 20GB freier Speicherplatz
- Internetverbindung

## Installationsschritte

### 1. Server vorbereiten
```bash
# Als root oder mit sudo-Rechten anmelden
sudo apt update && sudo apt upgrade -y
```

### 2. Docker installieren
```bash
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Neuanmeldung erforderlich: exit und neu anmelden
```

### 3. Anwendungsdateien kopieren
```bash
# Erstelle Projektverzeichnis
mkdir -p ~/mietrecht-app
cd ~/mietrecht-app

# Kopiere folgende Dateien vom Entwicklungsrechner:
# - mietrecht_full.py
# - Dockerfile.flask
# - docker-compose.mietrecht_full.yml
# - .env.build
# - ubuntu_setup.sh
# - start_mietrecht_ubuntu.sh
```

### 4. Berechtigungen setzen
```bash
chmod +x ubuntu_setup.sh
chmod +x start_mietrecht_ubuntu.sh
```

### 5. Anwendung starten
```bash
./start_mietrecht_ubuntu.sh
```

## Wichtige Befehle

### Services verwalten
```bash
# Services starten
docker-compose -f docker-compose.mietrecht_full.yml up -d

# Services stoppen
docker-compose -f docker-compose.mietrecht_full.yml down

# Services neustarten
docker-compose -f docker-compose.mietrecht_full.yml restart
```

### Monitoring
```bash
# Status prüfen
docker-compose -f docker-compose.mietrecht_full.yml ps

# Logs anzeigen
docker-compose -f docker-compose.mietrecht_full.yml logs -f

# Systemressourcen
docker stats
```

## Firewall Konfiguration
```bash
# Port 5000 öffnen
sudo ufw allow 5000/tcp
sudo ufw enable
```

## Autostart einrichten
Erstelle `/etc/systemd/system/mietrecht.service`:
```ini
[Unit]
Description=Mietrecht Flask Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/mietrecht-app
ExecStart=/usr/bin/docker-compose -f docker-compose.mietrecht_full.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.mietrecht_full.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Aktivieren:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mietrecht.service
```

## Troubleshooting
- Bei Berechtigungsproblemen: `sudo usermod -aG docker $USER`
- Bei Port-Konflikten: `sudo netstat -tulpn | grep 5000`
- Logs prüfen: `docker-compose logs mietrecht-flask`