import fs from 'fs';
import path from 'path';
import https from 'https';
import { logger } from '../utils/logger';

/**
 * TLS 1.3 Konfiguration für sichere API-Kommunikation
 */

export interface TLSConfig {
  enabled: boolean;
  key: string;
  cert: string;
  ca?: string;
  minVersion: string;
  ciphers: string;
}

/**
 * Lädt TLS-Zertifikate aus dem Dateisystem
 */
export function loadTLSCertificates(): { key: Buffer; cert: Buffer; ca?: Buffer } | null {
  try {
    const certDir = process.env.TLS_CERT_DIR || path.join(__dirname, '../../certs');
    
    const keyPath = path.join(certDir, 'server-key.pem');
    const certPath = path.join(certDir, 'server-cert.pem');
    const caPath = path.join(certDir, 'ca-cert.pem');

    // Prüfe ob Zertifikate existieren
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      logger.warn('TLS certificates not found, running in HTTP mode');
      return null;
    }

    const key = fs.readFileSync(keyPath);
    const cert = fs.readFileSync(certPath);
    const ca = fs.existsSync(caPath) ? fs.readFileSync(caPath) : undefined;

    logger.info('TLS certificates loaded successfully');
    return { key, cert, ca };
  } catch (error) {
    logger.error('Failed to load TLS certificates:', error);
    return null;
  }
}

/**
 * Erstellt HTTPS-Server-Optionen mit TLS 1.3
 */
export function createHTTPSOptions(): https.ServerOptions | null {
  const certs = loadTLSCertificates();
  
  if (!certs) {
    return null;
  }

  return {
    key: certs.key,
    cert: certs.cert,
    ca: certs.ca,
    // TLS 1.3 als Minimum-Version
    minVersion: 'TLSv1.3',
    // Sichere Cipher-Suites für TLS 1.3
    ciphers: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256'
    ].join(':'),
    // Bevorzuge Server-Cipher-Reihenfolge
    honorCipherOrder: true,
    // Deaktiviere unsichere Renegotiation
    secureOptions: require('constants').SSL_OP_NO_RENEGOTIATION
  };
}

/**
 * Gibt TLS-Konfiguration zurück
 */
export function getTLSConfig(): TLSConfig {
  const enabled = process.env.TLS_ENABLED === 'true' || process.env.NODE_ENV === 'production';
  
  return {
    enabled,
    key: process.env.TLS_KEY_PATH || 'certs/server-key.pem',
    cert: process.env.TLS_CERT_PATH || 'certs/server-cert.pem',
    ca: process.env.TLS_CA_PATH,
    minVersion: 'TLSv1.3',
    ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256'
  };
}
