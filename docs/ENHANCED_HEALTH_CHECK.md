# Enhanced Health Check System

## Overview

The Enhanced Health Check System provides comprehensive monitoring capabilities for the Mietrecht Agent application. This system goes beyond simple uptime checks to provide detailed insights into the health and performance of all critical components.

## Architecture

The health check system consists of several components:

1. **Basic Health Endpoint** (`/health`) - Simple liveness check
2. **Comprehensive Health Endpoint** (`/health/comprehensive`) - Detailed health assessment
3. **Health Check Script** - Command-line health verification
4. **Comprehensive Health Check Module** - Core health checking logic

## Health Check Endpoints

### Basic Health Check (`GET /health`)

Provides a simple indication of whether the web server is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-01T10:30:00.000Z",
  "service": "mietrecht-agent-web-server"
}
```

### Comprehensive Health Check (`GET /health/comprehensive`)

Provides detailed health information for all system components.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-01T10:30:00.000Z",
  "totalTime": "45ms",
  "checks": {
    "database": {
      "status": "healthy",
      "component": "database",
      "responseTime": "12ms"
    },
    "diskSpace": {
      "status": "healthy",
      "component": "disk-space",
      "freeSpace": "15.2 GB",
      "totalSpace": "100.0 GB",
      "usedPercentage": "84.8%",
      "message": "Sufficient disk space available"
    },
    "memory": {
      "status": "healthy",
      "component": "memory",
      "free": "1200.5 MB",
      "used": "823.5 MB",
      "total": "2024.0 MB",
      "usagePercentage": "40.69%",
      "message": "Normal memory usage"
    },
    "cpu": {
      "status": "healthy",
      "component": "cpu",
      "loadAverage": {
        "1min": "15.25%",
        "5min": "12.75%",
        "15min": "10.50%"
      },
      "cpuCount": 8,
      "message": "Normal CPU load"
    },
    "fileSystem": {
      "status": "healthy",
      "component": "file-system",
      "message": "File system permissions are correct"
    },
    "network": {
      "status": "healthy",
      "component": "network",
      "message": "Network connectivity available"
    }
  }
}
```

## Component Checks

### Database Health Check

- Verifies database connectivity
- Measures response time
- Reports any connection errors

### Disk Space Check

- Checks available disk space
- Calculates used percentage
- Warns when space is low (<100MB available)

### Memory Usage Check

- Monitors RAM usage
- Calculates usage percentage
- Warns when usage exceeds 80%

### CPU Usage Check

- Monitors CPU load averages
- Normalizes load by CPU count
- Warns when load exceeds 70%

### File System Permissions Check

- Verifies read/write permissions
- Tests ability to create files in critical directories
- Reports permission errors

### Network Connectivity Check

- Verifies network interfaces
- Detects active connections
- Reports connectivity issues

## Health Status Levels

1. **Healthy** - All components functioning normally
2. **Warning** - Some components have minor issues but system is still functional
3. **Unhealthy** - Critical components are failing, system may be unstable

## Command-Line Health Check

The system includes a command-line health check script (`healthcheck.js`) that can be used for automated monitoring:

```bash
node scripts/healthcheck.js
```

This script returns exit code 0 for healthy systems and exit code 1 for unhealthy systems, making it suitable for use in CI/CD pipelines and monitoring systems.

## Integration with Monitoring Systems

The health check endpoints can be integrated with external monitoring systems like:

- Prometheus
- Grafana
- Datadog
- New Relic
- AWS CloudWatch
- Azure Monitor

## Best Practices

1. **Regular Health Checks** - Schedule periodic health checks to detect issues early
2. **Alerting** - Configure alerts for warning and unhealthy statuses
3. **Logging** - Log health check results for historical analysis
4. **Automation** - Use health checks in deployment pipelines to prevent deploying to unhealthy systems

## Troubleshooting

If health checks fail, check the following:

1. **Database Connectivity** - Ensure the database is running and accessible
2. **Disk Space** - Free up disk space if running low
3. **Memory Usage** - Restart the application if memory usage is excessive
4. **CPU Load** - Investigate processes consuming high CPU
5. **File Permissions** - Verify the application has necessary file system permissions
6. **Network Connectivity** - Check network interfaces and firewall settings