import { PrismaClient } from '@prisma/client';
import { KeyMetadata, RotationSchedule, RotationReport, DataReference } from '../../types/kms';
/**
 * Key Rotation Manager
 *
 * Verwaltet automatische und manuelle Schlüsselrotation
 * mit Re-Encryption von Daten
 */
export declare class KeyRotationManager {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Rotiert einen Schlüssel manuell
     * Erstellt eine neue Version und markiert die alte als deprecated
     */
    rotateKey(keyId: string, tenantId: string): Promise<KeyMetadata>;
    /**
     * Plant automatische Rotation für einen Schlüssel
     */
    scheduleRotation(keyId: string, schedule: RotationSchedule): Promise<void>;
    /**
     * Prüft und rotiert abgelaufene Schlüssel
     * Sollte regelmäßig per Cron-Job ausgeführt werden
     */
    checkAndRotateExpiredKeys(): Promise<RotationReport>;
    /**
     * Re-Encryption von Daten mit neuem Schlüssel
     *
     * Diese Methode koordiniert die Re-Encryption von Daten nach einer Schlüsselrotation.
     * Die tatsächliche Verschlüsselung wird vom EncryptionService durchgeführt.
     *
     * @param oldKeyId - ID des alten Schlüssels
     * @param newKeyId - ID des neuen Schlüssels
     * @param dataRefs - Referenzen zu den zu re-encryptenden Daten
     * @param encryptionCallback - Callback-Funktion für die tatsächliche Re-Encryption
     */
    reEncryptData(oldKeyId: string, newKeyId: string, dataRefs: DataReference[], encryptionCallback?: (oldKeyId: string, newKeyId: string, table: string, column: string, ids: string[]) => Promise<void>): Promise<void>;
    /**
     * Gibt Rotation-Schedule für einen Schlüssel zurück
     */
    getRotationSchedule(keyId: string): Promise<RotationSchedule | null>;
    /**
     * Deaktiviert automatische Rotation für einen Schlüssel
     */
    disableAutoRotation(keyId: string): Promise<void>;
    /**
     * Aktiviert automatische Rotation für einen Schlüssel
     */
    enableAutoRotation(keyId: string): Promise<void>;
    /**
     * Listet alle Schlüssel mit aktivierter Auto-Rotation
     */
    listAutoRotationKeys(tenantId?: string): Promise<Array<{
        keyId: string;
        tenantId: string;
        nextRotation: Date;
        intervalDays: number;
    }>>;
    /**
     * Gibt Statistiken über Rotationen zurück
     */
    getRotationStats(tenantId?: string): Promise<{
        totalScheduled: number;
        activeSchedules: number;
        upcomingRotations: number;
        overdueRotations: number;
    }>;
}
