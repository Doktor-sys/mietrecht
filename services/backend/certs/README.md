# SSL/TLS Zertifikate

Dieses Verzeichnis enthält die SSL/TLS-Zertifikate für sichere HTTPS-Kommunikation.

## Entwicklung

### Zertifikate generieren

```bash
# Aus dem backend-Verzeichnis
npm run certs:generate

# Oder direkt
node scripts/generate-dev-certs.js
```

Dies generiert:
- `ca-key.pem` - Certificate Authority Private Key
- `ca-cert.pem` - Certificate Authority Certificate
- `server-key.pem` - Server Private Key
- `server-cert.pem` - Server Certificate

### Zertifikat-Informationen anzeigen

```bash
npm run certs:info
```

### Browser-Warnung umgehen

Die generierten Zertifikate sind selbstsigniert. Um Browser-Warnungen zu vermeiden:

**macOS:**
1. Öffne `ca-cert.pem` mit Keychain Access
2. Doppelklicke auf das Zertifikat
3. Erweitere "Trust"
4. Setze "When using this certificate" auf "Always Trust"

**Windows:**
1. Öffne `ca-cert.pem`
2. Klicke "Zertifikat installieren"
3. Wähle "Lokaler Computer"
4. Wähle "Vertrauenswürdige Stammzertifizierungsstellen"

**Linux:**
```bash
sudo cp ca-cert.pem /usr/local/share/ca-certificates/smartlaw-dev-ca.crt
sudo update-ca-certificates
```

## Produktion

Für Produktionsumgebungen verwende Let's Encrypt:

```bash
sudo ./scripts/setup-production-certs.sh api.smartlaw.de admin@smartlaw.de
```

## Sicherheit

⚠️ **WICHTIG:**
- Private Keys (`*-key.pem`) niemals committen!
- Dieses Verzeichnis ist in `.gitignore` eingetragen
- Produktionszertifikate separat und sicher speichern
- Regelmäßig Zertifikate erneuern (Let's Encrypt: alle 90 Tage)

## Dateiberechtigungen

- Private Keys: `600` (nur Owner lesbar)
- Certificates: `644` (alle lesbar)

## Gültigkeit

- Entwicklungszertifikate: 365 Tage
- Let's Encrypt: 90 Tage (automatische Erneuerung)

## Troubleshooting

### "Certificate has expired"
```bash
# Generiere neue Entwicklungszertifikate
npm run certs:generate
```

### "Unable to verify certificate"
```bash
# Prüfe Zertifikat
openssl verify -CAfile ca-cert.pem server-cert.pem
```

### "Permission denied"
```bash
# Setze korrekte Berechtigungen
chmod 600 *-key.pem
chmod 644 *-cert.pem
```
