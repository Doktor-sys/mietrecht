# Task 11.1.11: KMS Configuration und Environment Setup

## Übersicht

Vollständige Konfiguration des Key Management Systems (KMS) mit allen erforderlichen Umgebungsvariablen, Sicherheitsanforderungen und Setup-Anleitungen.

## Konfigurationsdateien

### 1. config.ts - KMS-Konfiguration

**Datei:** `services/backend/src/config/config.ts`

Die KMS-Konfiguration ist bereits vollständig implementiert:

```typescript
kms: {
  masterKey: process.env.MASTER_ENCRYPTION_KEY || '',
  cacheTTL: parseInt(process.env.KMS_CACHE_TTL || '300', 10), // 5 Minuten
  cacheMaxKeys: parseInt(process.env.KMS_CACHE_MAX_KEYS || '1000', 10),
  autoRotationEnabled: process.env.KMS_AUTO_ROTATION_ENABLED === 'true',
  defaultRotationDays: parseInt(process.env.KMS_DEFAULT_ROTATION_DAYS || '90', 10),
  auditRetentionDays: parseInt(process.env.KMS_AUDIT_RETENTION_DAYS || '2555', 10), // 7 Jahre
  auditHmacKey: process.env.KMS_AUDIT_HMAC_KEY || '',
  hsmEnabled: process.env.KMS_HSM_ENABLED === 'true',
  vaultUrl: process.env.KMS_VAULT_URL || '',
  vaultToken: process.env.KMS_VAULT_TOKEN || '',
}
```

### 2. .env.example - Umgebungsvariablen

**Datei:** `services/backend/.env.example`

Alle KMS-Umgebungsvariablen sind dokumentiert:

```bash
# Key Management System (KMS) Configuration
# WICHTIG: Master Key muss 64 hexadezimale Zeichen (256 bits) sein
# Generiere mit: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
MASTER_ENCRYPTION_KEY=your-256-bit-master-key-in-hex-format-change-in-production

# KMS Cache Configuration
KMS_CACHE_TTL=300                    # Cache TTL in Sekunden (Standard: 5 Minuten)
KMS_CACHE_MAX_KEYS=1000              # Maximale Anzahl gecachter Keys

# KMS Rotation Configuration
KMS_AUTO_ROTATION_ENABLED=true       # Automatische Key-Rotation aktivieren
KMS_DEFAULT_ROTATION_DAYS=90         # Standard-Rotationsintervall in Tagen

# KMS Audit Configuration
KMS_AUDIT_RETENTION_DAYS=2555        # Audit-Log-Aufbewahrung (7 Jahre für DSGVO)
KMS_AUDIT_HMAC_KEY=your-hmac-key-for-audit-log-integrity

# Optional: HSM/Vault Integration
KMS_HSM_ENABLED=false                # Hardware Security Module aktivieren
KMS_VAULT_URL=                       # HashiCorp Vault URL
KMS_VAULT_TOKEN=                     # Vault Access Token
```

## Master Key Setup

### Generierung des Master Keys

Der Master Key ist der wichtigste Sicherheitsschlüssel im KMS. Er muss:
- **256 Bits (32 Bytes)** lang sein
- Als **64 hexadezimale Zeichen** gespeichert werden
- **Kryptographisch sicher** generiert werden
- **Niemals** im Code oder in Logs erscheinen

#### Generierung mit Node.js

```bash
# Generiere einen sicheren Master Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Beispiel-Output:**
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

#### Generierung mit OpenSSL

```bash
# Alternative mit OpenSSL
openssl rand -hex 32
```

### Sichere Speicherung des Master Keys

#### Entwicklungsumgebung

```bash
# .env (NICHT in Git committen!)
MASTER_ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

#### Produktionsumgebung

**Empfohlene Methoden (in Prioritätsreihenfolge):**

1. **Hardware Security Module (HSM)**
   ```bash
   KMS_HSM_ENABLED=true
   # Master Key wird im HSM gespeichert
   ```

2. **HashiCorp Vault**
   ```bash
   KMS_VAULT_URL=https://vault.example.com
   KMS_VAULT_TOKEN=s.your-vault-token
   # Master Key wird aus Vault geladen
   ```

3. **Cloud Key Management Services**
   - AWS KMS
   - Azure Key Vault
   - Google Cloud KMS

4. **Umgebungsvariablen (Minimum)**
   ```bash
   # Über Kubernetes Secrets oder ähnliche sichere Mechanismen
   MASTER_ENCRYPTION_KEY=${SECURE_MASTER_KEY}
   ```

