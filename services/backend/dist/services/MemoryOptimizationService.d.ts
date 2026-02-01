/**
 * Memory Optimization Service
 * Provides advanced memory monitoring, optimization, and management capabilities
 */
export declare class MemoryOptimizationService {
    private static instance;
    private monitoringInterval;
    private gcInterval;
    private isMonitoring;
    private memoryThreshold;
    private gcThreshold;
    private monitoringIntervalMs;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): MemoryOptimizationService;
    /**
     * Start memory monitoring
     */
    startMonitoring(): void;
    /**
     * Stop memory monitoring
     */
    stopMonitoring(): void;
    /**
     * Check current memory usage and trigger optimizations if needed
     */
    private checkMemoryUsage;
    /**
     * Perform garbage collection if available
     */
    private performGarbageCollection;
    /**
     * Optimize memory usage by clearing caches and other optimizations
     */
    private optimizeMemory;
    /**
     * Clear application caches to free memory
     */
    private clearApplicationCaches;
    /**
     * Optimize Redis cache usage
     */
    private optimizeRedisCache;
    /**
     * Parse Redis memory string to MB
     */
    private parseMemoryString;
    /**
     * Get current memory usage statistics
     */
    getMemoryStats(): Promise<{
        process: NodeJS.MemoryUsage;
        heapUsedMB: number;
        heapTotalMB: number;
        rssMB: number;
        externalMB: number;
        isMonitoring: boolean;
    }>;
    /**
     * Force immediate memory optimization
     */
    forceOptimization(): Promise<void>;
    /**
     * Configure memory thresholds
     */
    configureThresholds(memoryThresholdMB: number, gcThresholdMB: number): void;
    /**
     * Configure monitoring interval
     */
    configureMonitoringInterval(intervalMs: number): void;
}
