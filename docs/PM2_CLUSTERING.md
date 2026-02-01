# PM2 Clustering Implementation

This document describes the PM2 clustering implementation for the Mietrecht Agent system to enable horizontal scaling and improved performance.

## Overview

PM2 clustering allows us to run multiple instances of our Node.js applications across all available CPU cores, enabling better resource utilization and improved fault tolerance.

## Configuration Files

### Root Level Configuration (`ecosystem.config.js`)

The root-level configuration manages all services in the system:
- API Gateway
- Auth Service
- Backend Service
- AI Service
- Data Sources Service

Each service is configured with appropriate instance counts and resource limits.

### Service Level Configuration (`services/backend/ecosystem.config.js`)

Each service has its own PM2 configuration that can be used independently.

## PM2 Commands

The following PM2 commands are available:

```bash
# Start all services with clustering
pm2 start ecosystem.config.js

# Stop all services
pm2 stop ecosystem.config.js

# Restart all services
pm2 restart ecosystem.config.js

# View service status
pm2 status

# View logs
pm2 logs

# View monitoring dashboard
pm2 monit
```

## Service Specific Commands (Backend Example)

```bash
# Navigate to backend service directory
cd services/backend

# Start backend with clustering
npm run start:pm2

# Stop backend services
npm run stop:pm2

# Restart backend services
npm run restart:pm2

# View status
npm run status:pm2

# View logs
npm run logs:pm2
```

## Clustering Benefits

1. **Horizontal Scaling**: Utilize all CPU cores for better performance
2. **Fault Tolerance**: If one instance crashes, others continue serving requests
3. **Zero Downtime Reloads**: Update applications without downtime
4. **Load Distribution**: Requests are distributed across multiple instances
5. **Resource Isolation**: Each instance runs in its own process

## Configuration Details

### Instance Count

- **Backend Service**: `'max'` - Uses all available CPU cores
- **Other Services**: `2` - Fixed number of instances for predictable resource usage

### Memory Management

- **Max Memory Restart**: Services automatically restart when reaching memory limits
- **Node.js Args**: Memory limits configured via `--max-old-space-size`
- **Garbage Collection**: Manual garbage collection enabled via `--expose-gc` flag for memory optimization

### Memory Optimization Service

The Memory Optimization Service provides automatic memory monitoring and optimization for all clustered services. It:

1. Continuously monitors memory usage across all instances
2. Automatically triggers garbage collection when memory usage is high
3. Manages application caches to prevent memory leaks
4. Integrates with Redis cache for optimal memory usage
5. Provides detailed memory usage statistics and reporting

### Health Monitoring

- **Listen Timeout**: Time to wait for application to bind to port
- **Kill Timeout**: Time to wait for graceful shutdown
- **Restart Settings**: Prevent crash loops with max restarts and minimum uptime

## Environment Configuration

Services can be started in different environments:
- Production (`NODE_ENV=production`)
- Development (`NODE_ENV=development`)

Environment-specific configurations are defined in the ecosystem files.

## Logging

All services output logs to dedicated files:
- Error logs: `logs/[service]-err.log`
- Output logs: `logs/[service]-out.log`
- Combined logs: `logs/[service]-combined.log`

## Best Practices

1. **Graceful Shutdown**: Applications should handle SIGINT and SIGTERM signals
2. **Stateless Services**: Avoid storing session data in memory
3. **Shared State**: Use external stores (Redis, Database) for shared data
4. **Health Checks**: Implement health check endpoints for monitoring
5. **Resource Limits**: Set appropriate memory and CPU limits

## Deployment Considerations

1. **Process Management**: PM2 keeps applications running even after system restarts
2. **Load Balancing**: PM2's built-in load balancer distributes requests
3. **Monitoring**: Built-in monitoring via `pm2 monit` command
4. **Log Management**: Centralized logging for easier debugging