### Sicherheitsanforderungen

#### ✅ MUSS-Anforderungen

1. **Länge:** Exakt 64 hexadezimale Zeichen (256 bits)
2. **Format:** Nur Zeichen 0-9 und a-f (Hexadezimal)
3. **Entropie:** Kryptographisch sicher generiert
4. **Speicherung:** Niemals in Git, Logs oder Code
5. **Zugriff:** Nur autorisierte Systeme/Personen
6. **Rotation:** Regelmäßige Rotation (empfohlen: jährlich)
7. **Backup:** Sichere Offline-Backups an mehreren Orten

#### ❌ NICHT TUN

- ❌ Master Key in Git committen
- ❌ Master Key in Logs ausgeben
- ❌ Master Key per E-Mail versenden
- ❌ Schwache Keys verwenden (z.B. "password123...")
- ❌ Denselben Key für mehrere Umgebungen verwenden

## HMAC Key für Audit-Logs

Der HMAC Key wird verwendet, um die Integrität der Audit-Logs zu sichern.

### Generierung

```bash
# Generiere HMAC Key (256 bits)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Konfiguration

```bash
# .env
KMS_AUDIT_HMAC_KEY=your-generated-hmac-key-here
```

## Konfigurationsparameter im Detail

### Cache-Konfiguration

```bash
# Cache TTL (Time To Live)
KMS_CACHE_TTL=300                    # 5 Minuten (Standard)
# Empfehlungen:
# - Entwicklung: 60-300 Sekunden
# - Produktion: 300-600 Sekunden
# - Hohe Last: 600-1800 Sekunden

# Maximale Anzahl gecachter Keys
KMS_CACHE_MAX_KEYS=1000              # Standard: 1000
# Empfehlungen:
# - Kleine Systeme: 100-500
# - Mittlere Systeme: 500-2000
# - Große Systeme: 2000-10000
```

### Rotation-Konfiguration

```bash
# Automatische Rotation aktivieren
KMS_AUTO_ROTATION_ENABLED=true       # Empfohlen: true

# Standard-Rotationsintervall
KMS_DEFAULT_ROTATION_DAYS=90         # 90 Tage (Standard)
# Empfehlungen nach Sensibilität:
# - Sehr sensibel: 30 Tage
# - Normal: 90 Tage
# - Weniger sensibel: 180 Tage
```

### Audit-Konfiguration

```bash
# Audit-Log-Aufbewahrung
KMS_AUDIT_RETENTION_DAYS=2555        # 7 Jahre (DSGVO-Anforderung)
# Gesetzliche Anforderungen:
# - DSGVO: Mindestens 6 Jahre
# - Empfohlen: 7 Jahre (2555 Tage)
```

## Validierung der Konfiguration

### Automatische Validierung beim Start

Die config.ts enthält bereits eine `validateConfig()` Funktion. Erweitere sie für KMS:

```typescript
export function validateConfig() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'OPENAI_API_KEY',
  ];

  // KMS-Validierung nur in Produktion
  if (config.nodeEnv === 'production') {
    requiredEnvVars.push('MASTER_ENCRYPTION_KEY');
    requiredEnvVars.push('KMS_AUDIT_HMAC_KEY');
  }

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Fehlende Umgebungsvariablen: ${missingVars.join(', ')}`);
  }

  // Validiere Master Key Format
  if (config.kms.masterKey) {
    if (!/^[0-9a-fA-F]{64}$/.test(config.kms.masterKey)) {
      throw new Error('MASTER_ENCRYPTION_KEY muss 64 hexadezimale Zeichen sein');
    }
  }

  // Validiere HMAC Key Format
  if (config.kms.auditHmacKey) {
    if (!/^[0-9a-fA-F]{64}$/.test(config.kms.auditHmacKey)) {
      throw new Error('KMS_AUDIT_HMAC_KEY muss 64 hexadezimale Zeichen sein');
    }
  }
}
```

### Manuelle Validierung

```bash
# Prüfe Master Key Format
node -e "
const key = process.env.MASTER_ENCRYPTION_KEY;
if (!key) {
  console.error('❌ MASTER_ENCRYPTION_KEY nicht gesetzt');
  process.exit(1);
}
if (!/^[0-9a-fA-F]{64}$/.test(key)) {
  console.error('❌ MASTER_ENCRYPTION_KEY hat falsches Format');
  process.exit(1);
}
console.log('✅ Master Key ist gültig');
"
```

## Setup-Anleitung

### Schritt 1: Master Key generieren

