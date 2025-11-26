# HTTPS/TLS Setup Guide

Schnellanleitung zum Einrichten von HTTPS für das SmartLaw Backend.

## Entwicklung (Lokaler Server)

### 1. Zertifikate generieren

```bash
cd services/backend
npm run certs:generate
```

Dies erstellt selbstsignierte Zertifikate im `certs/` Verzeichnis.

### 2. TLS aktivieren

Füge zu deiner `.env` Datei hinzu:

```bash
TLS_ENABLED=true
TLS_CERT_DIR=./certs
```

### 3. Server starten

```bash
npm run dev
```

Der Server läuft jetzt auf `https://localhost:3001`

### 4. Browser-Warnung akzeptieren

Da die Zertifikate selbstsigniert sind, zeigt dein Browser eine Warnung:
- **Chrome:** "Erweitert" → "Weiter zu localhost (unsicher)"
- **Firefox:** "Erweitert" → "Risiko akzeptieren und fortfahren"

### 5. Optional: CA-Zertifikat installieren

Um die Browser-Warnung zu vermeiden, installiere das CA-Zertifikat:

**macOS:**
```bash
open certs/ca-cert.pem
# In Keychain Access: Doppelklick → Trust → "Always Trust"
```

**Windows:**
```bash
# Öffne certs/ca-cert.pem
# Zertifikat installieren → Lokaler Computer
# → Vertrauenswürdige Stammzertifizierungsstellen
```

**Linux:**
```bash
sudo cp certs/ca-cert.pem /usr/local/share/ca-certificates/smartlaw-dev-ca.crt
sudo update-ca-certificates
```

## Produktion (Server mit Domain)

### Voraussetzungen

- Domain zeigt auf deinen Server
- Port 80 und 443 sind offen
- certbot ist installiert

### 1. Let's Encrypt Zertifikate einrichten

```bash
cd services/backend
sudo ./scripts/setup-production-certs.sh api.smartlaw.de admin@smartlaw.de
```

### 2. Umgebungsvariablen setzen

```bash
TLS_ENABLED=true
TLS_CERT_DIR=/path/to/certs
HTTP_REDIRECT_PORT=80  # Optional: HTTP→HTTPS Redirect
```

### 3. Firewall konfigurieren

```bash
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 80/tcp   # HTTP (für Redirect)
```

### 4. Server starten

```bash
npm run build
npm start
```

### 5. Automatische Erneuerung

Let's Encrypt Zertifikate werden automatisch alle 60 Tage erneuert.
Der Renewal Hook startet den Server automatisch neu.

## Testen

### TLS-Version prüfen

```bash
openssl s_client -connect localhost:3001 -tls1_3
```

### Zertifikat-Details anzeigen

```bash
npm run certs:info
```

### HTTP-Redirect testen

```bash
curl -I http://localhost:3000/health
# Sollte 301 Redirect zu HTTPS zurückgeben
```

## Troubleshooting

### "Certificate has expired"

```bash
# Entwicklung: Neue Zertifikate generieren
npm run certs:generate

# Produktion: Manuell erneuern
sudo certbot renew
```

### "EACCES: permission denied"

```bash
# Ports < 1024 erfordern root oder setcap
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

### "Unable to verify certificate"

```bash
# Zertifikat prüfen
openssl verify -CAfile certs/ca-cert.pem certs/server-cert.pem
```

## Weitere Informationen

Siehe [docs/TASK_11.1.12_TLS_IMPLEMENTATION.md](docs/TASK_11.1.12_TLS_IMPLEMENTATION.md) für:
- Detaillierte Konfigurationsoptionen
- Sicherheits-Best-Practices
- Performance-Optimierungen
- Monitoring und Alerts
