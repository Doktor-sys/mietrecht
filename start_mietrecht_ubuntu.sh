#!/bin/bash
# Mietrecht Production Start Script for Ubuntu

echo "=== Mietrecht App Starter ==="
echo

# Check if Docker is running
if ! systemctl is-active --quiet docker; then
    echo "[ERROR] Docker läuft nicht. Starte Docker..."
    sudo systemctl start docker
fi

# Check if required files exist
if [ ! -f "mietrecht_full.py" ]; then
    echo "[ERROR] mietrecht_full.py nicht gefunden!"
    exit 1
fi

if [ ! -f "docker-compose.mietrecht_full.yml" ]; then
    echo "[ERROR] docker-compose.mietrecht_full.yml nicht gefunden!"
    exit 1
fi

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "[INFO] Erstelle .env Datei..."
    cat > .env << EOF
FLASK_APP=mietrecht_full.py
FLASK_ENV=production
SECRET_KEY=$(openssl rand -hex 32)
GOOGLE_API_KEY=your-google-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
PYTHONUNBUFFERED=1
EOF
fi

echo "[INFO] Starte Mietrecht Services..."
docker-compose -f docker-compose.mietrecht_full.yml up -d

echo
echo "[INFO] Warte auf Start der Services..."
sleep 15

echo
echo "=== Mietrecht App ist gestartet ==="
echo "URL: http://$(hostname -I | awk '{print $1}'):5000"
echo "Status prüfen: docker-compose -f docker-compose.mietrecht_full.yml ps"
echo "Logs anzeigen: docker-compose -f docker-compose.mietrecht_full.yml logs -f"
echo