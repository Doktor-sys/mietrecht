#!/bin/bash
# Upload-Skript für JurisMind auf Ubuntu Server - KONFIGURIERT
#
# ANPASSUNGEN:
# 1. SERVER_IP unten mit Ihrer Server-IP ersetzen
# 2. SERVER_USER ggf. anpassen (Standard: root)
# 3. SSH-Key oder Passwort-Authentifizierung einrichten

SERVER_IP="35.195.246.45"          # <-- IHRE SERVER-IP HIER EINFÜGEN
SERVER_USER="ubuntu"               # oder "root" je nach Setup
DEPLOY_DIR="/opt/jurismind"

echo "=== JurisMind Deployment Upload ==="
echo "Server: $SERVER_USER@$SERVER_IP"
echo "Zielverzeichnis: $DEPLOY_DIR"
echo

# Deployment-Paket erstellen (falls noch nicht geschehen)
if [ ! -f "deployment.zip" ]; then
    echo "Erstelle deployment.zip..."
    powershell -ExecutionPolicy Bypass -File "pack_for_server.ps1"
fi

# Upload durchführen
echo "Lade deployment.zip auf Server hoch..."
scp deployment.zip $SERVER_USER@$SERVER_IP:/tmp/

# Auf Server entpacken und verschieben
echo "Entpacke auf Server..."
ssh $SERVER_USER@$SERVER_IP "
    mkdir -p $DEPLOY_DIR
    unzip -o /tmp/deployment.zip -d $DEPLOY_DIR
    rm /tmp/deployment.zip
    chown -R $SERVER_USER:$SERVER_USER $DEPLOY_DIR
    chmod +x $DEPLOY_DIR/mietrecht_full.py
    ls -la $DEPLOY_DIR
"

echo "Upload abgeschlossen!"
echo "Nächste Schritte auf dem Server:"
echo "1. cd $DEPLOY_DIR"
echo "2. nano .env # API-Keys konfigurieren"
echo "3. docker compose up -d --build"