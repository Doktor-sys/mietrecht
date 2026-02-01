"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTLSCertificates = loadTLSCertificates;
exports.createHTTPSOptions = createHTTPSOptions;
exports.getTLSConfig = getTLSConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
/**
 * Lädt TLS-Zertifikate aus dem Dateisystem
 */
function loadTLSCertificates() {
    try {
        const certDir = process.env.TLS_CERT_DIR || path_1.default.join(__dirname, '../../certs');
        const keyPath = path_1.default.join(certDir, 'server-key.pem');
        const certPath = path_1.default.join(certDir, 'server-cert.pem');
        const caPath = path_1.default.join(certDir, 'ca-cert.pem');
        // Prüfe ob Zertifikate existieren
        if (!fs_1.default.existsSync(keyPath) || !fs_1.default.existsSync(certPath)) {
            logger_1.logger.warn('TLS certificates not found, running in HTTP mode');
            return null;
        }
        const key = fs_1.default.readFileSync(keyPath);
        const cert = fs_1.default.readFileSync(certPath);
        const ca = fs_1.default.existsSync(caPath) ? fs_1.default.readFileSync(caPath) : undefined;
        logger_1.logger.info('TLS certificates loaded successfully');
        return { key, cert, ca };
    }
    catch (error) {
        logger_1.logger.error('Failed to load TLS certificates:', error);
        return null;
    }
}
/**
 * Erstellt HTTPS-Server-Optionen mit TLS 1.3
 */
function createHTTPSOptions() {
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
function getTLSConfig() {
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
