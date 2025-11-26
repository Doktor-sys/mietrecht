#!/bin/bash

###############################################################################
# Script zum Einrichten von Produktionszertifikaten mit Let's Encrypt
#
# Verwendung:
#   ./scripts/setup-production-certs.sh <domain> <email>
#
# Beispiel:
#   ./scripts/setup-production-certs.sh api.smartlaw.de admin@smartlaw.de
#
# Voraussetzungen:
#   - certbot installiert
#   - Port 80 und 443 verfügbar
#   - Domain zeigt auf diesen Server
###############################################################################

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
log_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

log_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

log_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Parameter prüfen
if [ $# -lt 2 ]; then
    log_error "Fehlende Parameter"
    echo "Verwendung: $0 <domain> <email>"
    echo "Beispiel: $0 api.smartlaw.de admin@smartlaw.de"
    exit 1
fi

DOMAIN=$1
EMAIL=$2
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
APP_CERT_DIR="$(pwd)/certs"

log_info "SmartLaw - Produktionszertifikate Setup"
echo "========================================"
echo "Domain: ${DOMAIN}"
echo "Email: ${EMAIL}"
echo ""

# Prüfe ob certbot installiert ist
if ! command -v certbot &> /dev/null; then
    log_error "certbot ist nicht installiert"
    log_info "Installation:"
    echo "  Ubuntu/Debian: sudo apt-get install certbot"
    echo "  CentOS/RHEL: sudo yum install certbot"
    echo "  macOS: brew install certbot"
    exit 1
fi

log_success "certbot gefunden"

# Prüfe ob Script als root läuft
if [ "$EUID" -ne 0 ]; then
    log_warning "Dieses Script sollte als root ausgeführt werden"
    log_info "Verwende: sudo $0 $@"
    exit 1
fi

# Erstelle App-Zertifikatsverzeichnis
mkdir -p "${APP_CERT_DIR}"
log_success "Zertifikatsverzeichnis erstellt: ${APP_CERT_DIR}"

# Prüfe ob Zertifikat bereits existiert
if [ -d "${CERT_DIR}" ]; then
    log_warning "Zertifikat für ${DOMAIN} existiert bereits"
    read -p "Möchten Sie es erneuern? (j/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Jj]$ ]]; then
        log_info "Abgebrochen"
        exit 0
    fi
    CERTBOT_CMD="renew"
else
    CERTBOT_CMD="certonly"
fi

# Generiere Zertifikat mit Let's Encrypt
log_info "Generiere Zertifikat mit Let's Encrypt..."
log_warning "Stelle sicher, dass Port 80 verfügbar ist!"

certbot ${CERTBOT_CMD} \
    --standalone \
    --preferred-challenges http \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    -d "${DOMAIN}"

if [ $? -ne 0 ]; then
    log_error "Zertifikatsgenerierung fehlgeschlagen"
    exit 1
fi

log_success "Zertifikat erfolgreich generiert"

# Kopiere Zertifikate in App-Verzeichnis
log_info "Kopiere Zertifikate in App-Verzeichnis..."

cp "${CERT_DIR}/privkey.pem" "${APP_CERT_DIR}/server-key.pem"
cp "${CERT_DIR}/fullchain.pem" "${APP_CERT_DIR}/server-cert.pem"
cp "${CERT_DIR}/chain.pem" "${APP_CERT_DIR}/ca-cert.pem"

# Setze Berechtigungen
chmod 600 "${APP_CERT_DIR}/server-key.pem"
chmod 644 "${APP_CERT_DIR}/server-cert.pem"
chmod 644 "${APP_CERT_DIR}/ca-cert.pem"

log_success "Zertifikate kopiert und Berechtigungen gesetzt"

# Erstelle Symlinks für automatische Erneuerung
log_info "Erstelle Symlinks für automatische Erneuerung..."

ln -sf "${CERT_DIR}/privkey.pem" "${APP_CERT_DIR}/server-key-live.pem"
ln -sf "${CERT_DIR}/fullchain.pem" "${APP_CERT_DIR}/server-cert-live.pem"
ln -sf "${CERT_DIR}/chain.pem" "${APP_CERT_DIR}/ca-cert-live.pem"

log_success "Symlinks erstellt"

# Erstelle Renewal Hook
HOOK_DIR="/etc/letsencrypt/renewal-hooks/deploy"
HOOK_FILE="${HOOK_DIR}/smartlaw-reload.sh"

mkdir -p "${HOOK_DIR}"

cat > "${HOOK_FILE}" << 'EOF'
#!/bin/bash
# SmartLaw - Zertifikatserneuerungs-Hook
# Wird automatisch nach erfolgreicher Zertifikatserneuerung ausgeführt

DOMAIN="$RENEWED_DOMAINS"
APP_CERT_DIR="/path/to/smartlaw/backend/certs"

# Kopiere neue Zertifikate
cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "${APP_CERT_DIR}/server-key.pem"
cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "${APP_CERT_DIR}/server-cert.pem"
cp "/etc/letsencrypt/live/${DOMAIN}/chain.pem" "${APP_CERT_DIR}/ca-cert.pem"

# Setze Berechtigungen
chmod 600 "${APP_CERT_DIR}/server-key.pem"
chmod 644 "${APP_CERT_DIR}/server-cert.pem"
chmod 644 "${APP_CERT_DIR}/ca-cert.pem"

# Starte SmartLaw Backend neu (anpassen je nach Deployment)
# systemctl restart smartlaw-backend
# oder
# pm2 restart smartlaw-backend

echo "SmartLaw Zertifikate aktualisiert: $(date)"
EOF

# Passe Pfad im Hook an
sed -i "s|/path/to/smartlaw/backend/certs|${APP_CERT_DIR}|g" "${HOOK_FILE}"

chmod +x "${HOOK_FILE}"

log_success "Renewal Hook erstellt: ${HOOK_FILE}"

# Teste automatische Erneuerung
log_info "Teste automatische Erneuerung..."
certbot renew --dry-run

if [ $? -eq 0 ]; then
    log_success "Automatische Erneuerung funktioniert"
else
    log_warning "Automatische Erneuerung könnte Probleme haben"
fi

# Zeige Zertifikat-Informationen
log_info "Zertifikat-Informationen:"
openssl x509 -in "${APP_CERT_DIR}/server-cert.pem" -noout -subject -issuer -dates

# Abschlussinformationen
echo ""
echo "========================================"
log_success "Produktionszertifikate erfolgreich eingerichtet!"
echo "========================================"
echo ""
log_info "Nächste Schritte:"
echo "1. Aktualisiere deine .env Datei:"
echo "   TLS_ENABLED=true"
echo "   TLS_CERT_DIR=${APP_CERT_DIR}"
echo ""
echo "2. Starte den Server neu:"
echo "   npm run start"
echo ""
log_info "Automatische Erneuerung:"
echo "  - Zertifikate werden automatisch alle 60 Tage erneuert"
echo "  - Renewal Hook: ${HOOK_FILE}"
echo "  - Passe den Hook an dein Deployment an (systemctl/pm2)"
echo ""
log_warning "WICHTIG:"
echo "  - Stelle sicher, dass Port 443 in deiner Firewall geöffnet ist"
echo "  - Konfiguriere HTTP->HTTPS Redirect in deiner Reverse Proxy"
echo ""
