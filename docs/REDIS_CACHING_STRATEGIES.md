# Redis Caching Strategies

This document describes the enhanced Redis caching strategies implemented in the Mietrecht Agent system to improve performance and resource utilization.

## Overview

Redis caching is used throughout the system to reduce database load and improve response times for frequently accessed data. The enhanced caching strategies include connection pooling, advanced TTL management, and performance monitoring.

## Configuration Parameters

### Connection Pool Configuration
- `REDIS_POOL_MIN` (default: 5) - Minimum number of connections to maintain in the pool
- `REDIS_POOL_MAX` (default: 20) - Maximum number of connections allowed in the pool
- `REDIS_POOL_ACQUIRE_TIMEOUT` (default: 5000) - Maximum time (ms) to wait for a connection from the pool
- `REDIS_POOL_IDLE_TIMEOUT` (default: 30000) - Maximum time (ms) a connection can remain idle before being released

### Cache Configuration
- `REDIS_DEFAULT_TTL` (default: 3600) - Default time-to-live for cached items in seconds (1 hour)
- `REDIS_MAX_MEMORY` (default: '256mb') - Maximum memory Redis can use
- `REDIS_EVICTION_POLICY` (default: 'allkeys-lru') - Eviction policy when memory limit is reached
- `REDIS_LAZY_FREE` (default: true) - Enable lazy freeing of memory

## Enhanced Caching Methods

### Basic Operations
- `get<T>(key: string)` - Retrieve a value from cache
- `set(key: string, value: any, ttlSeconds?: number)` - Store a value in cache with TTL
- `del(key: string)` - Delete a value from cache
- `delPattern(pattern: string)` - Delete multiple keys matching a pattern

### Advanced Operations
- `setAdvanced(key: string, value: any, options)` - Store with advanced options (NX, XX, GET)
- `getOrSet<T>(key: string, fetchFunction, ttlSeconds?)` - Get from cache or fetch and store
- `incrBy(key: string, amount?, ttlSeconds?)` - Increment a counter with optional TTL

### Monitoring and Health
- `ping()` - Check Redis connectivity
- `getStats()` - Get detailed Redis statistics
- `getCacheInfo()` - Get cache performance metrics
- `isReady()` - Check if Redis is connected and ready

## Caching Strategies

### Time-Based Expiration (TTL)
Items are automatically removed from cache after their TTL expires. Default TTL is 1 hour but can be customized per item.

### Lazy Loading
Data is only loaded into cache when first requested, reducing initial load time.

### Cache-Aside Pattern
The application first checks the cache for data. If not found, it retrieves from the database and stores in cache for future requests.

### Write-Through Caching
Data is written to both cache and persistent storage simultaneously, ensuring consistency.

## Performance Optimization Techniques

### Connection Pooling
Maintains a pool of Redis connections to reduce connection overhead and improve performance under load.

### Intelligent Reconnection
Implements exponential backoff strategy for connection retries to prevent overwhelming the Redis server.

### Memory Management
Configures appropriate memory limits and eviction policies to prevent out-of-memory errors.

## Cache Monitoring

### Key Metrics
- **Hit Rate**: Percentage of requests served from cache
- **Memory Usage**: Current Redis memory consumption
- **Connected Clients**: Number of active connections
- **Command Statistics**: Total commands processed

### Health Checks
Regular health checks ensure Redis availability and performance:
- Ping-based connectivity checks
- Memory usage monitoring
- Error rate tracking

## Best Practices

### Cache Key Design
1. Use descriptive, consistent naming conventions
2. Include tenant or user identifiers for isolation
3. Use prefixes to organize related keys
4. Avoid overly long keys to save memory

### TTL Management
1. Set appropriate TTLs based on data volatility
2. Use shorter TTLs for frequently changing data
3. Use longer TTLs for static reference data
4. Implement adaptive TTL based on access patterns

### Memory Optimization
1. Monitor memory usage regularly
2. Configure appropriate eviction policies
3. Use compression for large values
4. Clean up expired keys promptly

## Troubleshooting

### Common Issues
1. **High Memory Usage**: Check eviction policy and TTL settings
2. **Connection Failures**: Verify connection pool settings and network connectivity
3. **Low Hit Rate**: Review cache key design and TTL values
4. **Performance Degradation**: Monitor command latency and memory fragmentation

### Diagnostic Commands
```bash
# Check Redis info
redis-cli info

# Check memory usage
redis-cli info memory

# Check key patterns
redis-cli keys "*pattern*"

# Check slow queries
redis-cli slowlog get
```

## Related Components

- [Redis Service](../services/backend/src/services/RedisService.ts)
- [Configuration Service](../services/backend/src/config/config.ts)
- [Cache Manager](../services/backend/src/utils/cacheManager.ts)
- [Key Cache Manager](../services/backend/src/services/kms/KeyCacheManager.ts)

## Environment Configuration Examples

### Development Environment
```bash
REDIS_POOL_MIN=2
REDIS_POOL_MAX=10
REDIS_DEFAULT_TTL=1800
REDIS_MAX_MEMORY=128mb
```

### Production Environment
```bash
REDIS_POOL_MIN=10
REDIS_POOL_MAX=50
REDIS_DEFAULT_TTL=3600
REDIS_MAX_MEMORY=1gb
REDIS_EVICTION_POLICY=allkeys-lfu
```

## References

- [Redis Documentation](https://redis.io/documentation)
- [Node-Redis Client Documentation](https://github.com/redis/node-redis)
- [Redis Caching Patterns](https://redis.io/topics/lru-cache)