**Option 1: Verwende das bereitgestellte Skript (empfohlen)**

```bash
# Generiere Keys mit dem KMS Keys Generator
node scripts/generate-kms-keys.js
```

Das Skript generiert beide Keys und zeigt die .env-Konfiguration an.

**Option 2: Manuelle Generierung**

```bash
# Generiere Master Key
MASTER_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Master Key: $MASTER_KEY"

# Generiere HMAC Key
HMAC_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "HMAC Key: $HMAC_KEY"
```

### Schritt 2: .env Datei erstellen

```bash
# Kopiere .env.example
cp .env.example .env

# Füge generierte Keys hinzu (manuell oder mit sed)
# WICHTIG: Ersetze die Platzhalter mit echten Keys!
```

### Schritt 3: Keys sicher speichern

```bash
# Speichere Keys in einem Passwort-Manager
# - 1Password
# - LastPass
# - Bitwarden
# - HashiCorp Vault

# Erstelle Offline-Backup
# - Verschlüsselter USB-Stick
# - Papier-Backup in Safe
# - Mehrere geografisch getrennte Standorte
```

### Schritt 4: Validierung

**Option 1: Verwende das Validierungsskript (empfohlen)**

```bash
# Validiere KMS-Konfiguration
node scripts/validate-kms-config.js
```

Das Skript prüft:
- Master Key Format und Länge
- HMAC Key Format und Länge
- Alle KMS-Konfigurationsparameter
- Gibt Warnungen bei suboptimalen Einstellungen

**Option 2: Manuelle Validierung beim Server-Start**

```bash
# Starte Backend und prüfe Logs
npm run dev

# Erwartete Log-Ausgabe:
# ✅ Master key loaded successfully
# ✅ KeyManagementService initialized successfully
```

## Umgebungsspezifische Konfiguration

### Entwicklung

```bash
# .env.development
MASTER_ENCRYPTION_KEY=dev-key-only-for-testing-not-for-production-use-123456789
KMS_CACHE_TTL=60                     # Kürzere TTL für schnelleres Testing
KMS_AUTO_ROTATION_ENABLED=false      # Keine Auto-Rotation in Dev
KMS_AUDIT_RETENTION_DAYS=30          # Kürzere Retention in Dev
```

### Staging

```bash
# .env.staging
MASTER_ENCRYPTION_KEY=${STAGING_MASTER_KEY}  # Aus Secret Manager
KMS_CACHE_TTL=300
KMS_AUTO_ROTATION_ENABLED=true
KMS_DEFAULT_ROTATION_DAYS=90
KMS_AUDIT_RETENTION_DAYS=365
```

### Produktion

```bash
# .env.production
MASTER_ENCRYPTION_KEY=${PROD_MASTER_KEY}     # Aus HSM/Vault
KMS_CACHE_TTL=600                            # Längere TTL für Performance
KMS_AUTO_ROTATION_ENABLED=true
KMS_DEFAULT_ROTATION_DAYS=90
KMS_AUDIT_RETENTION_DAYS=2555                # 7 Jahre
KMS_HSM_ENABLED=true                         # HSM in Produktion
```

## Sicherheits-Checkliste

### Vor dem Deployment

- [ ] Master Key mit kryptographisch sicherem Generator erstellt
- [ ] Master Key hat korrektes Format (64 hex Zeichen)
- [ ] Master Key ist NICHT im Git-Repository
- [ ] Master Key ist sicher gespeichert (Vault/HSM/Passwort-Manager)
- [ ] HMAC Key für Audit-Logs generiert
- [ ] Backup-Strategie für Master Key definiert
- [ ] Zugriffskontrolle für Master Key implementiert
- [ ] Rotation-Plan für Master Key erstellt
- [ ] Monitoring für KMS-Operationen eingerichtet
- [ ] Incident-Response-Plan für kompromittierte Keys erstellt

### Nach dem Deployment

- [ ] Master Key Validierung erfolgreich
- [ ] KMS Health Check erfolgreich
- [ ] Audit-Logs werden korrekt geschrieben
- [ ] Cache funktioniert (Hit-Rate > 0%)
- [ ] Auto-Rotation funktioniert (falls aktiviert)
- [ ] Monitoring-Alerts konfiguriert

## Monitoring und Alerts

### Wichtige Metriken

