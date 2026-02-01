#!/bin/bash
# Mietrecht Ubuntu Server Setup Script

echo "=== Mietrecht Ubuntu Server Installation ==="
echo

# Update System
echo "1. System aktualisieren..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "2. Docker installieren..."
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Python Dependencies
echo "3. Python Umgebung einrichten..."
sudo apt install python3 python3-pip python3-venv -y

# Create Project Directory
echo "4. Projektverzeichnis erstellen..."
mkdir -p ~/mietrecht-app
cd ~/mietrecht-app

# Download Required Files (Placeholder - would need actual file transfer)
echo "5. Anwendungsdateien kopieren..."
# Hier würden die Dateien kopiert werden:
# - mietrecht_full.py
# - Dockerfile.flask  
# - docker-compose.mietrecht_full.yml
# - .env.build
# - Start_Real_Mietrecht.bat (angepasst für Linux)

echo "6. Docker Compose starten..."
# docker-compose -f docker-compose.mietrecht_full.yml up -d

echo
echo "=== Installation abgeschlossen ==="
echo "Nächste Schritte:"
echo "1. Dateien in ~/mietrecht-app kopieren"
echo "2. docker-compose.yml anpassen"
echo "3. ./start_mietrecht.sh ausführen"
echo