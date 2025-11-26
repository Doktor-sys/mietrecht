# Task 11.1.12: TLS 1.3 für API-Kommunikation

## Übersicht

Diese Implementierung fügt TLS 1.3-Unterstützung für sichere HTTPS-Kommunikation zum SmartLaw Backend hinzu. Die Lösung unterstützt sowohl Entwicklungs- als auch Produktionsumgebungen mit entsprechenden Zertifikaten.

## Implementierte Features

### 1. TLS 1.3 Server-Konfiguration

**Datei:** `src/config/tls.ts`

Die TLS-Konfiguration unterstützt:
- TLS 1.3 als Minimum-Version
- Sichere Cipher-Suites (AES-256-GCM, ChaCha20-Poly1305, AES-128-GCM)
- Automatisches Laden von Zertifikaten aus dem Dateisystem
- Flexible Konfiguration über Umgebungsvariablen

**Funktionen:**
- `loadTLSCertificates()`: Lädt Zertifikate aus dem konfigurierten Verzeichnis
- `createHTTPSOptions()`: Erstellt HTTPS-Server-Optionen mit TLS 1.3
- `getTLSConfig()`: Gibt die aktuelle TLS-Konfiguration zurück

### 2. HTTPS-Server-Integration

**Datei:** `src/index.ts`

Der Server wurde erweitert um:
- Automatische Erkennung von TLS-Aktivierung
- Erstellung eines HTTPS-Servers wenn TLS aktiviert ist
- Fallback auf HTTP-Server für Entwicklung
- Optionaler HTTP-Redirect-Server für Produktionsumgebungen

**Features:**
- Automatischer Wechsel zwischen HTTP und HTTPS basierend auf Konfiguration
- Separater HTTP-Server für Redirects (optional)
- Graceful Shutdown für beide Server
- Detailliertes Logging der TLS-Konfiguration

### 3. HTTPS-Redirect-Middleware

**Datei:** `src/middleware/httpsRedirect.ts`

Zwei Middleware-Funktionen für HTTPS-Enforcement:

**`httpsRedirect()`:**
- Leitet HTTP-Anfragen automatisch auf HTTPS um (301 Redirect)
- Erkennt HTTPS über verschiedene Header (x-forwarded-proto, etc.)
- Wird nur aktiviert wenn TLS enabled ist

**`requireHTTPS()`:**
- Blockiert HTTP-Anfragen mit 426 Upgrade Required
- Für strikte HTTPS-Enforcement in Produktion
- Gibt Upgrade-URL in der Fehlerantwort zurück

### 4. Zertifikatsgenerierung

#### Entwicklungszertifikate

**Script:** `scripts/generate-dev-certs.js`

Generiert selbstsignierte Zertifikate für die lokale Entwicklung:
- Certificate Authority (CA)
- Server-Zertifikat mit Subject Alternative Names
- Unterstützt localhost, 127.0.0.1 und ::1
- Automatische Berechtigungsverwaltung
- Detaillierte Anweisungen nach der Generierung

**Verwendung:**
```bash
node scripts/generate-dev-certs.js
```

**Generierte Dateien:**
- `certs/ca-key.pem` - CA Private Key
- `certs/ca-cert.pem` - CA Certificate
- `certs/server-key.pem` - Server Private Key
- `certs/server-cert.pem` - Server Certificate

#### Produktionszertifikate

**Script:** `scripts/setup-production-certs.sh`

Automatisiert die Einrichtung von Let's Encrypt Zertifikaten:
- Verwendet certbot für automatische Zertifikatsgenerierung
- Kopiert Zertifikate in das App-Verzeichnis
- Erstellt Symlinks für automatische Erneuerung
- Konfiguriert Renewal Hooks
- Testet automatische Erneuerung

**Verwendung:**
```bash
sudo ./scripts/setup-production-certs.sh api.smartlaw.de admin@smartlaw.de
```

## Konfiguration

### Umgebungsvariablen

Neue Variablen in `.env`:

```bash
# TLS aktivieren (empfohlen für Produktion)
TLS_ENABLED=true

# Zertifikatsverzeichnis
TLS_CERT_DIR=./certs

# Optional: Spezifische Zertifikatspfade
TLS_KEY_PATH=./certs/server-key.pem
TLS_CERT_PATH=./certs/server-cert.pem
TLS_CA_PATH=./certs/ca-cert.pem

# Optional: HTTP Redirect Port
HTTP_REDIRECT_PORT=3000
```

### Entwicklungsumgebung

1. **Zertifikate generieren:**
   ```bash
   cd services/backend
   node scripts/generate-dev-certs.js
   ```

2. **TLS aktivieren:**
   ```bash
   # In .env
   TLS_ENABLED=true
   TLS_CERT_DIR=./certs
   ```

3. **Server starten:**
   ```bash
   npm run dev
   ```

4. **Browser-Warnung akzeptieren:**
   - Chrome: "Erweitert" → "Weiter zu localhost (unsicher)"
   - Firefox: "Erweitert" → "Risiko akzeptieren und fortfahren"

5. **Optional: CA-Zertifikat installieren:**
   - **macOS:** `certs/ca-cert.pem` mit Keychain Access öffnen und vertrauen
   - **Windows:** `certs/ca-cert.pem` in "Vertrauenswürdige Stammzertifizierungsstellen" importieren
   - **Linux:** `sudo cp certs/ca-cert.pem /usr/local/share/ca-certificates/ && sudo update-ca-certificates`

### Produktionsumgebung

1. **Let's Encrypt Zertifikate einrichten:**
   ```bash
   sudo ./scripts/setup-production-certs.sh api.smartlaw.de admin@smartlaw.de
   ```

2. **Umgebungsvariablen setzen:**
   ```bash
   TLS_ENABLED=true
   TLS_CERT_DIR=/path/to/certs
   HTTP_REDIRECT_PORT=80  # Optional für HTTP->HTTPS Redirect
   ```

3. **Firewall konfigurieren:**
   ```bash
   # Port 443 für HTTPS öffnen
   sudo ufw allow 443/tcp
   
   # Optional: Port 80 für HTTP Redirect
   sudo ufw allow 80/tcp
   ```

4. **Server starten:**
   ```bash
   npm run start
   ```

## Sicherheitsfeatures

### TLS 1.3 Konfiguration

- **Minimum Version:** TLSv1.3
- **Cipher Suites:**
  - TLS_AES_256_GCM_SHA384 (bevorzugt)
  - TLS_CHACHA20_POLY1305_SHA256
  - TLS_AES_128_GCM_SHA256
- **Server Cipher Order:** Aktiviert
- **Renegotiation:** Deaktiviert

### HSTS (HTTP Strict Transport Security)

Automatisch aktiviert über Helmet.js:
- Max-Age: 31536000 (1 Jahr)
- Include Subdomains: true
- Preload: true

### Zertifikatsberechtigungen

- Private Keys: `600` (nur Owner lesbar)
- Certificates: `644` (alle lesbar)

## Testing

### Manuelle Tests

1. **HTTPS-Verbindung testen:**
   ```bash
   curl -k https://localhost:3001/health
   ```

2. **TLS-Version prüfen:**
   ```bash
   openssl s_client -connect localhost:3001 -tls1_3
   ```

3. **Zertifikat-Details anzeigen:**
   ```bash
   openssl s_client -connect localhost:3001 -showcerts
   ```

4. **HTTP-Redirect testen:**
   ```bash
   curl -I http://localhost:3000/health
   # Sollte 301 Redirect zu HTTPS zurückgeben
   ```

### Automatisierte Tests

Erstelle einen Test in `src/tests/tls.test.ts`:

```typescript
import https from 'https';
import { getTLSConfig } from '../config/tls';

describe('TLS Configuration', () => {
  test('should use TLS 1.3 as minimum version', () => {
    const config = getTLSConfig();
    expect(config.minVersion).toBe('TLSv1.3');
  });

  test('should use secure cipher suites', () => {
    const config = getTLSConfig();
    expect(config.ciphers).toContain('TLS_AES_256_GCM_SHA384');
  });

  test('should redirect HTTP to HTTPS when enabled', async () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Problem: "TLS certificates not found"

**Lösung:**
```bash
# Generiere Entwicklungszertifikate
node scripts/generate-dev-certs.js

# Oder deaktiviere TLS
TLS_ENABLED=false
```

### Problem: Browser zeigt "NET::ERR_CERT_AUTHORITY_INVALID"

**Lösung:**
- Für Entwicklung: Warnung akzeptieren oder CA-Zertifikat installieren
- Für Produktion: Verwende Let's Encrypt Zertifikate

### Problem: "EACCES: permission denied" beim Starten

**Lösung:**
```bash
# Ports < 1024 erfordern root-Rechte
# Verwende Port > 1024 oder setcap
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

### Problem: Automatische Erneuerung funktioniert nicht

**Lösung:**
```bash
# Teste Erneuerung manuell
sudo certbot renew --dry-run

# Prüfe Renewal Hook
sudo cat /etc/letsencrypt/renewal-hooks/deploy/smartlaw-reload.sh

# Prüfe Cron-Job
sudo systemctl status certbot.timer
```

## Performance-Überlegungen

### TLS 1.3 Vorteile

- **Schnellerer Handshake:** 1-RTT statt 2-RTT
- **0-RTT Resumption:** Noch schnellere Wiederverbindungen
- **Bessere Cipher Suites:** Moderne, effiziente Algorithmen

### Caching

- Zertifikate werden beim Start geladen
- Keine Disk-I/O bei jeder Verbindung
- Session Resumption für schnellere Reconnects

## Best Practices

### Entwicklung

1. Verwende selbstsignierte Zertifikate
2. Installiere CA-Zertifikat für bessere Developer Experience
3. Teste sowohl HTTP als auch HTTPS
4. Verwende `TLS_ENABLED=false` für schnellere Iteration

### Produktion

1. Verwende Let's Encrypt oder kommerzielle Zertifikate
2. Aktiviere HTTP->HTTPS Redirect
3. Konfiguriere HSTS Header
4. Überwache Zertifikatsablauf
5. Teste automatische Erneuerung
6. Verwende Reverse Proxy (nginx/Apache) für zusätzliche Features

### Monitoring

1. **Zertifikatsablauf überwachen:**
   ```bash
   openssl x509 -in certs/server-cert.pem -noout -enddate
   ```

2. **TLS-Verbindungen loggen:**
   - Aktiviere Debug-Logging in Produktion
   - Überwache Failed Handshakes
   - Tracke Cipher Suite Usage

3. **Alerts einrichten:**
   - Zertifikat läuft in 30 Tagen ab
   - TLS Handshake Failures
   - Unsichere Cipher Suite Requests

## Nächste Schritte

Nach der Implementierung von TLS 1.3:

1. **Task 11.1.13:** Monitoring und Health Checks für KMS
2. **Task 11.1.14:** Security und Integration Tests
3. **Task 11.3:** Audit Logging und Monitoring

## Referenzen

- [TLS 1.3 RFC 8446](https://tools.ietf.org/html/rfc8446)
- [Node.js TLS Documentation](https://nodejs.org/api/tls.html)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)

## Zusammenfassung

Die TLS 1.3-Implementierung bietet:
- ✅ Sichere HTTPS-Kommunikation mit modernen Standards
- ✅ Flexible Konfiguration für Entwicklung und Produktion
- ✅ Automatische Zertifikatsverwaltung
- ✅ HTTP->HTTPS Redirect-Unterstützung
- ✅ Umfassende Dokumentation und Scripts
- ✅ Best Practices für Sicherheit und Performance

Die Implementierung erfüllt Anforderung 7.1 (Datenschutz und Sicherheit) durch Ende-zu-Ende-Verschlüsselung aller API-Kommunikation.