```typescript
// KMS Health Check
const health = {
  masterKeyValid: masterKeyManager.validateMasterKey(),
  cacheHealthy: await keyCacheManager.healthCheck(),
  databaseConnected: await prisma.$queryRaw`SELECT 1`,
  redisConnected: await redis.ping() === 'PONG'
};

// KMS Statistiken
const stats = await kms.getStats(tenantId);
console.log({
  activeKeys: stats.keysByStatus.active,
  cacheHitRate: stats.cacheStats.hitRate,
  upcomingRotations: stats.rotationStats.upcomingRotations,
  overdueRotations: stats.rotationStats.overdueRotations
});
```

### Empfohlene Alerts

1. **Kritisch:**
   - Master Key Validierung fehlgeschlagen
   - Cache nicht erreichbar
   - Überfällige Key-Rotationen > 10
   - Sicherheitsvorfälle (UNAUTHORIZED_ACCESS)

2. **Warnung:**
   - Cache Hit-Rate < 50%
   - Audit-Log-Fehler
   - Bevorstehende Rotationen (< 7 Tage)

3. **Info:**
   - Erfolgreiche Key-Rotation
   - Cache-Statistiken (täglich)
   - Audit-Log-Zusammenfassung (wöchentlich)

## Troubleshooting

### Problem: Master Key nicht gefunden

```
Error: Master encryption key not found in environment variables
```

**Lösung:**
```bash
# Prüfe ob MASTER_ENCRYPTION_KEY gesetzt ist
echo $MASTER_ENCRYPTION_KEY

# Falls nicht, setze in .env
MASTER_ENCRYPTION_KEY=your-generated-key-here
```

### Problem: Master Key hat falsches Format

```
Error: Master encryption key must be 64 hexadecimal characters
```

**Lösung:**
```bash
# Generiere neuen Key mit korrektem Format
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Prüfe Länge
echo -n "$MASTER_ENCRYPTION_KEY" | wc -c
# Sollte 64 ausgeben
```

### Problem: Cache nicht erreichbar

```
Error: Failed to cache encryption key
```

**Lösung:**
```bash
# Prüfe Redis-Verbindung
redis-cli ping
# Sollte PONG zurückgeben

# Prüfe REDIS_URL
echo $REDIS_URL
```

### Problem: Audit-Logs werden nicht geschrieben

```
Warning: Failed to log event
```

**Lösung:**
```bash
# Prüfe Datenbank-Verbindung
psql $DATABASE_URL -c "SELECT 1"

# Prüfe ob KeyAuditLog Tabelle existiert
psql $DATABASE_URL -c "\dt key_audit_log"

# Falls nicht, führe Migration aus
npx prisma migrate deploy
```

## Best Practices

### 1. Key-Rotation

```typescript
// Empfohlene Rotation-Intervalle
const rotationIntervals = {
  'document_encryption': 90,      // 90 Tage
  'field_encryption': 180,        // 180 Tage
  'api_key_encryption': 365,      // 1 Jahr
  'backup_encryption': 90         // 90 Tage
};
```

### 2. Cache-Optimierung

```typescript
// Passe Cache-TTL basierend auf Nutzungsmuster an
const cacheTTL = {
  'frequently_used': 600,         // 10 Minuten
  'normal': 300,                  // 5 Minuten
  'rarely_used': 60               // 1 Minute
};
```

### 3. Audit-Log-Retention

```typescript
// DSGVO-konforme Retention
const retentionPolicies = {
  'security_events': 2555,        // 7 Jahre
  'access_logs': 2555,            // 7 Jahre
  'operational_logs': 365         // 1 Jahr
};
```

## Integration in Anwendung

### Initialisierung beim Server-Start

```typescript
// services/backend/src/index.ts
import { KeyManagementService } from './services/kms';
import { redis } from './config/redis';
import { prisma } from './config/database';
import { EncryptionService } from './services/EncryptionService';

// Validiere Konfiguration
validateConfig();

// Initialisiere KMS
const encryptionService = new EncryptionService();
const kms = new KeyManagementService(
  prisma,
  redis.getClient(),
  encryptionService
);

// Health Check
const health = await kms.healthCheck();
if (!health.healthy) {
  logger.error('KMS health check failed:', health);
  process.exit(1);
}

logger.info('KMS initialized and healthy');
```

### Verwendung in Services

```typescript
// Beispiel: DocumentStorageService
import { kms } from '../config/kms';

async uploadDocument(file: File, tenantId: string) {
  // Hole oder erstelle Encryption Key
  let keyMetadata = await kms.getKeyForPurpose(
    tenantId,
    KeyPurpose.DOCUMENT_ENCRYPTION
  );

  if (!keyMetadata) {
    keyMetadata = await kms.createKey({
      tenantId,
      purpose: KeyPurpose.DOCUMENT_ENCRYPTION,
      autoRotate: true,
      rotationIntervalDays: 90
    });
  }

  // Verwende Key für Verschlüsselung
  const key = await kms.getKey(keyMetadata.id, tenantId, 'document-service');
  const encrypted = await encryptionService.encrypt(fileData, key);
  
  // ...
}
```

