# Backend Scripts

Dieses Verzeichnis enthält Hilfsskripte für die Backend-Verwaltung.

## KMS (Key Management System) Scripts

### 1. generate-kms-keys.js

Generiert kryptographisch sichere Keys für das Key Management System.

**Verwendung:**
```bash
node scripts/generate-kms-keys.js
```

**Ausgabe:**
- Master Encryption Key (256 bits / 64 hex Zeichen)
- HMAC Key für Audit-Logs (256 bits / 64 hex Zeichen)
- .env Konfigurationsvorlage
- Sicherheitshinweise

**Wann verwenden:**
- Bei der ersten Einrichtung des Backends
- Beim Erstellen einer neuen Umgebung (Staging, Production)
- Bei geplanter Key-Rotation

**Wichtig:**
- ❌ Committe die generierten Keys NIEMALS in Git
- 💾 Speichere die Keys sicher (Passwort-Manager, Vault, HSM)
- 🔄 Verwende unterschiedliche Keys für jede Umgebung

### 2. validate-kms-config.js

Validiert die KMS-Konfiguration und prüft alle Umgebungsvariablen.

**Verwendung:**
```bash
node scripts/validate-kms-config.js
```

**Prüfungen:**
- ✅ Master Key Format (muss 64 hexadezimale Zeichen sein)
- ✅ HMAC Key Format (muss 64 hexadezimale Zeichen sein)
- ✅ Cache-Konfiguration (TTL, Max Keys)
- ✅ Rotation-Konfiguration (Intervalle)
- ✅ Audit-Retention (DSGVO-Compliance)
- ⚠️  Warnungen bei suboptimalen Einstellungen

**Exit Codes:**
- `0`: Konfiguration ist gültig
- `1`: Konfiguration ist ungültig (fehlende oder ungültige Keys)

**Wann verwenden:**
- Nach dem Einrichten der .env Datei
- Vor dem Deployment in eine neue Umgebung
- Als Teil der CI/CD Pipeline
- Bei Debugging von KMS-Problemen

**CI/CD Integration:**
```yaml
# .github/workflows/ci.yml
- name: Validate KMS Configuration
  run: node scripts/validate-kms-config.js
  env:
    MASTER_ENCRYPTION_KEY: ${{ secrets.MASTER_ENCRYPTION_KEY }}
    KMS_AUDIT_HMAC_KEY: ${{ secrets.KMS_AUDIT_HMAC_KEY }}
```

## Workflow: Erste Einrichtung

1. **Keys generieren:**
   ```bash
   node scripts/generate-kms-keys.js
   ```

2. **Keys in .env eintragen:**
   ```bash
   # Kopiere die Ausgabe in deine .env Datei
   cp .env.example .env
   # Füge die generierten Keys hinzu
   ```

3. **Konfiguration validieren:**
   ```bash
   node scripts/validate-kms-config.js
   ```

4. **Backend starten:**
   ```bash
   npm run dev
   ```

## Workflow: Neue Umgebung (Staging/Production)

1. **Neue Keys generieren:**
   ```bash
   node scripts/generate-kms-keys.js
   ```

2. **Keys sicher speichern:**
   - Passwort-Manager (1Password, LastPass, Bitwarden)
   - HashiCorp Vault
   - Cloud Key Management (AWS KMS, Azure Key Vault)
   - Hardware Security Module (HSM)

3. **Keys in Umgebung setzen:**
   ```bash
   # Kubernetes Secret
   kubectl create secret generic kms-keys \
     --from-literal=MASTER_ENCRYPTION_KEY=<key> \
     --from-literal=KMS_AUDIT_HMAC_KEY=<key>

   # Oder über Cloud Provider Secret Manager
   ```

4. **Validierung in CI/CD:**
   ```bash
   node scripts/validate-kms-config.js
   ```

## Sicherheitshinweise

### ❌ NICHT TUN:
- Keys in Git committen
- Keys in Logs ausgeben
- Keys per E-Mail versenden
- Denselben Key für mehrere Umgebungen verwenden
- Schwache Keys verwenden (z.B. "password123")

### ✅ TUN:
- Kryptographisch sichere Keys generieren
- Keys in Passwort-Manager/Vault speichern
- Verschlüsselte Offline-Backups erstellen
- Zugriff auf autorisierte Personen beschränken
- Regelmäßige Key-Rotationen planen
- Incident-Response-Plan für kompromittierte Keys haben

## Weitere Informationen

Siehe auch:
- [KMS Configuration Guide](../docs/TASK_11.1.11_KMS_CONFIGURATION.md)
- [KMS Setup Guide](../docs/kms-setup-guide.md)
- [.env.example](../.env.example)
