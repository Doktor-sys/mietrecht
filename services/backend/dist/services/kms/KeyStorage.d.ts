import { PrismaClient } from '@prisma/client';
import { EncryptedKeyData, KeyMetadata, KeyStatus, KeyPurpose, KeyFilters } from '../../types/kms';
/**
 * Key Storage Layer
 *
 * Verwaltet die Speicherung verschlüsselter Schlüssel in PostgreSQL
 * mit Tenant-Isolation und Envelope Encryption
 */
export declare class KeyStorage {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Speichert einen verschlüsselten Schlüssel
     */
    saveKey(keyData: EncryptedKeyData): Promise<void>;
    /**
     * Ruft einen verschlüsselten Schlüssel ab (mit Tenant-Isolation)
     */
    getKey(keyId: string, tenantId: string): Promise<EncryptedKeyData | null>;
    /**
     * Ruft den aktuellsten Schlüssel für einen bestimmten Purpose ab
     */
    getLatestKeyForPurpose(tenantId: string, purpose: KeyPurpose): Promise<EncryptedKeyData | null>;
    /**
     * Aktualisiert den Status eines Schlüssels
     */
    updateKeyStatus(keyId: string, tenantId: string, status: KeyStatus): Promise<void>;
    /**
     * Aktualisiert die lastUsedAt Zeit eines Schlüssels
     */
    updateLastUsed(keyId: string, tenantId: string): Promise<void>;
    /**
     * Aktualisiert Metadaten eines Schlüssels
     */
    updateKeyMetadata(keyId: string, tenantId: string, metadata: Partial<KeyMetadata>): Promise<void>;
    /**
     * Listet Schlüssel mit Filteroptionen
     */
    listKeys(tenantId: string, filters?: KeyFilters): Promise<KeyMetadata[]>;
    /**
     * Löscht einen Schlüssel (physisch aus der Datenbank)
     */
    deleteKey(keyId: string, tenantId: string): Promise<void>;
    /**
     * Zählt Schlüssel nach Status
     */
    countKeysByStatus(tenantId: string): Promise<Record<KeyStatus, number>>;
    /**
     * Findet abgelaufene Schlüssel
     */
    findExpiredKeys(tenantId?: string): Promise<KeyMetadata[]>;
}
