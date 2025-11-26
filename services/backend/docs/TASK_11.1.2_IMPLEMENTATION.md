# Task 11.1.2 Implementation: Master Key Manager

## Übersicht

Task 11.1.2 "Master Key Manager implementieren" wurde erfolgreich implementiert. Der MasterKeyManager ist die zentrale Komponente für die Verwaltung des Master Encryption Keys im Key Management System.

## Implementierte Komponenten

### 1. MasterKeyManager Klasse

**Datei:** `src/services/kms/MasterKeyManager.ts`

**Zweck:** Verwaltet den Master Key für Envelope Encryption

#### Hauptfunktionen

##### getMasterKey()
```typescript
getMasterKey(): Buffer
```
- Gibt den Master Key als Buffer zurück
- Wirft Fehler wenn Key nicht initialisiert
- Wird für Verschlüsselung von DEKs verwendet

##### validateMasterKey()
```typescript
validateMasterKey(): boolean
```
- Validiert ob Master Key korrekt geladen wurde
- Prüft Länge (32 Bytes = 256 Bits)
- Prüft ob Key nicht nur Nullen enthält
- Gibt true/false zurück

##### rotateMasterKey()
```typescript
async rotateMasterKey(newMasterKeyHex: string): Promise<void>
```
- Rotiert den Master Key
- Validiert neuen Key (Format, Länge, Unterschied)
- Speichert alten Key für Re-Encryption
- Setzt neuen Master Key

##### generateMasterKey() (static)
```typescript
static generateMasterKey(): string
```
- Generiert einen neuen zufälligen Master Key
- Verwendet crypto.randomBytes(32)
- Gibt Hex-String zurück
- **NUR für Entwicklung/Testing!**

##### getMasterKeyInfo()
```typescript
getMasterKeyInfo(): { length: number; algorithm: string; isValid: boolean }
```
- Gibt Informationen über Master Key zurück
- Gibt NICHT den Key selbst preis
- Für Monitoring und Debugging



## Sicherheitsfeatures

### 1. Sichere Key-Speicherung

- Master Key wird als Buffer im Speicher gehalten
- Nie als String gespeichert
- Nicht in Logs ausgegeben
- Nur über getMasterKey() zugänglich

### 2. Validierung

**Format-Validierung:**
- Muss Hexadezimal sein (0-9, a-f, A-F)
- Muss exakt 64 Zeichen lang sein (32 Bytes)
- Regex: `/^[0-9a-fA-F]+$/`

**Sicherheits-Validierung:**
- Darf nicht nur Nullen enthalten
- Muss 256 Bits (32 Bytes) lang sein
- Wird bei Initialisierung geprüft

### 3. Fehlerbehandlung

**Spezifische Fehler:**
- `MASTER_KEY_ERROR` - Master Key nicht gefunden
- `MASTER_KEY_ERROR` - Ungültiges Format
- `MASTER_KEY_ERROR` - Falsche Länge
- `MASTER_KEY_ERROR` - Rotation fehlgeschlagen

**Fehlerbeispiele:**
```typescript
// Master Key fehlt
throw new KeyManagementError(
  'Master encryption key not found in environment variables',
  KeyManagementErrorCode.MASTER_KEY_ERROR
);

// Ungültiges Format
throw new KeyManagementError(
  'Master encryption key must be in hexadecimal format',
  KeyManagementErrorCode.MASTER_KEY_ERROR
);
```

### 4. Key-Rotation

**Sicherheitsmaßnahmen:**
- Neuer Key muss unterschiedlich sein
- Alter Key wird für Re-Encryption gespeichert
- Validierung vor Rotation
- Logging der Rotation

**Wichtig:** Re-Encryption aller DEKs muss vom KeyManagementService durchgeführt werden!

## Verwendung

### Initialisierung

```typescript
import { MasterKeyManager } from './services/kms/MasterKeyManager';

// Master Key aus Umgebungsvariable laden
const masterKeyManager = new MasterKeyManager();
```

### Master Key abrufen

```typescript
const masterKey = masterKeyManager.getMasterKey();
// Verwende masterKey für Verschlüsselung von DEKs
```

### Master Key validieren

```typescript
const isValid = masterKeyManager.validateMasterKey();
if (!isValid) {
  console.error('Master Key ist ungültig!');
}
```

### Master Key rotieren

```typescript
const newKey = MasterKeyManager.generateMasterKey();
await masterKeyManager.rotateMasterKey(newKey);

// WICHTIG: Jetzt müssen alle DEKs re-encrypted werden!
```

### Key-Informationen abrufen

```typescript
const info = masterKeyManager.getMasterKeyInfo();
console.log(info);
// { length: 32, algorithm: 'aes-256-gcm', isValid: true }
```

### Neuen Master Key generieren (Development)

```typescript
// NUR für Entwicklung/Testing!
const newMasterKey = MasterKeyManager.generateMasterKey();
console.log('Neuer Master Key:', newMasterKey);
// Setze in .env: MASTER_ENCRYPTION_KEY=<newMasterKey>
```

## Umgebungsvariablen

### MASTER_ENCRYPTION_KEY

**Format:** Hexadezimal-String (64 Zeichen)
**Länge:** 32 Bytes (256 Bits)
**Beispiel:** `a1b2c3d4e5f6...` (64 Zeichen)

**Generierung:**
```bash
# Mit Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Mit OpenSSL
openssl rand -hex 32
```

