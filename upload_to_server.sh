#!/bin/bash
# Upload-Skript für JurisMind auf Ubuntu Server

SERVER_IP="ihre-server-ip-hier-einfügen"
SERVER_USER="root"
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
    chown -R root:root $DEPLOY_DIR
    chmod +x $DEPLOY_DIR/mietrecht_full.py
    ls -la $DEPLOY_DIR
"

echo "Upload abgeschlossen!"
echo "Nächste Schritte auf dem Server:"
echo "1. cd $DEPLOY_DIR"
echo "2. Bearbeiten Sie die .env Datei mit Ihren Einstellungen"
echo "3. docker compose -f docker-compose.prod.yml up -d --build"