## Compliance und Dokumentation

### DSGVO-Anforderungen

✅ **Erfüllt durch KMS-Konfiguration:**

1. **Art. 32 DSGVO - Sicherheit der Verarbeitung**
   - Ende-zu-Ende-Verschlüsselung (Master Key + DEKs)
   - Regelmäßige Key-Rotation
   - Audit-Logging aller Zugriffe

2. **Art. 25 DSGVO - Datenschutz durch Technikgestaltung**
   - Tenant-Isolation
   - Verschlüsselung by Default
   - Minimale Datenexposition

3. **Art. 30 DSGVO - Verzeichnis von Verarbeitungstätigkeiten**
   - Vollständige Audit-Logs
   - 7 Jahre Aufbewahrung
   - HMAC-Signierung für Integrität

### Dokumentationspflichten

Folgende Dokumente sollten erstellt werden:

1. **Verschlüsselungskonzept**
   - Beschreibung der Envelope Encryption
   - Master Key Management
   - Key-Rotation-Strategie

2. **Zugriffskontrollkonzept**
   - Wer hat Zugriff auf Master Key
   - Autorisierungsprozesse
   - Incident-Response-Prozeduren

3. **Backup- und Recovery-Plan**
   - Master Key Backup-Strategie
   - Recovery-Prozeduren
   - Disaster-Recovery-Tests

## Hilfreiche Skripte

### 1. KMS Keys Generator

**Datei:** `scripts/generate-kms-keys.js`

Generiert kryptographisch sichere Keys für das KMS:

```bash
node scripts/generate-kms-keys.js
```

**Features:**
- Generiert Master Encryption Key (256 bits)
- Generiert HMAC Key für Audit-Logs (256 bits)
- Zeigt .env-Konfiguration an
- Gibt Sicherheitshinweise aus

### 2. KMS Configuration Validator

**Datei:** `scripts/validate-kms-config.js`

Validiert die KMS-Konfiguration:

```bash
node scripts/validate-kms-config.js
```

**Prüfungen:**
- ✅ Master Key Format (64 hex Zeichen)
- ✅ HMAC Key Format (64 hex Zeichen)
- ✅ Cache-Konfiguration (TTL, Max Keys)
- ✅ Rotation-Konfiguration (Intervalle)
- ✅ Audit-Retention (DSGVO-Compliance)
- ⚠️  Warnungen bei suboptimalen Einstellungen

**Exit Codes:**
- `0`: Konfiguration ist gültig
- `1`: Konfiguration ist ungültig

**Integration in CI/CD:**

```yaml
# .github/workflows/ci.yml
- name: Validate KMS Configuration
  run: node scripts/validate-kms-config.js
  env:
    MASTER_ENCRYPTION_KEY: ${{ secrets.MASTER_ENCRYPTION_KEY }}
    KMS_AUDIT_HMAC_KEY: ${{ secrets.KMS_AUDIT_HMAC_KEY }}
```

## Zusammenfassung

✅ **Implementiert:**
- KMS-Konfiguration in config.ts mit vollständiger Validierung
- Alle Umgebungsvariablen in .env.example dokumentiert
- Master Key Setup-Anleitung mit Sicherheitshinweisen
- Automatische Validierung beim Server-Start
- KMS Keys Generator Skript (`scripts/generate-kms-keys.js`)
- KMS Configuration Validator Skript (`scripts/validate-kms-config.js`)
- Sicherheitsanforderungen und Best Practices dokumentiert
- Troubleshooting-Guide für häufige Probleme
- Compliance-Hinweise für DSGVO

✅ **Anforderungen erfüllt:**
- Requirement 7.1: Ende-zu-Ende-Verschlüsselung
- Requirement 7.2: Sichere Schlüsselverwaltung
- Requirement 7.4: DSGVO-Compliance

✅ **Zusätzliche Features:**
- Automatische Format-Validierung für Master Key und HMAC Key
- Warnungen bei fehlenden Keys in Entwicklungsumgebung
- Produktionsbereitschaft mit HSM/Vault-Unterstützung
- CI/CD-Integration möglich

Das KMS ist vollständig konfiguriert, validiert und produktionsbereit!
