# Memory Optimization Service

This document describes the Memory Optimization Service implementation for the Mietrecht Agent system, which provides advanced memory monitoring, optimization, and management capabilities.

## Overview

The Memory Optimization Service is designed to monitor and optimize memory usage in the backend services to ensure optimal performance and prevent memory leaks. It provides automatic memory optimization procedures, cache management, and detailed memory usage statistics.

## Features

1. **Automatic Memory Monitoring**: Continuously monitors memory usage and triggers optimizations when thresholds are exceeded
2. **Cache Management**: Intelligently manages application caches to free memory when needed
3. **Garbage Collection**: Triggers manual garbage collection when memory usage is high
4. **Redis Cache Optimization**: Optimizes Redis cache usage to reduce memory footprint
5. **Detailed Statistics**: Provides comprehensive memory usage statistics and reporting
6. **Configurable Thresholds**: Allows customization of memory thresholds and monitoring intervals

## Implementation Details

### Service Class

The service is implemented as a singleton class `MemoryOptimizationService` located at `services/backend/src/services/MemoryOptimizationService.ts`.

### Key Methods

#### `startMonitoring()`
Starts the memory monitoring process with configurable intervals.

#### `stopMonitoring()`
Stops the memory monitoring process.

#### `getMemoryStats()`
Returns detailed memory usage statistics including:
- Process memory usage
- Heap used (MB)
- Heap total (MB)
- RSS (Resident Set Size) (MB)
- External memory usage (MB)

#### `forceOptimization()`
Triggers immediate memory optimization procedures.

#### `configureThresholds(memoryThresholdMB, gcThresholdMB)`
Configures memory thresholds for optimization triggers.

#### `configureMonitoringInterval(intervalMs)`
Configures the monitoring interval in milliseconds.

### Memory Optimization Procedures

When memory usage exceeds configured thresholds, the service performs the following optimizations:

1. **Cache Clearing**: Clears application caches managed by the CacheManager
2. **Redis Cache Optimization**: Optimizes Redis cache usage
3. **Garbage Collection**: Forces garbage collection if available

### Configuration

The service uses the following configuration values from the application config:

- Memory threshold for optimization triggers (default: 400MB in production, 200MB in development)
- Garbage collection threshold (default: 300MB in production, 150MB in development)
- Monitoring interval (default: 30 seconds)

These can be customized using the `configureThresholds()` and `configureMonitoringInterval()` methods.

## Usage

### Starting the Service

```typescript
import { MemoryOptimizationService } from '../services/MemoryOptimizationService';

const memoryService = MemoryOptimizationService.getInstance();
memoryService.startMonitoring();
```

### Getting Memory Statistics

```typescript
const stats = await memoryService.getMemoryStats();
console.log(`Heap used: ${stats.heapUsedMB.toFixed(2)} MB`);
```

### Forcing Optimization

```typescript
await memoryService.forceOptimization();
```

### Configuring Thresholds

```typescript
// Set memory threshold to 500MB and GC threshold to 400MB
memoryService.configureThresholds(500, 400);

// Set monitoring interval to 1 minute
memoryService.configureMonitoringInterval(60000);
```

## Integration with Existing Systems

The Memory Optimization Service integrates with:

1. **CacheManager**: Manages application caches for memory optimization
2. **RedisService**: Optimizes Redis cache usage
3. **Logger**: Provides detailed logging of memory optimization activities
4. **MonitoringController**: Works alongside existing monitoring infrastructure

## Environment Considerations

For optimal performance, the service should be run with the `--expose-gc` Node.js flag to enable manual garbage collection:

```bash
node --expose-gc dist/index.js
```

In production environments, ensure that the PM2 configuration includes this flag:

```javascript
// In ecosystem.config.js
node_args: '--max-old-space-size=512 --expose-gc'
```

## Performance Impact

The memory monitoring process has minimal performance impact:
- Memory checks occur every 30 seconds by default
- Optimization procedures only run when thresholds are exceeded
- Cache clearing is selective and preserves important data
- Manual garbage collection is only triggered when necessary

## Best Practices

1. **Regular Monitoring**: Enable memory monitoring in all environments
2. **Threshold Tuning**: Adjust thresholds based on your specific hardware and workload
3. **Logging**: Monitor logs for memory optimization events
4. **Testing**: Test memory optimization procedures under realistic loads
5. **Alerting**: Set up alerts for sustained high memory usage

## Troubleshooting

### High Memory Usage Alerts

If you receive frequent high memory usage alerts:
1. Check if thresholds are appropriate for your environment
2. Review cache usage patterns
3. Investigate potential memory leaks in application code
4. Consider increasing available memory or optimizing data structures

### Optimization Not Triggering

If memory optimization is not triggering:
1. Verify that monitoring is started
2. Check threshold configuration
3. Ensure the service has access to memory statistics
4. Verify that the `--expose-gc` flag is set for manual garbage collection

## Future Enhancements

Planned improvements for the Memory Optimization Service:
1. Advanced cache eviction algorithms (LRU, LFU)
2. Predictive memory usage modeling
3. Integration with Kubernetes resource limits
4. Detailed memory profiling capabilities
5. Automated scaling recommendations based on memory usage patterns