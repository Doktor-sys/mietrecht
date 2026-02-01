import { PrismaClient } from '@prisma/client';
import { RedisClientType } from 'redis';
import { EncryptionService } from '../EncryptionService';
import { KeyMetadata, KeyPurpose, CreateKeyOptions } from '../../types/kms';
export declare class KeyManagementService {
    private prisma;
    private redis;
    private encryptionService;
    private alertManager;
    constructor(prisma: PrismaClient, redis: RedisClientType, encryptionService: EncryptionService);
    /**
     * Erstellt einen neuen Verschlüsselungsschlüssel
     */
    createKey(options: CreateKeyOptions): Promise<KeyMetadata>;
    /**
     * Ruft Metadaten eines Schlüssels ab
     */
    getKeyMetadata(keyId: string, tenantId: string): Promise<KeyMetadata>;
    /**
     * Markiert einen Schlüssel als kompromittiert
     */
    compromiseKey(keyId: string, tenantId: string): Promise<void>;
    /**
     * Rotiert einen Schlüssel
     */
    rotateKey(keyId: string, tenantId: string): Promise<KeyMetadata>;
    /**
     * Gets the active key for a specific purpose
     */
    getActiveKeyForPurpose(tenantId: string, purpose: KeyPurpose): Promise<KeyMetadata>;
    /**
     * Gets a key by ID and decrypts it
     */
    getKey(keyId: string, tenantId: string, serviceId?: string): Promise<string>;
}
