interface LoadTestConfig {
    targetUrl: string;
    concurrency: number;
    requestsPerSecond: number;
    duration: number;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    payload?: any;
    headers?: Record<string, string>;
}
interface TestResult {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    throughput: number;
    errorRate: number;
    startTime: Date;
    endTime: Date;
}
export declare class LoadTestRunner {
    private performanceMonitor;
    private isRunning;
    private results;
    private requestMetrics;
    constructor();
    /**
     * Führt einen Lasttest aus
     */
    runLoadTest(config: LoadTestConfig): Promise<TestResult>;
    /**
     * Führt einen Worker für den Lasttest aus
     */
    private runWorker;
    /**
     * Verzögerungsfunktion
     */
    private delay;
    /**
     * Führt einen Stresstest aus
     */
    runStressTest(baseUrl: string, maxConcurrency: number, stepSize?: number): Promise<TestResult[]>;
    /**
     * Führt einen Spike-Test aus
     */
    runSpikeTest(baseUrl: string, baselineConcurrency: number, spikeConcurrency: number, spikeDuration?: number): Promise<TestResult[]>;
    /**
     * Generiert einen Lasttest-Bericht
     */
    generateReport(): string;
    /**
     * Holt die Testergebnisse
     */
    getResults(): TestResult[];
    /**
     * Löscht die Testergebnisse
     */
    clearResults(): void;
    /**
     * Prüft, ob ein Test läuft
     */
    isTestRunning(): boolean;
}
export {};
