#!/usr/bin/env node

/**
 * KMS Keys Generator
 * 
 * Generiert kryptographisch sichere Keys für das KMS:
 * - Master Encryption Key (256 bits)
 * - HMAC Key für Audit-Logs (256 bits)
 * 
 * Verwendung:
 *   node scripts/generate-kms-keys.js
 */

const crypto = require('crypto');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function calculateEntropy(key) {
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
  
  return entropy;
}

function generateKey(minEntropy = 4.0) {
  let key;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    key = crypto.randomBytes(32).toString('hex');
    attempts++;
    
    // Verhindere Endlosschleife
    if (attempts > maxAttempts) {
      log(`⚠️  Maximale Versuche erreicht, verwende generierten Schlüssel`, COLORS.yellow);
      break;
    }
  } while (calculateEntropy(key) < minEntropy);
  
  return key;
}

function main() {
  log('\n🔐 KMS Keys Generator\n', COLORS.blue);
  log('Generiere kryptographisch sichere Keys für das Key Management System...\n', COLORS.yellow);

  // Generiere Master Key
  const masterKey = generateKey();
  log('✅ Master Encryption Key generiert:', COLORS.green);
  log(`   ${masterKey}\n`, COLORS.magenta);

  // Generiere HMAC Key
  const hmacKey = generateKey();
  log('✅ HMAC Key für Audit-Logs generiert:', COLORS.green);
  log(`   ${hmacKey}\n`, COLORS.magenta);

  // Ausgabe für .env Datei
  log('=' .repeat(70), COLORS.blue);
  log('\n📝 Füge folgende Zeilen zu deiner .env Datei hinzu:\n', COLORS.yellow);
  log('# Key Management System (KMS) Configuration', COLORS.blue);
  log(`MASTER_ENCRYPTION_KEY=${masterKey}`, COLORS.green);
  log(`KMS_AUDIT_HMAC_KEY=${hmacKey}`, COLORS.green);

  // Sicherheitshinweise
  log('\n' + '=' .repeat(70), COLORS.blue);
  log('\n⚠️  WICHTIGE SICHERHEITSHINWEISE:\n', COLORS.red);
  log('1. ❌ Committe diese Keys NIEMALS in Git!', COLORS.yellow);
  log('2. 💾 Speichere die Keys sicher (Passwort-Manager, Vault, HSM)', COLORS.yellow);
  log('3. 📦 Erstelle verschlüsselte Offline-Backups', COLORS.yellow);
  log('4. 🔄 Plane regelmäßige Key-Rotationen (empfohlen: jährlich)', COLORS.yellow);
  log('5. 🔒 Beschränke Zugriff auf autorisierte Personen/Systeme', COLORS.yellow);
  log('6. 📋 Dokumentiere, wer Zugriff auf die Keys hat', COLORS.yellow);
  log('7. 🚨 Erstelle einen Incident-Response-Plan für kompromittierte Keys', COLORS.yellow);

  // Produktionshinweise
  log('\n' + '=' .repeat(70), COLORS.blue);
  log('\n🏭 Für Produktionsumgebungen:\n', COLORS.blue);
  log('• Verwende Hardware Security Modules (HSM)', COLORS.yellow);
  log('• Oder HashiCorp Vault / Cloud Key Management Services', COLORS.yellow);
  log('• Aktiviere KMS_HSM_ENABLED=true in der Konfiguration', COLORS.yellow);
  log('• Verwende unterschiedliche Keys für jede Umgebung', COLORS.yellow);

  // Validierung
  log('\n' + '=' .repeat(70), COLORS.blue);
  log('\n✅ Validiere deine Konfiguration mit:\n', COLORS.green);
  log('   node scripts/validate-kms-config.js\n', COLORS.blue);
}

main();