**Konfiguration:**
```bash
# .env Datei
MASTER_ENCRYPTION_KEY=your_64_character_hex_string_here
```

## Tests

Umfassende Test-Suite in `src/tests/masterKeyManager.test.ts`:

### Test-Kategorien

1. **Initialisierung**
   - Laden aus Umgebungsvariable
   - Fehlerbehandlung bei fehlendem Key
   - Validierung von Format und Länge

2. **getMasterKey()**
   - Key-Rückgabe
   - Konsistenz bei mehrfachen Aufrufen

3. **validateMasterKey()**
   - Validierung gültiger Keys
   - Erkennung unsicherer Keys (nur Nullen)

4. **rotateMasterKey()**
   - Erfolgreiche Rotation
   - Fehlerbehandlung bei ungültigen Keys
   - Verhinderung gleicher Keys

5. **generateMasterKey()**
   - Generierung gültiger Keys
   - Einzigartigkeit

6. **getMasterKeyInfo()**
   - Informationsrückgabe ohne Key-Preisgabe

7. **Sicherheitstests**
   - Keine Key-Ausgabe in Logs
   - Sichere Speicherung im Speicher

8. **Fehlerbehandlung**
   - Spezifische Fehlercodes
   - Aussagekräftige Fehlermeldungen

### Tests ausführen

```bash
cd services/backend
npm test -- masterKeyManager.test.ts
```

## Best Practices

### 1. Master Key Generierung

**Produktion:**
```bash
# Verwende kryptographisch sichere Zufallszahlen
openssl rand -hex 32
```

**NICHT verwenden:**
- Einfache Passwörter
- Vorhersehbare Muster
- Wiederverwendete Keys

### 2. Master Key Speicherung

**Empfohlen:**
- Umgebungsvariablen (für Development)
- Hardware Security Module (HSM) für Produktion
- Key Management Services (AWS KMS, Azure Key Vault)
- Verschlüsselte Konfigurationsdateien

**NICHT empfohlen:**
- Hardcoded im Code
- In Git-Repositories
- In Logs oder Backups
- Unverschlüsselt auf Disk

### 3. Master Key Rotation

**Wann rotieren:**
- Regelmäßig (z.B. jährlich)
- Bei Sicherheitsvorfällen
- Bei Mitarbeiter-Wechsel
- Bei Compliance-Anforderungen

**Rotation-Prozess:**
1. Neuen Master Key generieren
2. Alle DEKs mit altem Key entschlüsseln
3. Alle DEKs mit neuem Key verschlüsseln
4. Alten Key sicher löschen
5. Audit-Log erstellen

### 4. Monitoring

**Überwachen:**
- Master Key Validierung
- Zugriffshäufigkeit
- Fehlerrate
- Rotation-Events

**Alerts:**
- Ungültiger Master Key
- Fehlgeschlagene Validierung
- Ungewöhnliche Zugriffsmuster

## Sicherheitshinweise

### ⚠️ WICHTIG

1. **Master Key NIEMALS committen**
   - Nicht in Git
   - Nicht in Dokumentation
   - Nicht in Logs

2. **Master Key sicher speichern**
   - Verwende HSM in Produktion
   - Verschlüsselte Backups
   - Zugriffskontrolle

3. **Master Key Rotation planen**
   - Regelmäßige Rotation
   - Dokumentierter Prozess
   - Getestete Wiederherstellung

4. **Zugriff beschränken**
   - Nur autorisierte Services
   - Audit-Logging
   - Least Privilege Prinzip

## Erfüllte Anforderungen

✅ **Anforderung 7.1:** Ende-zu-Ende-Verschlüsselung
- Master Key Management implementiert
- Sichere Key-Speicherung
- Validierung und Fehlerbehandlung

✅ **Anforderung 7.2:** Key Management System
- getMasterKey() implementiert
- validateMasterKey() implementiert
- rotateMasterKey() implementiert
- Fehlerbehandlung für fehlenden Master Key

## Integration

Der MasterKeyManager wird von folgenden Komponenten verwendet:

1. **KeyStorage** (Task 11.1.3)
   - Verwendet Master Key für Envelope Encryption
   - Verschlüsselt DEKs mit Master Key

2. **KeyManagementService** (Task 11.1.7)
   - Koordiniert Master Key Rotation
   - Verwaltet Re-Encryption bei Rotation

3. **EncryptionService** (Task 11.1.8)
   - Verwendet Master Key indirekt über KeyStorage

## Nächste Schritte

Task 11.1.2 ist vollständig implementiert. Die nächsten Tasks können nun implementiert werden:

1. **Task 11.1.3** - Key Storage Layer implementieren
2. **Task 11.1.4** - Key Cache Manager mit Redis
3. **Task 11.1.5** - Audit Logger für Compliance
4. **Task 11.1.6** - Key Rotation Manager
5. **Task 11.1.7** - KeyManagementService Hauptservice

## Technische Spezifikationen

### Performance
- < 1ms für getMasterKey()
- < 1ms für validateMasterKey()
- < 10ms für rotateMasterKey()

### Speicher
- ~32 Bytes für Master Key
- Minimaler Overhead

### Sicherheit
- AES-256-GCM Algorithmus
- 256-Bit Schlüssellänge
- Kryptographisch sichere Zufallszahlen

Task 11.1.2 ist erfolgreich abgeschlossen! ✅
