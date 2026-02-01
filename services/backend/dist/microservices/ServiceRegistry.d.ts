interface ServiceInstance {
    id: string;
    name: string;
    host: string;
    port: number;
    status: 'healthy' | 'unhealthy' | 'starting';
    lastHeartbeat: Date;
    metadata: Record<string, any>;
}
interface ServiceHealth {
    serviceName: string;
    instances: ServiceInstance[];
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
}
export declare class ServiceRegistry {
    private services;
    private healthChecks;
    private heartbeatInterval;
    constructor();
    /**
     * Registriert einen neuen Service
     */
    registerService(service: Omit<ServiceInstance, 'id' | 'lastHeartbeat' | 'status'>): string;
    /**
     * Deregistriert einen Service
     */
    unregisterService(serviceName: string, serviceId: string): boolean;
    /**
     * Aktualisiert den Heartbeat eines Services
     */
    updateHeartbeat(serviceName: string, serviceId: string): boolean;
    /**
     * Ruft einen gesunden Service-Endpunkt ab
     */
    getHealthyService(serviceName: string): ServiceInstance | null;
    /**
     * Ruft alle Instanzen eines Services ab
     */
    getAllInstances(serviceName: string): ServiceInstance[];
    /**
     * Ruft den Gesundheitsstatus aller Services ab
     */
    getHealthStatus(): ServiceHealth[];
    /**
     * Markiert einen Service als ungesund
     */
    markUnhealthy(serviceName: string, serviceId: string): boolean;
    /**
     * Fügt einen Health Check für einen Service hinzu
     */
    addHealthCheck(serviceName: string, check: () => Promise<boolean>): void;
    /**
     * Führt alle Health Checks aus
     */
    runHealthChecks(): Promise<void>;
    /**
     * Startet periodische Health Checks
     */
    startHealthChecks(intervalMs?: number): void;
    /**
     * Stoppt periodische Health Checks
     */
    stopHealthChecks(): void;
    /**
     * Bereinigt alte, inaktive Services
     */
    cleanupInactiveServices(maxAgeMs?: number): void;
    /**
     * Startet periodische Bereinigung
     */
    startCleanup(intervalMs?: number): NodeJS.Timeout;
}
export {};
