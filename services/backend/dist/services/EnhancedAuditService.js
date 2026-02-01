"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedAuditService = void 0;
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
const AuditService_1 = require("./AuditService");
class EnhancedAuditService extends AuditService_1.AuditService {
    constructor(prisma, hmacKey) {
        super(prisma);
        this.prismaClient = prisma;
        this.hmacKey = hmacKey;
        this.chainHead = '';
        this.chainHeight = 0;
    }
    /**
     * Erstellt einen erweiterten Audit-Log-Eintrag mit Blockchain-ähnlicher Integrität
     */
    async logEnhancedEvent(eventType, userId, tenantId, resourceType, resourceId, action, result, ipAddress, userAgent, metadata) {
        try {
            // Generiere einen eindeutigen ID
            const id = `enhanced_audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Erstelle den Basis-Log-Eintrag
            const baseEntry = {
                id,
                timestamp: new Date(),
                eventType,
                userId: userId || undefined,
                tenantId: tenantId || undefined,
                resourceType: resourceType || undefined,
                resourceId: resourceId || undefined,
                action,
                result,
                ipAddress: ipAddress || undefined,
                userAgent: userAgent || undefined,
                metadata: metadata || {},
                hmacSignature: ''
            };
            // Berechne den HMAC für Integrität
            baseEntry.hmacSignature = this.calculateHMAC(baseEntry);
            // Hole den vorherigen Hash (letzter Eintrag in der Kette)
            const previousEntry = await this.getLatestAuditEntry();
            const previousHash = previousEntry ? this.calculateEntryHash(previousEntry) : '';
            // Erstelle den erweiterten Eintrag
            const enhancedEntry = {
                ...baseEntry,
                previousHash,
                blockHash: '', // Wird beim Block-Erstellung gesetzt
                blockHeight: 0 // Wird beim Block-Erstellung gesetzt
            };
            // TODO: Speichere den Eintrag in der Datenbank (wird aktiviert, sobald die DB verfügbar ist)
            /*
            await this.prismaClient.enhancedAuditLog.create({
              data: {
                id: enhancedEntry.id,
                timestamp: enhancedEntry.timestamp,
                eventType: enhancedEntry.eventType,
                userId: enhancedEntry.userId,
                tenantId: enhancedEntry.tenantId,
                resourceType: enhancedEntry.resourceType,
                resourceId: enhancedEntry.resourceId,
                action: enhancedEntry.action,
                result: enhancedEntry.result,
                ipAddress: enhancedEntry.ipAddress,
                userAgent: enhancedEntry.userAgent,
                metadata: enhancedEntry.metadata,
                hmacSignature: enhancedEntry.hmacSignature,
                previousHash: enhancedEntry.previousHash,
                blockHash: enhancedEntry.blockHash,
                blockHeight: enhancedEntry.blockHeight
              }
            });
            */
            logger_1.logger.info(`Created enhanced audit log entry ${id} for event ${eventType}`);
            return enhancedEntry;
        }
        catch (error) {
            logger_1.logger.error('Failed to create enhanced audit log entry:', error);
            throw error;
        }
    }
    /**
     * Erstellt einen neuen Block in der Audit-Kette
     */
    async createAuditBlock() {
        try {
            // TODO: Hole alle noch nicht geblockten Einträge (wird aktiviert, sobald die DB verfügbar ist)
            /*
            const unblockedEntries = await this.prismaClient.enhancedAuditLog.findMany({
              where: {
                blockHeight: 0
              },
              orderBy: {
                timestamp: 'asc'
              }
            });
            */
            // Simuliere leere Ergebnisse für jetzt
            const unblockedEntries = [];
            if (unblockedEntries.length === 0) {
                throw new Error('No unblocked entries found');
            }
            // Erhöhe die Blockhöhe
            this.chainHeight++;
            // Berechne den Merkle Root
            const merkleRoot = this.calculateMerkleRoot(unblockedEntries);
            // Erstelle den Block
            const block = {
                height: this.chainHeight,
                hash: '',
                previousHash: this.chainHead,
                timestamp: new Date(),
                logEntries: unblockedEntries,
                merkleRoot
            };
            // Berechne den Block-Hash
            block.hash = this.calculateBlockHash(block);
            // TODO: Aktualisiere die Einträge mit Block-Informationen (wird aktiviert, sobald die DB verfügbar ist)
            /*
            for (const entry of unblockedEntries) {
              await this.prismaClient.enhancedAuditLog.update({
                where: { id: entry.id },
                data: {
                  blockHash: block.hash,
                  blockHeight: this.chainHeight
                }
              });
            }
            */
            // Aktualisiere den Chain-Head
            this.chainHead = block.hash;
            // Speichere den Block-Metadata (in einer echten Implementierung würde man das in einer separaten Tabelle speichern)
            logger_1.logger.info(`Created audit block ${block.height} with ${unblockedEntries.length} entries`);
            return block;
        }
        catch (error) {
            logger_1.logger.error('Failed to create audit block:', error);
            throw error;
        }
    }
    /**
     * Verifiziert die Integrität der Audit-Kette
     */
    async verifyAuditChain() {
        try {
            const result = {
                isValid: true,
                message: 'Audit chain is valid'
            };
            // TODO: Hole alle Einträge geordnet nach Blockhöhe und Timestamp (wird aktiviert, sobald die DB verfügbar ist)
            /*
            const allEntries = await this.prismaClient.enhancedAuditLog.findMany({
              orderBy: [
                { blockHeight: 'asc' },
                { timestamp: 'asc' }
              ]
            });
            */
            // Simuliere leere Ergebnisse für jetzt
            const allEntries = [];
            if (allEntries.length === 0) {
                return {
                    isValid: true,
                    message: 'No audit entries found'
                };
            }
            let previousHash = '';
            let currentBlockHeight = 0;
            let currentBlockHash = '';
            const invalidBlocks = [];
            const invalidEntries = [];
            for (const entry of allEntries) {
                // Verifiziere den HMAC
                const calculatedHMAC = this.calculateHMAC(entry);
                if (calculatedHMAC !== entry.hmacSignature) {
                    invalidEntries.push(entry.id);
                    result.isValid = false;
                    result.message = 'HMAC verification failed for one or more entries';
                }
                // Verifiziere den Previous Hash (für den ersten Eintrag in einem Block)
                if (entry.blockHeight > currentBlockHeight) {
                    // Neuer Block
                    currentBlockHeight = entry.blockHeight;
                    currentBlockHash = entry.blockHash;
                    if (entry.previousHash !== previousHash) {
                        invalidBlocks.push(currentBlockHeight);
                        result.isValid = false;
                        result.message = 'Previous hash mismatch in block ' + currentBlockHeight;
                    }
                }
                // Verifiziere den Previous Hash (für nachfolgende Einträge im gleichen Block)
                if (entry.blockHeight === currentBlockHeight && entry.previousHash !== previousHash) {
                    invalidEntries.push(entry.id);
                    result.isValid = false;
                    result.message = 'Previous hash mismatch for entry ' + entry.id;
                }
                // Aktualisiere den Previous Hash für den nächsten Eintrag
                previousHash = this.calculateEntryHash(entry);
            }
            if (invalidBlocks.length > 0) {
                result.invalidBlocks = invalidBlocks;
            }
            if (invalidEntries.length > 0) {
                result.invalidEntries = invalidEntries;
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to verify audit chain:', error);
            return {
                isValid: false,
                message: 'Verification failed due to error: ' + (error.message || 'Unknown error')
            };
        }
    }
    /**
     * Berechnet den HMAC für einen Log-Eintrag
     */
    calculateHMAC(entry) {
        const data = JSON.stringify({
            id: entry.id,
            timestamp: entry.timestamp,
            eventType: entry.eventType,
            userId: entry.userId,
            tenantId: entry.tenantId,
            resourceType: entry.resourceType,
            resourceId: entry.resourceId,
            action: entry.action,
            result: entry.result,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            metadata: entry.metadata
        });
        return crypto_1.default
            .createHmac('sha256', this.hmacKey)
            .update(data)
            .digest('hex');
    }
    /**
     * Berechnet den Hash für einen Log-Eintrag
     */
    calculateEntryHash(entry) {
        const data = JSON.stringify({
            id: entry.id,
            timestamp: entry.timestamp,
            eventType: entry.eventType,
            userId: entry.userId,
            tenantId: entry.tenantId,
            resourceType: entry.resourceType,
            resourceId: entry.resourceId,
            action: entry.action,
            result: entry.result,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            metadata: entry.metadata,
            hmacSignature: entry.hmacSignature
        });
        return crypto_1.default
            .createHash('sha256')
            .update(data)
            .digest('hex');
    }
    /**
     * Berechnet den Hash für einen Block
     */
    calculateBlockHash(block) {
        const data = JSON.stringify({
            height: block.height,
            previousHash: block.previousHash,
            timestamp: block.timestamp,
            merkleRoot: block.merkleRoot
        });
        return crypto_1.default
            .createHash('sha256')
            .update(data)
            .digest('hex');
    }
    /**
     * Berechnet den Merkle Root für eine Liste von Einträgen
     */
    calculateMerkleRoot(entries) {
        if (entries.length === 0) {
            return '';
        }
        // Konvertiere alle Einträge in ihre Hashes
        let hashes = entries.map(entry => this.calculateEntryHash(entry));
        // Iteriere bis nur noch ein Hash übrig bleibt
        while (hashes.length > 1) {
            const newHashes = [];
            // Kombiniere Paare von Hashes
            for (let i = 0; i < hashes.length; i += 2) {
                const left = hashes[i];
                const right = i + 1 < hashes.length ? hashes[i + 1] : left; // Dupliziere den letzten Hash wenn ungerade Anzahl
                const combined = left + right;
                const hash = crypto_1.default
                    .createHash('sha256')
                    .update(combined)
                    .digest('hex');
                newHashes.push(hash);
            }
            hashes = newHashes;
        }
        return hashes[0];
    }
    /**
     * Gibt den neuesten Audit-Eintrag zurück
     */
    async getLatestAuditEntry() {
        try {
            // TODO: Hole den neuesten Eintrag (wird aktiviert, sobald die DB verfügbar ist)
            /*
            const entry = await this.prismaClient.enhancedAuditLog.findFirst({
              orderBy: {
                timestamp: 'desc'
              }
            });
      
            return entry as EnhancedAuditLogEntry | null;
            */
            // Simuliere null für jetzt
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get latest audit entry:', error);
            return null;
        }
    }
    /**
     * Erweiterte Anomalie-Erkennung mit Blockchain-Integrität
     */
    async detectEnhancedAnomalies(startDate, endDate, tenantId) {
        try {
            // Führe zunächst die Standard-Anomalie-Erkennung durch
            const standardAnomalies = await this.detectAnomalies(undefined, undefined, 60); // Use default 60 minutes
            // Verifiziere die Audit-Kette
            const chainVerification = await this.verifyAuditChain();
            // Wenn die Kette nicht valide ist, füge dies als Anomalie hinzu
            if (!chainVerification.isValid) {
                standardAnomalies.push({
                    isAnomalous: true,
                    anomalyType: 'audit_chain_integrity_violation',
                    severity: 'critical',
                    description: `Audit chain integrity violation: ${chainVerification.message}`,
                    timestamp: new Date()
                });
            }
            return standardAnomalies;
        }
        catch (error) {
            logger_1.logger.error('Failed to detect enhanced anomalies:', error);
            return [];
        }
    }
    /**
     * Abfrage erweiterter Audit-Logs
     */
    async queryEnhancedLogs(options) {
        try {
            const { startDate, endDate, tenantId, limit = 100, offset = 0, blockHeight, minBlockHeight, maxBlockHeight } = options;
            const where = {
                ...(startDate && { timestamp: { gte: startDate } }),
                ...(endDate && { timestamp: { lte: endDate } }),
                ...(tenantId && { tenantId }),
                ...(blockHeight !== undefined && { blockHeight }),
                ...(minBlockHeight !== undefined && { blockHeight: { gte: minBlockHeight } }),
                ...(maxBlockHeight !== undefined && { blockHeight: { lte: maxBlockHeight } })
            };
            // TODO: Frage die erweiterten Logs ab (wird aktiviert, sobald die DB verfügbar ist)
            /*
            const logs = await this.prismaClient.enhancedAuditLog.findMany({
              where,
              take: limit,
              skip: offset,
              orderBy: {
                timestamp: 'desc'
              }
            });
            */
            // Simuliere leere Ergebnisse für jetzt
            const logs = [];
            return logs.map((log) => ({
                id: log.id,
                timestamp: log.timestamp,
                eventType: log.eventType,
                userId: log.userId || undefined,
                tenantId: log.tenantId || undefined,
                resourceType: log.resourceType || undefined,
                resourceId: log.resourceId || undefined,
                action: log.action,
                result: log.result,
                ipAddress: log.ipAddress || undefined,
                userAgent: log.userAgent || undefined,
                metadata: log.metadata,
                hmacSignature: log.hmacSignature,
                previousHash: log.previousHash,
                blockHash: log.blockHash,
                blockHeight: log.blockHeight
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to query enhanced audit logs:', error);
            throw new Error('Failed to query enhanced audit logs');
        }
    }
}
exports.EnhancedAuditService = EnhancedAuditService;
