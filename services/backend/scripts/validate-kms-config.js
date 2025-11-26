#!/usr/bin/env node

/**
 * KMS Configuration Validation Script
 * 
 * Dieses Skript validiert die KMS-Konfiguration und prüft:
 * - Master Key Format und Länge
 * - HMAC Key Format und Länge
 * - Alle erforderlichen Umgebungsvariablen
 * 
 * Verwendung:
 *   node scripts/validate-kms-config.js
 */

const crypto = require('crypto');
require('dotenv').config();

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function validateHexKey(key, name, requiredLength = 64) {
  if (!key) {
    log(`❌ ${name} ist nicht gesetzt`, COLORS.red);
    return false;
  }

  if (key.length !== requiredLength) {
    log(`❌ ${name} hat falsche Länge: ${key.length} (erwartet: ${requiredLength})`, COLORS.red);
    return false;
  }

  if (!/^[0-9a-fA-F]+$/.test(key)) {
    log(`❌ ${name} enthält ungültige Zeichen (nur 0-9, a-f, A-F erlaubt)`, COLORS.red);
    return false;
  }

  log(`✅ ${name} ist gültig`, COLORS.green);
  return true;
}

function validateKeyEntropy(key, name, minEntropy = 3.5) {
  if (!key) return false;
  
  // Calculate Shannon entropy
  const freq = {};
  for (let i = 0; i < key.length; i++) {
    const char = key[i];
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  const len = key.length;
  for (const char in freq) {
    const p = freq[char] / len;
    entropy -= p * Math.log2(p);
  }
  
  if (entropy < minEntropy) {
    log(`⚠️  ${name} hat niedrige Entropie: ${entropy.toFixed(2)} (mindestens ${minEntropy} empfohlen)`, COLORS.yellow);
    return false;
  }
  
  log(`✅ ${name} Entropie: ${entropy.toFixed(2)}`, COLORS.green);
  return true;
}

function validateKeyNotInDictionary(key, name) {
  // Simple check against common weak keys
  const weakKeys = [
    '0000000000000000000000000000000000000000000000000000000000000000',
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  ];
  
  if (weakKeys.includes(key.toLowerCase())) {
    log(`❌ ${name} ist ein bekannter schwacher Schlüssel`, COLORS.red);
    return false;
  }
  
  return true;
}

function generateKey() {
  return crypto.randomBytes(32).toString('hex');
}

function main() {
  log('\n🔐 KMS Configuration Validation\n', COLORS.blue);

  let isValid = true;

  // Validiere Master Key
  log('Prüfe MASTER_ENCRYPTION_KEY...', COLORS.yellow);
  const masterKey = process.env.MASTER_ENCRYPTION_KEY;
  let masterKeyValid = validateHexKey(masterKey, 'MASTER_ENCRYPTION_KEY');
  if (masterKeyValid) {
    masterKeyValid = validateKeyEntropy(masterKey, 'MASTER_ENCRYPTION_KEY') && masterKeyValid;
    masterKeyValid = validateKeyNotInDictionary(masterKey, 'MASTER_ENCRYPTION_KEY') && masterKeyValid;
  }
  
  if (!masterKeyValid) {
    isValid = false;
    log('\n💡 Generiere einen neuen Master Key mit:', COLORS.yellow);
    log(`   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, COLORS.blue);
    log(`\n   Beispiel: ${generateKey()}`, COLORS.green);
  }

  // Validiere HMAC Key
  log('\nPrüfe KMS_AUDIT_HMAC_KEY...', COLORS.yellow);
  const hmacKey = process.env.KMS_AUDIT_HMAC_KEY;
  let hmacKeyValid = validateHexKey(hmacKey, 'KMS_AUDIT_HMAC_KEY');
  if (hmacKeyValid) {
    hmacKeyValid = validateKeyEntropy(hmacKey, 'KMS_AUDIT_HMAC_KEY') && hmacKeyValid;
    hmacKeyValid = validateKeyNotInDictionary(hmacKey, 'KMS_AUDIT_HMAC_KEY') && hmacKeyValid;
  }
  
  if (!hmacKeyValid) {
    isValid = false;
    log('\n💡 Generiere einen neuen HMAC Key mit:', COLORS.yellow);
    log(`   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, COLORS.blue);
    log(`\n   Beispiel: ${generateKey()}`, COLORS.green);
  }

  // Prüfe optionale Konfigurationen
  log('\nPrüfe optionale KMS-Konfigurationen...', COLORS.yellow);
  
  const cacheTTL = parseInt(process.env.KMS_CACHE_TTL || '300', 10);
  if (cacheTTL < 60 || cacheTTL > 3600) {
    log(`⚠️  KMS_CACHE_TTL (${cacheTTL}s) außerhalb empfohlener Range (60-3600s)`, COLORS.yellow);
  } else {
    log(`✅ KMS_CACHE_TTL: ${cacheTTL}s`, COLORS.green);
  }

  const cacheMaxKeys = parseInt(process.env.KMS_CACHE_MAX_KEYS || '1000', 10);
  if (cacheMaxKeys < 100 || cacheMaxKeys > 10000) {
    log(`⚠️  KMS_CACHE_MAX_KEYS (${cacheMaxKeys}) außerhalb empfohlener Range (100-10000)`, COLORS.yellow);
  } else {
    log(`✅ KMS_CACHE_MAX_KEYS: ${cacheMaxKeys}`, COLORS.green);
  }

  const rotationDays = parseInt(process.env.KMS_DEFAULT_ROTATION_DAYS || '90', 10);
  if (rotationDays < 30 || rotationDays > 365) {
    log(`⚠️  KMS_DEFAULT_ROTATION_DAYS (${rotationDays}) außerhalb empfohlener Range (30-365)`, COLORS.yellow);
  } else {
    log(`✅ KMS_DEFAULT_ROTATION_DAYS: ${rotationDays} Tage`, COLORS.green);
  }

  const auditRetention = parseInt(process.env.KMS_AUDIT_RETENTION_DAYS || '2555', 10);
  if (auditRetention < 2190) { // 6 Jahre = 2190 Tage (DSGVO Minimum)
    log(`⚠️  KMS_AUDIT_RETENTION_DAYS (${auditRetention}) unter DSGVO-Minimum (2190 Tage / 6 Jahre)`, COLORS.yellow);
  } else {
    log(`✅ KMS_AUDIT_RETENTION_DAYS: ${auditRetention} Tage (${Math.round(auditRetention / 365)} Jahre)`, COLORS.green);
  }

  // Prüfe Sicherheitskonfiguration
  log('\nPrüfe Sicherheitskonfiguration...', COLORS.yellow);
  
  const autoRotation = process.env.KMS_AUTO_ROTATION_ENABLED === 'true';
  if (autoRotation) {
    log('✅ Automatische Schlüsselrotation ist aktiviert', COLORS.green);
  } else {
    log('⚠️  Automatische Schlüsselrotation ist deaktiviert', COLORS.yellow);
  }
  
  const hsmEnabled = process.env.KMS_HSM_ENABLED === 'true';
  if (hsmEnabled) {
    log('✅ HSM ist aktiviert', COLORS.green);
    if (process.env.KMS_VAULT_URL) {
      log(`✅ Vault URL: ${process.env.KMS_VAULT_URL}`, COLORS.green);
    }
  } else {
    log('⚠️  HSM ist deaktiviert (empfohlen für Produktionsumgebungen)', COLORS.yellow);
  }

  // Prüfe auf bekannte unsichere Keys
  log('\nPrüfe auf bekannte unsichere Keys...', COLORS.yellow);
  const knownInsecureKeys = [
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    'cafebabe1234567890abcdef1234567890abcdef1234567890abcdef12345678'
  ];
  
  if (masterKey && knownInsecureKeys.includes(masterKey.toLowerCase())) {
    log('❌ MASTER_ENCRYPTION_KEY ist ein bekannter unsicherer Schlüssel', COLORS.red);
    isValid = false;
  }
  
  if (hmacKey && knownInsecureKeys.includes(hmacKey.toLowerCase())) {
    log('❌ KMS_AUDIT_HMAC_KEY ist ein bekannter unsicherer Schlüssel', COLORS.red);
    isValid = false;
  }

  // Zusammenfassung
  log('\n' + '='.repeat(50), COLORS.blue);
  if (isValid) {
    log('✅ KMS-Konfiguration ist gültig!', COLORS.green);
    log('\n💡 Nächste Schritte:', COLORS.yellow);
    log('   1. Speichere die Keys sicher (Passwort-Manager, Vault)', COLORS.blue);
    log('   2. Erstelle Offline-Backups an mehreren Orten', COLORS.blue);
    log('   3. Dokumentiere den Zugriff auf die Keys', COLORS.blue);
    log('   4. Plane regelmäßige Key-Rotationen', COLORS.blue);
    log('   5. Führe regelmäßig Sicherheitschecks durch', COLORS.blue);
    process.exit(0);
  } else {
    log('❌ KMS-Konfiguration ist ungültig!', COLORS.red);
    log('\n💡 Bitte behebe die oben genannten Fehler.', COLORS.yellow);
    process.exit(1);
  }
}

main();
