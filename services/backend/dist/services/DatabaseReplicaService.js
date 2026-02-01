"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseReplicaService = void 0;
const database_replicas_1 = require("../config/database.replicas");
const logger_1 = require("../utils/logger");
class DatabaseReplicaService {
    constructor(primaryClient) {
        this.replicaClients = new Map();
        this.replicaHealth = new Map();
        this.currentReplicaIndex = 0;
        this.routingRules = [];
        this.primaryClient = primaryClient;
        this.initializeReplicas();
        this.setupHealthChecks();
        this.setupRoutingRules();
    }
    /**
     * Initialisiert die Read-Replikas
     */
    initializeReplicas() {
        try {
            for (const replicaConfig of database_replicas_1.DATABASE_REPLICA_CONFIG.replicas) {
                // In einer echten Implementierung würden wir hier separate Prisma-Clients
                // für jede Replika erstellen. Da dies ein Beispiel ist, verwenden wir
                // den primären Client für alle Replikas.
                this.replicaClients.set(replicaConfig.id, this.primaryClient);
                // Initialisiere den Gesundheitsstatus
                this.replicaHealth.set(replicaConfig.id, {
                    id: replicaConfig.id,
                    isHealthy: true,
                    lastCheck: new Date(),
                    responseTime: 0
                });
                logger_1.logger.info(`Initialized replica: ${replicaConfig.id}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error initializing replicas', { error });
        }
    }
    /**
     * Richtet periodische Gesundheitschecks ein
     */
    setupHealthChecks() {
        setInterval(() => {
            this.checkReplicaHealth();
        }, database_replicas_1.DATABASE_REPLICA_CONFIG.loadBalancing.healthCheckInterval);
    }
    /**
     * Prüft die Gesundheit aller Replikas
     */
    async checkReplicaHealth() {
        for (const [replicaId, client] of this.replicaClients) {
            try {
                const startTime = Date.now();
                // Führe eine einfache Abfrage durch, um die Gesundheit zu prüfen
                // In einer echten Implementierung würden wir hier eine echte
                // Gesundheitsprüfung der jeweiligen Replika durchführen
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                this.replicaHealth.set(replicaId, {
                    id: replicaId,
                    isHealthy: true,
                    lastCheck: new Date(),
                    responseTime
                });
            }
            catch (error) {
                logger_1.logger.error(`Replica health check failed: ${replicaId}`, { error });
                this.replicaHealth.set(replicaId, {
                    id: replicaId,
                    isHealthy: false,
                    lastCheck: new Date(),
                    responseTime: 0,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }
    /**
     * Richtet Routing-Regeln für Abfragen ein
     */
    setupRoutingRules() {
        // Standard-Regeln für das Routing von Abfragen
        this.routingRules = [
            // Alle find-Operationen gehen an Replikas
            { operation: 'read', model: '*', method: 'find*', useReplica: true },
            { operation: 'read', model: '*', method: 'count', useReplica: true },
            { operation: 'read', model: '*', method: 'aggregate', useReplica: true },
            // Alle write-Operationen gehen an die primäre Datenbank
            { operation: 'write', model: '*', method: 'create*', useReplica: false },
            { operation: 'write', model: '*', method: 'update*', useReplica: false },
            { operation: 'write', model: '*', method: 'delete*', useReplica: false }
        ];
    }
    /**
     * Wählt eine gesunde Replika basierend auf der Load-Balancing-Strategie
     */
    selectHealthyReplica() {
        const healthyReplicas = Array.from(this.replicaHealth.entries())
            .filter(([_, health]) => health.isHealthy)
            .map(([id, _]) => id);
        if (healthyReplicas.length === 0) {
            logger_1.logger.warn('No healthy replicas available, falling back to primary');
            return null;
        }
        // Round-Robin Load-Balancing
        if (database_replicas_1.DATABASE_REPLICA_CONFIG.loadBalancing.strategy === 'round-robin') {
            const replicaId = healthyReplicas[this.currentReplicaIndex % healthyReplicas.length];
            this.currentReplicaIndex = (this.currentReplicaIndex + 1) % healthyReplicas.length;
            return this.replicaClients.get(replicaId) || null;
        }
        // Gewichtetes Load-Balancing
        if (database_replicas_1.DATABASE_REPLICA_CONFIG.loadBalancing.strategy === 'weighted') {
            // Vereinfachte Implementierung - in der Realität würden wir die Gewichtung berücksichtigen
            const randomIndex = Math.floor(Math.random() * healthyReplicas.length);
            const replicaId = healthyReplicas[randomIndex];
            return this.replicaClients.get(replicaId) || null;
        }
        // Fallback auf die erste gesunde Replika
        const replicaId = healthyReplicas[0];
        return this.replicaClients.get(replicaId) || null;
    }
    /**
     * Bestimmt, ob eine Abfrage an eine Replika geleitet werden soll
     */
    shouldUseReplica(model, method) {
        // Prüfe spezifische Routing-Regeln
        for (const rule of this.routingRules) {
            // Prüfe, ob die Regel auf das Modell und die Methode passt
            const modelMatch = rule.model === '*' || rule.model === model;
            const methodMatch = rule.method === '*' ||
                (rule.method.endsWith('*') && method.startsWith(rule.method.slice(0, -1))) ||
                rule.method === method;
            if (modelMatch && methodMatch) {
                return rule.useReplica;
            }
        }
        // Standardverhalten: Leseoperationen an Replikas
        return method.startsWith('find') || method === 'count' || method === 'aggregate';
    }
    /**
     * Holt den geeigneten Datenbank-Client für eine Operation
     */
    getClientForOperation(model, method) {
        // Prüfe, ob wir eine Replika verwenden sollen
        if (this.shouldUseReplica(model, method)) {
            const replicaClient = this.selectHealthyReplica();
            if (replicaClient) {
                logger_1.logger.debug(`Routing ${model}.${method} to replica`);
                return replicaClient;
            }
        }
        // Fallback auf die primäre Datenbank
        logger_1.logger.debug(`Routing ${model}.${method} to primary database`);
        return this.primaryClient;
    }
    /**
     * Holt den Gesundheitsstatus aller Replikas
     */
    getReplicaHealth() {
        return Array.from(this.replicaHealth.values());
    }
    /**
     * Holt Statistiken über das Load-Balancing
     */
    getLoadBalancingStats() {
        const totalReplicas = this.replicaClients.size;
        const healthyReplicas = Array.from(this.replicaHealth.values())
            .filter(health => health.isHealthy).length;
        return {
            totalReplicas,
            healthyReplicas,
            currentStrategy: database_replicas_1.DATABASE_REPLICA_CONFIG.loadBalancing.strategy,
            routingRules: this.routingRules.length
        };
    }
    /**
     * Fügt eine neue Routing-Regel hinzu
     */
    addRoutingRule(rule) {
        this.routingRules.push(rule);
        logger_1.logger.info('Added new routing rule', { rule });
    }
    /**
     * Entfernt eine Routing-Regel
     */
    removeRoutingRule(rule) {
        this.routingRules = this.routingRules.filter(r => r.operation !== rule.operation ||
            r.model !== rule.model ||
            r.method !== rule.method);
        logger_1.logger.info('Removed routing rule', { rule });
    }
}
exports.DatabaseReplicaService = DatabaseReplicaService;
