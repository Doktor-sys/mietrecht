import { PrismaClient } from '@prisma/client';
import { AuditService, AuditLogEntry, QueryLogsOptions, AnomalyDetectionResult } from './AuditService';
export interface EnhancedAuditLogEntry extends AuditLogEntry {
    previousHash: string;
    blockHash: string;
    blockHeight: number;
}
export interface AuditChainBlock {
    height: number;
    hash: string;
    previousHash: string;
    timestamp: Date;
    logEntries: EnhancedAuditLogEntry[];
    merkleRoot: string;
}
export interface AuditVerificationResult {
    isValid: boolean;
    message: string;
    invalidBlocks?: number[];
    invalidEntries?: string[];
}
export declare class EnhancedAuditService extends AuditService {
    private prismaClient;
    private hmacKey;
    private chainHead;
    private chainHeight;
    constructor(prisma: PrismaClient, hmacKey: string);
    /**
     * Erstellt einen erweiterten Audit-Log-Eintrag mit Blockchain-ähnlicher Integrität
     */
    logEnhancedEvent(eventType: string, userId: string | undefined, tenantId: string | undefined, resourceType: string | undefined, resourceId: string | undefined, action: string, result: string, ipAddress?: string, userAgent?: string, metadata?: any): Promise<EnhancedAuditLogEntry>;
    /**
     * Erstellt einen neuen Block in der Audit-Kette
     */
    createAuditBlock(): Promise<AuditChainBlock>;
    /**
     * Verifiziert die Integrität der Audit-Kette
     */
    verifyAuditChain(): Promise<AuditVerificationResult>;
    /**
     * Berechnet den HMAC für einen Log-Eintrag
     */
    private calculateHMAC;
    /**
     * Berechnet den Hash für einen Log-Eintrag
     */
    private calculateEntryHash;
    /**
     * Berechnet den Hash für einen Block
     */
    private calculateBlockHash;
    /**
     * Berechnet den Merkle Root für eine Liste von Einträgen
     */
    private calculateMerkleRoot;
    /**
     * Gibt den neuesten Audit-Eintrag zurück
     */
    private getLatestAuditEntry;
    /**
     * Erweiterte Anomalie-Erkennung mit Blockchain-Integrität
     */
    detectEnhancedAnomalies(startDate: Date, endDate: Date, tenantId?: string): Promise<AnomalyDetectionResult[]>;
    /**
     * Abfrage erweiterter Audit-Logs
     */
    queryEnhancedLogs(options: QueryLogsOptions & {
        blockHeight?: number;
        minBlockHeight?: number;
        maxBlockHeight?: number;
    }): Promise<EnhancedAuditLogEntry[]>;
}
