import { PrismaClient } from '@prisma/client';
interface ReplicaHealth {
    id: string;
    isHealthy: boolean;
    lastCheck: Date;
    responseTime: number;
    error?: string;
}
interface QueryRoutingRule {
    operation: 'read' | 'write';
    model: string;
    method: string;
    useReplica: boolean;
}
export declare class DatabaseReplicaService {
    private primaryClient;
    private replicaClients;
    private replicaHealth;
    private currentReplicaIndex;
    private routingRules;
    constructor(primaryClient: PrismaClient);
    /**
     * Initialisiert die Read-Replikas
     */
    private initializeReplicas;
    /**
     * Richtet periodische Gesundheitschecks ein
     */
    private setupHealthChecks;
    /**
     * Prüft die Gesundheit aller Replikas
     */
    private checkReplicaHealth;
    /**
     * Richtet Routing-Regeln für Abfragen ein
     */
    private setupRoutingRules;
    /**
     * Wählt eine gesunde Replika basierend auf der Load-Balancing-Strategie
     */
    private selectHealthyReplica;
    /**
     * Bestimmt, ob eine Abfrage an eine Replika geleitet werden soll
     */
    shouldUseReplica(model: string, method: string): boolean;
    /**
     * Holt den geeigneten Datenbank-Client für eine Operation
     */
    getClientForOperation(model: string, method: string): PrismaClient;
    /**
     * Holt den Gesundheitsstatus aller Replikas
     */
    getReplicaHealth(): ReplicaHealth[];
    /**
     * Holt Statistiken über das Load-Balancing
     */
    getLoadBalancingStats(): {
        totalReplicas: number;
        healthyReplicas: number;
        currentStrategy: string;
        routingRules: number;
    };
    /**
     * Fügt eine neue Routing-Regel hinzu
     */
    addRoutingRule(rule: QueryRoutingRule): void;
    /**
     * Entfernt eine Routing-Regel
     */
    removeRoutingRule(rule: QueryRoutingRule): void;
}
export {};
