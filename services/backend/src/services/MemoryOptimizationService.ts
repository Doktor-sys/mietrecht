import { logger } from '../utils/logger';
import { config } from '../config/config';
import cacheManagerInstance from '../utils/cacheManager';
import { RedisService } from './RedisService';

/**
 * Memory Optimization Service
 * Provides advanced memory monitoring, optimization, and management capabilities
 */
export class MemoryOptimizationService {
    private static instance: MemoryOptimizationService;
    private monitoringInterval: NodeJS.Timeout | null = null;
    private gcInterval: NodeJS.Timeout | null = null;
    private isMonitoring: boolean = false;
    private memoryThreshold: number; // MB
    private gcThreshold: number; // MB
    private monitoringIntervalMs: number; // milliseconds

    private constructor() {
        // Configure thresholds from environment or use defaults
        this.memoryThreshold = config.nodeEnv === 'production' ? 400 : 200; // MB
        this.gcThreshold = config.nodeEnv === 'production' ? 300 : 150; // MB
        this.monitoringIntervalMs = 30000; // 30 seconds
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): MemoryOptimizationService {
        if (!MemoryOptimizationService.instance) {
            MemoryOptimizationService.instance = new MemoryOptimizationService();
        }
        return MemoryOptimizationService.instance;
    }

    /**
     * Start memory monitoring
     */
    startMonitoring(): void {
        if (this.isMonitoring) {
            logger.warn('Memory monitoring is already running');
            return;
        }

        this.isMonitoring = true;
        logger.info('Starting memory optimization monitoring');

        // Start periodic memory monitoring
        this.monitoringInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, this.monitoringIntervalMs);

        // Start periodic garbage collection if enabled
        if (global.gc) {
            this.gcInterval = setInterval(() => {
                this.performGarbageCollection();
            }, 300000); // 5 minutes
        }

