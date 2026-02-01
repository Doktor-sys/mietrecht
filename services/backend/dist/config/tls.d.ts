import https from 'https';
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
export declare function loadTLSCertificates(): {
    key: Buffer;
    cert: Buffer;
    ca?: Buffer;
} | null;
/**
 * Erstellt HTTPS-Server-Optionen mit TLS 1.3
 */
export declare function createHTTPSOptions(): https.ServerOptions | null;
/**
 * Gibt TLS-Konfiguration zurück
 */
export declare function getTLSConfig(): TLSConfig;
