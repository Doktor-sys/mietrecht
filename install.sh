#!/bin/bash

# JurisMind Mietrecht - Auto Installer
# Führt das Setup auf dem Ubuntu Server aus

# Farben
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== JurisMind Mietrecht Installer ===${NC}"
echo "Dieses Skript richtet die Anwendung auf Ihrem Server ein."
echo ""

# 1. Prüfen ob Docker installiert ist
if ! command -v docker &> /dev/null; then
    echo "Docker wird installiert..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker ist bereits installiert."
fi

# 2. Konfiguration abfragen (optional nicht-interaktiv via ENV/Args)
DOMAIN="${DOMAIN:-$1}"
EMAIL="${EMAIL:-$2}"
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo ""
    read -p "Bitte geben Sie Ihre Domain ein (z.B. jurismind.de): " DOMAIN
    read -p "Bitte geben Sie Ihre E-Mail für SSL ein: " EMAIL
fi

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Fehler: Domain und E-Mail sind erforderlich."
    exit 1
fi

# 3. docker-compose.prod.yml anpassen
echo ""
echo "Konfiguriere Caddy..."
# Backup erstellen
cp docker-compose.prod.yml docker-compose.prod.yml.bak

# Ersetzungen vornehmen
sed -i "s|https://IHRE_DOMAIN|https://$DOMAIN|g" docker-compose.prod.yml
sed -i "s|ihre-email@beispiel.de|$EMAIL|g" docker-compose.prod.yml

# 4. .env prüfen
if grep -q "your-google-api-key" .env; then
    echo ""
    echo "ACHTUNG: Die .env Datei enthält noch Platzhalter-API-Keys."
    echo "Bitte tragen Sie diese nach der Installation manuell ein:"
    echo "nano .env"
    echo ""
    if [ -z "$NON_INTERACTIVE" ]; then
        read -p "Drücken Sie Enter, um fortzufahren (oder STRG+C zum Abbrechen)..."
    fi
fi

# 5. Starten
echo ""
echo "Starte Anwendung..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo -e "${GREEN}=== Installation abgeschlossen! ===${NC}"
echo "Ihre App sollte in wenigen Minuten unter https://$DOMAIN erreichbar sein."
echo "Prüfen Sie den Status mit: docker compose -f docker-compose.prod.yml logs -f"
