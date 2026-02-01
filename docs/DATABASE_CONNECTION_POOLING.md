# Database Connection Pooling Configuration

This document describes the database connection pooling configuration implemented in the Mietrecht Agent system to optimize database performance and resource utilization.

## Overview

Connection pooling is a technique used to reduce the overhead of creating and destroying database connections by reusing existing connections from a pool. This improves performance and reduces resource consumption.

## Configuration Parameters

The following environment variables control the database connection pool behavior:

### Pool Size Configuration
- `DB_POOL_MIN` (default: 5) - Minimum number of connections to maintain in the pool
- `DB_POOL_MAX` (default: 20) - Maximum number of connections allowed in the pool

### Timeout Configuration
- `DB_POOL_ACQUIRE_TIMEOUT` (default: 30000) - Maximum time (ms) to wait for a connection from the pool
- `DB_POOL_CREATE_TIMEOUT` (default: 30000) - Maximum time (ms) to wait for creating a new connection
- `DB_POOL_DESTROY_TIMEOUT` (default: 5000) - Maximum time (ms) to wait for destroying a connection
- `DB_POOL_IDLE_TIMEOUT` (default: 10000) - Maximum time (ms) a connection can remain idle before being released
- `DB_POOL_EVICTION_INTERVAL` (default: 1000) - How often (ms) to check for idle connections to evict
- `DB_POOL_SOFT_IDLE_TIMEOUT` (default: 30000) - Soft limit for idle connection timeout

## Prisma Configuration

The connection pool settings are passed to Prisma through the database URL:

```javascript
const dbUrl = new URL(config.database.url);
dbUrl.searchParams.set('connection_limit', config.database.pool.max.toString());
dbUrl.searchParams.set('pool_timeout', '10');
```

This adds connection pool parameters to the database URL:
- `connection_limit` - Maximum number of connections in the pool
- `pool_timeout` - Time in seconds to wait for a connection

## Benefits

1. **Reduced Connection Overhead**: Eliminates the need to establish a new connection for each database operation
2. **Improved Performance**: Reusing connections reduces latency for database operations
3. **Resource Management**: Controls the maximum number of concurrent database connections
4. **Scalability**: Allows the application to handle more concurrent requests efficiently
5. **Connection Resilience**: Handles connection failures gracefully with retry mechanisms

## Best Practices

1. **Pool Size Tuning**: Adjust pool sizes based on your database capacity and application load
2. **Monitoring**: Regularly monitor pool usage metrics to identify bottlenecks
3. **Timeout Configuration**: Set appropriate timeouts to prevent hanging connections
4. **Idle Connection Management**: Configure idle timeouts to release unused connections
5. **Error Handling**: Implement proper error handling for connection failures

## Monitoring

Key metrics to monitor:
- Pool utilization ratio (active connections / pool size)
- Connection acquisition time
- Idle connection count
- Connection errors and retries

## Troubleshooting

Common issues and solutions:

1. **Connection Timeouts**: Increase timeout values or check database connectivity
2. **Pool Exhaustion**: Increase maximum pool size or optimize query performance
3. **Idle Connection Issues**: Adjust idle timeout settings
4. **Memory Leaks**: Ensure connections are properly released after use

## Environment Configuration Examples

### Development Environment
```bash
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_ACQUIRE_TIMEOUT=10000
DB_POOL_IDLE_TIMEOUT=5000
```

### Production Environment
```bash
DB_POOL_MIN=10
DB_POOL_MAX=50
DB_POOL_ACQUIRE_TIMEOUT=30000
DB_POOL_IDLE_TIMEOUT=30000
```

## Related Components

- [Database Service](../services/backend/src/config/database.ts)
- [Configuration Service](../services/backend/src/config/config.ts)
- [Health Check Service](../services/backend/src/services/HealthChecker.ts)

## References

- [Prisma Connection Pooling Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-pool)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)