interface ServerInstance {
    id: string;
    host: string;
    port: number;
    weight: number;
    isHealthy: boolean;
    lastHealthCheck: Date;
    responseTime: number;
    currentLoad: number;
    maxLoad: number;
}
interface LoadBalancingConfig {
    strategy: 'round-robin' | 'weighted' | 'least-connections' | 'response-time';
    healthCheckInterval: number;
    failoverTimeout: number;
    maxRetries: number;
}
export declare class LoadBalancer {
    private static instance;
    private servers;
    private config;
    private currentIndex;
    private requestMetrics;
    private healthCheckTimer;
    private constructor();
    static getInstance(config?: Partial<LoadBalancingConfig>): LoadBalancer;
    /**
     * Fügt eine Server-Instanz hinzu
     */
    addServer(server: Omit<ServerInstance, 'isHealthy' | 'lastHealthCheck' | 'responseTime' | 'currentLoad'>): void;
    /**
     * Entfernt eine Server-Instanz
     */
    removeServer(serverId: string): void;
    /**
     * Wählt einen Server basierend auf der Load-Balancing-Strategie
     */
    selectServer(): ServerInstance | null;
    /**
     * Wählt einen Server mittels Round-Robin
     */
    private selectRoundRobin;
    /**
     * Wählt einen Server basierend auf Gewichtung
     */
    private selectWeighted;
    /**
     * Wählt den Server mit den wenigsten Verbindungen
     */
    private selectLeastConnections;
    /**
     * Wählt den Server mit der besten Antwortzeit
     */
    private selectByResponseTime;
    /**
     * Aktualisiert die Metriken für einen Server
     */
    updateServerMetrics(serverId: string, responseTime: number, success: boolean): void;
    /**
     * Aktualisiert die aktuelle Last eines Servers
     */
    updateServerLoad(serverId: string, currentLoad: number): void;
    /**
     * Führt periodische Gesundheitschecks durch
     */
    private startHealthChecks;
    /**
     * Führt Gesundheitschecks für alle Server durch
     */
    private performHealthChecks;
    /**
     * Prüft die Gesundheit eines Servers
     */
    private checkServerHealth;
    /**
     * Holt den Gesundheitsstatus aller Server
     */
    getServerHealth(): Array<{
        id: string;
        isHealthy: boolean;
        responseTime: number;
    }>;
    /**
     * Holt Load-Balancing-Statistiken
     */
    getStats(): {
        totalServers: number;
        healthyServers: number;
        currentStrategy: string;
        requestMetrics: number;
    };
    /**
     * Ändert die Load-Balancing-Strategie
     */
    setStrategy(strategy: LoadBalancingConfig['strategy']): void;
    /**
     * Stoppt die periodischen Gesundheitschecks
     */
    stopHealthChecks(): void;
    /**
     * Schließt den Load-Balancer
     */
    close(): void;
}
export {};
