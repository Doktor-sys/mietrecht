/**
 * Master Key Manager
 *
 * Verwaltet den Master Key für Envelope Encryption.
 * Der Master Key wird verwendet, um alle Data Encryption Keys (DEKs) zu verschlüsseln.
 */
export declare class MasterKeyManager {
    private masterKey;
    private readonly keyLength;
    /**
     * Initialisiert den Master Key Manager
     */
    constructor();
    /**
     * Lädt den Master Key aus der Umgebungsvariable
     */
    private loadMasterKey;
    /**
     * Gibt den Master Key zurück
     */
    getMasterKey(): Buffer;
    /**
     * Validiert, ob der Master Key korrekt geladen wurde
     */
    validateMasterKey(): boolean;
    /**
     * Rotiert den Master Key
     * WICHTIG: Diese Methode sollte nur mit äußerster Vorsicht verwendet werden
     * und erfordert Re-Encryption aller DEKs
     */
    rotateMasterKey(newMasterKeyHex: string): Promise<void>;
    /**
     * Generiert einen neuen Master Key
     * WARNUNG: Nur für Entwicklung/Testing verwenden!
     */
    static generateMasterKey(): string;
    /**
     * Gibt Informationen über den Master Key zurück (ohne den Key selbst preiszugeben)
     */
    getMasterKeyInfo(): {
        length: number;
        algorithm: string;
        isValid: boolean;
    };
}