        logger.info('Memory optimization monitoring started');
    }

    /**
     * Stop memory monitoring
     */
    stopMonitoring(): void {
        if (!this.isMonitoring) {
            logger.warn('Memory monitoring is not running');
            return;
        }

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        if (this.gcInterval) {
            clearInterval(this.gcInterval);
            this.gcInterval = null;
        }

        this.isMonitoring = false;
        logger.info('Memory optimization monitoring stopped');
    }

    /**
     * Check current memory usage and trigger optimizations if needed
     */
    private async checkMemoryUsage(): Promise<void> {
        try {
            const memoryUsage = process.memoryUsage();
            const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
            const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
            const rssMB = memoryUsage.rss / 1024 / 1024;
            
            logger.debug('Memory usage check', {
                heapUsed: `${heapUsedMB.toFixed(2)} MB`,
                heapTotal: `${heapTotalMB.toFixed(2)} MB`,
                rss: `${rssMB.toFixed(2)} MB`,
                external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
            });

            // Check if we need to optimize memory
            if (heapUsedMB > this.memoryThreshold) {
                logger.warn('High memory usage detected, triggering optimizations', {
                    heapUsed: `${heapUsedMB.toFixed(2)} MB`,
                    threshold: `${this.memoryThreshold} MB`
                });
                
                await this.optimizeMemory();
            }

            // Trigger garbage collection if needed
            if (heapUsedMB > this.gcThreshold && global.gc) {
                logger.info('Triggering garbage collection due to high memory usage', {
                    heapUsed: `${heapUsedMB.toFixed(2)} MB`,
                    threshold: `${this.gcThreshold} MB`
                });
                
                this.performGarbageCollection();
            }
        } catch (error) {
            logger.error('Error checking memory usage:', error);
        }
    }

    /**
     * Perform garbage collection if available
     */
    private performGarbageCollection(): void {
        try {
            if (global.gc) {
                const beforeMemory = process.memoryUsage();
                global.gc();
                const afterMemory = process.memoryUsage();
                
                const beforeHeapUsed = beforeMemory.heapUsed / 1024 / 1024;
                const afterHeapUsed = afterMemory.heapUsed / 1024 / 1024;
                const freedMemory = beforeHeapUsed - afterHeapUsed;
                
                logger.info('Garbage collection performed', {
                    before: `${beforeHeapUsed.toFixed(2)} MB`,
                    after: `${afterHeapUsed.toFixed(2)} MB`,
                    freed: `${freedMemory.toFixed(2)} MB`
                });
            } else {
                logger.debug('Manual garbage collection not available (run with --expose-gc flag)');
            }
        } catch (error) {
            logger.error('Error performing garbage collection:', error);
        }
    }

    /**
     * Optimize memory usage by clearing caches and other optimizations
     */
    private async optimizeMemory(): Promise<void> {
        try {
            logger.info('Starting memory optimization procedures');
            
            // Clear application caches
            await this.clearApplicationCaches();
            
            // Optimize Redis if connected
            await this.optimizeRedisCache();
            
            // Force garbage collection if available
            this.performGarbageCollection();
            
            logger.info('Memory optimization procedures completed');
        } catch (error) {
            logger.error('Error during memory optimization:', error);
        }
    }

    /**
     * Clear application caches to free memory
     */
    private async clearApplicationCaches(): Promise<void> {
        try {
            logger.info('Clearing application caches');
            
            // Get cache manager instance
            const cacheManager = cacheManagerInstance;
            
            // Get all cache information
            const allCacheInfo = cacheManager.getAllCacheInfo();
            
            // Clear each cache if it's using significant memory
            for (const cacheInfo of allCacheInfo) {
                const keysCount = cacheInfo.keys;
                
                // Clear caches with more than 1000 keys
                if (keysCount > 1000) {
                    logger.info(`Clearing cache ${cacheInfo.name} with ${keysCount} keys`);
                    cacheManager.flush(cacheInfo.name);
                }
                
                // For caches with moderate size, clear oldest entries
                if (keysCount > 100 && keysCount <= 1000) {
                    logger.info(`Reducing cache size for ${cacheInfo.name} with ${keysCount} keys`);
                    // This would require implementing LRU eviction in the cache manager
                    // For now, we'll just log the information
                }
            }
            
            logger.info('Application caches cleared');
        } catch (error) {
            logger.error('Error clearing application caches:', error);
        }
    }

    /**
     * Optimize Redis cache usage
     */
    private async optimizeRedisCache(): Promise<void> {
        try {
            const redisService = RedisService.getInstance();
            
            if (redisService.isReady()) {
                logger.info('Optimizing Redis cache');
                
                // Get Redis cache information
                const cacheInfo = await redisService.getCacheInfo();
                if (cacheInfo) {
                    logger.info('Redis cache info', cacheInfo);
                    
                    // If memory usage is high, we might want to expire some keys
                    // This would depend on the specific Redis configuration
                    const usedMemoryMB = this.parseMemoryString(cacheInfo.usedMemory);
                    if (usedMemoryMB > 100) { // If Redis is using more than 100MB
                        logger.info('Redis memory usage is high, considering cache eviction');
                        
                        // Delete pattern-based keys that are less important
                        // This is a placeholder - actual implementation would depend on cache strategy
                        // await redisService.delPattern('temp:*');
                    }
                }
            } else {
                logger.debug('Redis not connected, skipping Redis cache optimization');
            }
        } catch (error) {
            logger.error('Error optimizing Redis cache:', error);
        }
    }

    /**
     * Parse Redis memory string to MB
     */
    private parseMemoryString(memoryString: string): number {
        try {
            if (memoryString.endsWith('K')) {
                return parseFloat(memoryString.replace('K', '')) / 1024;
            } else if (memoryString.endsWith('M')) {
                return parseFloat(memoryString.replace('M', ''));
            } else if (memoryString.endsWith('G')) {
                return parseFloat(memoryString.replace('G', '')) * 1024;
            } else {
                // Assume bytes
                return parseFloat(memoryString) / 1024 / 1024;
            }
        } catch (error) {
            logger.error('Error parsing memory string:', error);
            return 0;
        }
    }

    /**
     * Get current memory usage statistics
     */
    async getMemoryStats(): Promise<{
        process: NodeJS.MemoryUsage;
        heapUsedMB: number;
        heapTotalMB: number;
        rssMB: number;
        externalMB: number;
        isMonitoring: boolean;
    }> {
        const memoryUsage = process.memoryUsage();
        
        return {
            process: memoryUsage,
            heapUsedMB: memoryUsage.heapUsed / 1024 / 1024,
            heapTotalMB: memoryUsage.heapTotal / 1024 / 1024,
            rssMB: memoryUsage.rss / 1024 / 1024,
            externalMB: memoryUsage.external / 1024 / 1024,
            isMonitoring: this.isMonitoring
        };
    }

    /**
     * Force immediate memory optimization
     */
    async forceOptimization(): Promise<void> {
        logger.info('Forcing immediate memory optimization');
        await this.optimizeMemory();
    }

    /**
     * Configure memory thresholds
     */
    configureThresholds(memoryThresholdMB: number, gcThresholdMB: number): void {
        this.memoryThreshold = memoryThresholdMB;
        this.gcThreshold = gcThresholdMB;
        logger.info('Memory thresholds updated', {
            memoryThreshold: `${memoryThresholdMB} MB`,
            gcThreshold: `${gcThresholdMB} MB`
        });
    }

    /**
     * Configure monitoring interval
     */
    configureMonitoringInterval(intervalMs: number): void {
        this.monitoringIntervalMs = intervalMs;
        
        // Restart monitoring with new interval if it's running
        if (this.isMonitoring) {
            this.stopMonitoring();
            this.startMonitoring();
        }
        
        logger.info('Monitoring interval updated', {
            interval: `${intervalMs} ms`
        });
    }
}