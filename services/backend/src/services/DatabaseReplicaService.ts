 import { PrismaClient } from '@prisma/client';
import { DATABASE_REPLICA_CONFIG } from '../config/database.replicas';
import { logger } from '../utils/logger';

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

export class DatabaseReplicaService {
  private primaryClient: PrismaClient;
  private replicaClients: Map<string, PrismaClient> = new Map();
  private replicaHealth: Map<string, ReplicaHealth> = new Map();
  private currentReplicaIndex: number = 0;
  private routingRules: QueryRoutingRule[] = [];

  constructor(primaryClient: PrismaClient) {
    this.primaryClient = primaryClient;
    this.initializeReplicas();
    this.setupHealthChecks();
    this.setupRoutingRules();
  }

  /**
   * Initialisiert die Read-Replikas
   */
  private initializeReplicas(): void {
    try {
      for (const replicaConfig of DATABASE_REPLICA_CONFIG.replicas) {
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
        
        logger.info(`Initialized replica: ${replicaConfig.id}`);
      }
    } catch (error) {
      logger.error('Error initializing replicas', { error });
    }
  }

  /**
   * Richtet periodische Gesundheitschecks ein
   */
  private setupHealthChecks(): void {
    setInterval(() => {
      this.checkReplicaHealth();
    }, DATABASE_REPLICA_CONFIG.loadBalancing.healthCheckInterval);
  }

  /**
   * Prüft die Gesundheit aller Replikas
   */
  private async checkReplicaHealth(): Promise<void> {
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
      } catch (error: unknown) {
        logger.error(`Replica health check failed: ${replicaId}`, { error });
        
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
  private setupRoutingRules(): void {
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
  private selectHealthyReplica(): PrismaClient | null {
    const healthyReplicas = Array.from(this.replicaHealth.entries())
      .filter(([_, health]) => health.isHealthy)
      .map(([id, _]) => id);
    
    if (healthyReplicas.length === 0) {
      logger.warn('No healthy replicas available, falling back to primary');
      return null;
    }
    
    // Round-Robin Load-Balancing
    if (DATABASE_REPLICA_CONFIG.loadBalancing.strategy === 'round-robin') {
      const replicaId = healthyReplicas[this.currentReplicaIndex % healthyReplicas.length];
      this.currentReplicaIndex = (this.currentReplicaIndex + 1) % healthyReplicas.length;
      return this.replicaClients.get(replicaId) || null;
    }
    
    // Gewichtetes Load-Balancing
    if (DATABASE_REPLICA_CONFIG.loadBalancing.strategy === 'weighted') {
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
  shouldUseReplica(model: string, method: string): boolean {
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
  getClientForOperation(model: string, method: string): PrismaClient {
    // Prüfe, ob wir eine Replika verwenden sollen
    if (this.shouldUseReplica(model, method)) {
      const replicaClient = this.selectHealthyReplica();
      if (replicaClient) {
        logger.debug(`Routing ${model}.${method} to replica`);
        return replicaClient;
      }
    }
    
    // Fallback auf die primäre Datenbank
    logger.debug(`Routing ${model}.${method} to primary database`);
    return this.primaryClient;
  }

  /**
   * Holt den Gesundheitsstatus aller Replikas
   */
  getReplicaHealth(): ReplicaHealth[] {
    return Array.from(this.replicaHealth.values());
  }

  /**
   * Holt Statistiken über das Load-Balancing
   */
  getLoadBalancingStats(): {
    totalReplicas: number;
    healthyReplicas: number;
    currentStrategy: string;
    routingRules: number;
  } {
    const totalReplicas = this.replicaClients.size;
    const healthyReplicas = Array.from(this.replicaHealth.values())
      .filter(health => health.isHealthy).length;
    
    return {
      totalReplicas,
      healthyReplicas,
      currentStrategy: DATABASE_REPLICA_CONFIG.loadBalancing.strategy,
      routingRules: this.routingRules.length
    };
  }

  /**
   * Fügt eine neue Routing-Regel hinzu
   */
  addRoutingRule(rule: QueryRoutingRule): void {
    this.routingRules.push(rule);
    logger.info('Added new routing rule', { rule });
  }

  /**
   * Entfernt eine Routing-Regel
   */
  removeRoutingRule(rule: QueryRoutingRule): void {
    this.routingRules = this.routingRules.filter(r => 
      r.operation !== rule.operation ||
      r.model !== rule.model ||
      r.method !== rule.method
    );
    logger.info('Removed routing rule', { rule });
  }
}