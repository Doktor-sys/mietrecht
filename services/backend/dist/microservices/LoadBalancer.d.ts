import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ServiceRegistry } from './ServiceRegistry';
interface LoadBalancerConfig {
    strategy: 'round-robin' | 'least-connections' | 'weighted-round-robin';
    timeout: number;
    retryAttempts: number;
    circuitBreakerThreshold: number;
    circuitBreakerTimeout: number;
}
interface ServiceStats {
    connections: number;
    failures: number;
    lastFailure: Date | null;
    circuitBreakerOpen: boolean;
    circuitBreakerOpenedAt: Date | null;
}
export declare class LoadBalancer {
    private registry;
    private config;
    private serviceStats;
    private roundRobinIndex;
    constructor(registry: ServiceRegistry, config?: Partial<LoadBalancerConfig>);
    /**
     * Sendet eine Anfrage an einen verfügbaren Service
     */
    sendRequest(serviceName: string, requestOptions: Omit<AxiosRequestConfig, 'baseURL'>): Promise<AxiosResponse<any>>;
    /**
     * Sendet eine Anfrage mit Retry-Logik
     */
    private makeRequestWithRetry;
    /**
     * Prüft ob der Circuit Breaker offen ist
     */
    private isCircuitBreakerOpen;
    /**
     * Prüft ob der Circuit Breaker Threshold erreicht ist
     */
    private checkCircuitBreakerThreshold;
    /**
     * Setzt die Fehlerstatistiken zurück
     */
    private resetFailures;
    /**
     * Inkrementiert die Verbindungsstatistik
     */
    private incrementConnections;
    /**
     * Dekrementiert die Verbindungsstatistik
     */
    private decrementConnections;
    /**
     * Inkrementiert die Fehlerstatistik
     */
    private incrementFailures;
    /**
     * Implementiert Round-Robin Load Balancing
     */
    private getNextRoundRobinInstance;
    /**
     * Implementiert Least Connections Load Balancing
     */
    private getLeastConnectionsInstance;
    /**
     * Holt Statistiken für einen Service
     */
    getServiceStats(serviceName: string): ServiceStats | undefined;
    /**
     * Setzt alle Statistiken zurück
     */
    resetAllStats(): void;
    /**
     * Hilfsfunktion für Sleep
     */
    private sleep;
}
export {};
