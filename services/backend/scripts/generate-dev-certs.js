#!/usr/bin/env node

/**
 * Script zum Generieren von selbstsignierten SSL-Zertifikaten für die Entwicklung
 * 
 * Verwendung:
 *   node scripts/generate-dev-certs.js
 * 
 * Generiert:
 *   - certs/ca-key.pem (CA Private Key)
 *   - certs/ca-cert.pem (CA Certificate)
 *   - certs/server-key.pem (Server Private Key)
 *   - certs/server-cert.pem (Server Certificate)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CERTS_DIR = path.join(__dirname, '../certs');
const DAYS_VALID = 365;

// Farben für Console-Output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkOpenSSL() {
  try {
    execSync('openssl version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function createCertsDirectory() {
  if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
    log(`✓ Verzeichnis erstellt: ${CERTS_DIR}`, 'green');
  } else {
    log(`✓ Verzeichnis existiert bereits: ${CERTS_DIR}`, 'blue');
  }
}

function generateCA() {
  log('\n📜 Generiere Certificate Authority (CA)...', 'blue');
  
  const caKeyPath = path.join(CERTS_DIR, 'ca-key.pem');
  const caCertPath = path.join(CERTS_DIR, 'ca-cert.pem');

  // Generiere CA Private Key
  execSync(
    `openssl genrsa -out "${caKeyPath}" 4096`,
    { stdio: 'ignore' }
  );
  log('✓ CA Private Key generiert', 'green');

  // Generiere CA Certificate
  execSync(
    `openssl req -new -x509 -days ${DAYS_VALID} -key "${caKeyPath}" -out "${caCertPath}" ` +
    `-subj "/C=DE/ST=Berlin/L=Berlin/O=SmartLaw Development/CN=SmartLaw Dev CA"`,
    { stdio: 'ignore' }
  );
  log('✓ CA Certificate generiert', 'green');

  return { caKeyPath, caCertPath };
}

function generateServerCertificate(caKeyPath, caCertPath) {
  log('\n🔐 Generiere Server-Zertifikat...', 'blue');
  
  const serverKeyPath = path.join(CERTS_DIR, 'server-key.pem');
  const serverCsrPath = path.join(CERTS_DIR, 'server-csr.pem');
  const serverCertPath = path.join(CERTS_DIR, 'server-cert.pem');
  const extFilePath = path.join(CERTS_DIR, 'server-ext.cnf');

  // Generiere Server Private Key
  execSync(
    `openssl genrsa -out "${serverKeyPath}" 4096`,
    { stdio: 'ignore' }
  );
  log('✓ Server Private Key generiert', 'green');

  // Generiere Certificate Signing Request (CSR)
  execSync(
    `openssl req -new -key "${serverKeyPath}" -out "${serverCsrPath}" ` +
    `-subj "/C=DE/ST=Berlin/L=Berlin/O=SmartLaw Development/CN=localhost"`,
    { stdio: 'ignore' }
  );
  log('✓ Certificate Signing Request (CSR) generiert', 'green');

  // Erstelle Extensions-Datei für Subject Alternative Names
  const extConfig = `
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
`;
  fs.writeFileSync(extFilePath, extConfig);

  // Signiere Server Certificate mit CA
  execSync(
    `openssl x509 -req -days ${DAYS_VALID} -in "${serverCsrPath}" ` +
    `-CA "${caCertPath}" -CAkey "${caKeyPath}" -CAcreateserial ` +
    `-out "${serverCertPath}" -extfile "${extFilePath}"`,
    { stdio: 'ignore' }
  );
  log('✓ Server Certificate signiert', 'green');

  // Lösche temporäre Dateien
  fs.unlinkSync(serverCsrPath);
  fs.unlinkSync(extFilePath);
  const serialPath = path.join(CERTS_DIR, 'ca-cert.srl');
  if (fs.existsSync(serialPath)) {
    fs.unlinkSync(serialPath);
  }

  return { serverKeyPath, serverCertPath };
}

function setPermissions() {
  log('\n🔒 Setze Dateiberechtigungen...', 'blue');
  
  try {
    // Private Keys nur für Owner lesbar
    const privateKeys = ['ca-key.pem', 'server-key.pem'];
    privateKeys.forEach(file => {
      const filePath = path.join(CERTS_DIR, file);
      if (fs.existsSync(filePath)) {
        fs.chmodSync(filePath, 0o600);
      }
    });

    // Certificates für alle lesbar
    const certs = ['ca-cert.pem', 'server-cert.pem'];
    certs.forEach(file => {
      const filePath = path.join(CERTS_DIR, file);
      if (fs.existsSync(filePath)) {
        fs.chmodSync(filePath, 0o644);
      }
    });

    log('✓ Dateiberechtigungen gesetzt', 'green');
  } catch (error) {
    log('⚠ Konnte Dateiberechtigungen nicht setzen (Windows?)', 'yellow');
  }
}

function displayCertificateInfo(serverCertPath) {
  log('\n📋 Zertifikat-Informationen:', 'blue');
  
  try {
    const certInfo = execSync(
      `openssl x509 -in "${serverCertPath}" -noout -subject -issuer -dates`,
      { encoding: 'utf8' }
    );
    console.log(certInfo);
  } catch (error) {
    log('⚠ Konnte Zertifikat-Informationen nicht anzeigen', 'yellow');
  }
}

function printInstructions() {
  log('\n' + '='.repeat(70), 'blue');
  log('✅ Entwicklungszertifikate erfolgreich generiert!', 'green');
  log('='.repeat(70), 'blue');
  
  log('\n📝 Nächste Schritte:', 'yellow');
  log('1. Aktiviere TLS in deiner .env Datei:', 'reset');
  log('   TLS_ENABLED=true', 'blue');
  log('   TLS_CERT_DIR=./certs', 'blue');
  
  log('\n2. Optional: HTTP Redirect aktivieren:', 'reset');
  log('   HTTP_REDIRECT_PORT=3000', 'blue');
  
  log('\n3. Starte den Server:', 'reset');
  log('   npm run dev', 'blue');
  
  log('\n⚠️  WICHTIG für Browser:', 'yellow');
  log('   Diese Zertifikate sind selbstsigniert und nur für die Entwicklung!', 'reset');
  log('   Dein Browser wird eine Sicherheitswarnung anzeigen.', 'reset');
  log('   Du musst das Zertifikat manuell akzeptieren.', 'reset');
  
  log('\n💡 Tipp: CA-Zertifikat zum System hinzufügen:', 'yellow');
  log('   - macOS: Öffne certs/ca-cert.pem mit Keychain Access', 'reset');
  log('   - Windows: Importiere certs/ca-cert.pem in "Vertrauenswürdige Stammzertifizierungsstellen"', 'reset');
  log('   - Linux: Kopiere certs/ca-cert.pem nach /usr/local/share/ca-certificates/', 'reset');
  
  log('\n' + '='.repeat(70) + '\n', 'blue');
}

function main() {
  log('\n🔐 SmartLaw - Entwicklungszertifikate Generator', 'blue');
  log('='.repeat(70), 'blue');

  // Prüfe ob OpenSSL verfügbar ist
  if (!checkOpenSSL()) {
    log('\n❌ Fehler: OpenSSL ist nicht installiert oder nicht im PATH', 'red');
    log('Bitte installiere OpenSSL:', 'yellow');
    log('  - Windows: https://slproweb.com/products/Win32OpenSSL.html', 'reset');
    log('  - macOS: brew install openssl', 'reset');
    log('  - Linux: sudo apt-get install openssl', 'reset');
    process.exit(1);
  }

  log('✓ OpenSSL gefunden', 'green');

  // Erstelle Verzeichnis
  createCertsDirectory();

  // Generiere Zertifikate
  const { caKeyPath, caCertPath } = generateCA();
  const { serverKeyPath, serverCertPath } = generateServerCertificate(caKeyPath, caCertPath);

  // Setze Berechtigungen
  setPermissions();

  // Zeige Zertifikat-Informationen
  displayCertificateInfo(serverCertPath);

  // Zeige Anweisungen
  printInstructions();
}

// Script ausführen
if (require.main === module) {
  try {
    main();
  } catch (error) {
    log(`\n❌ Fehler: ${error.message}`, 'red');
    process.exit(1);
  }
}

module.exports = { main };
