# Performance Monitoring Dashboard Configurations

This document describes the performance monitoring dashboard configurations for the Mietrecht Agent system, providing comprehensive visibility into system performance, resource utilization, and application health.

## Overview

The monitoring dashboards are designed to provide real-time insights into system performance using Grafana with Prometheus as the metrics backend. These dashboards help operators understand system behavior, identify performance bottlenecks, and troubleshoot issues.

## Dashboard Configurations

### 1. System Overview Dashboard (`system-overview.json`)

Provides a high-level view of system performance metrics:

**Panels:**
- Request Rate: HTTP requests per second by method and path
- Request Latency: 95th percentile and 50th percentile response times
- Error Rate: 5xx and 4xx error rates
- Active Connections: Number of active connections
- CPU Usage: Process CPU utilization percentage
- Memory Usage: Resident memory usage in MB
- Database Query Latency: Database query performance metrics

### 2. Detailed System Metrics Dashboard (`detailed-system-metrics.json`)

Provides granular system-level metrics for in-depth analysis:

**Panels:**
- HTTP Request Rate by Status: Breakdown by HTTP status codes (2xx, 3xx, 4xx, 5xx)
- HTTP Request Duration (95th Percentile): Response time percentiles by route
- Active Goroutines: Number of active goroutines (for Node.js equivalent metrics)
- Heap Memory Usage: Heap allocation and system memory usage
- GC Duration: Garbage collection duration metrics
- CPU Usage: Detailed CPU utilization
- Process Memory Usage: RSS and virtual memory consumption
- Open File Descriptors: Number of open file descriptors

### 3. KMS Monitoring Dashboard (`kms-monitoring.json`)

Specialized dashboard for Key Management Service monitoring:

**Panels:**
- Key Operations Overview: Creation, retrieval, rotation, and deletion rates
- Cache Performance: Hit/miss rates and cache hit percentage
- Key Status Distribution: Active, expired, and compromised key counts
- Performance Metrics: Key operation duration metrics
- Error and Security Events: Error and security event rates
- Key Operations Summary: Cumulative key operation counts

### 4. Redis Monitoring Dashboard (`redis-monitoring.json`)

Specialized dashboard for Redis cache monitoring:

**Panels:**
- Redis Memory Usage: Used vs. maximum memory consumption
- Redis Connections: Connected and blocked client counts
- Redis Commands Processed: Command processing rate
- Redis Key Metrics: Keyspace hits and misses
- Redis Network I/O: Input/output byte rates
- Redis Evicted Keys: Number of evicted keys

## Metrics Endpoints

### Backend Service Metrics
The backend service exposes Prometheus-compatible metrics at:
```
GET /metrics
```

This endpoint provides:
- HTTP request duration histograms
- HTTP request counters by route, method, and status
- Default Node.js runtime metrics (via prom-client)

### KMS Metrics
The Key Management Service exposes additional metrics through its Prometheus endpoint that provides:
- Key operation counters (creation, retrieval, rotation, deletion)
- Cache performance metrics (hits, misses, hit rate)
- Performance timing metrics (average durations)
- Error and security event counters
- Key status gauges (active, expired, compromised)

## Grafana Setup

### Importing Dashboards
1. Access the Grafana web interface
2. Navigate to "Create" → "Import"
3. Upload the JSON dashboard files or paste the JSON content
4. Select the appropriate Prometheus data source
5. Click "Import"

### Dashboard Variables
The dashboards support the following variables:
- `datasource`: Prometheus data source selection
- `interval`: Time interval for metric aggregation

### Panel Configuration
Each panel is configured with:
- Appropriate visualization type (graph, stat, etc.)
- Prometheus query expressions
- Legend formatting
- Grid positioning

## Alerting Rules

Recommended alerting rules for key metrics:

### System Performance Alerts
```
# High error rate
rate(http_requests_total{status=~"5.."}[5m]) > 0.05

# High latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2

# High memory usage
process_resident_memory_bytes / 1024 / 1024 > 500

# High CPU usage
rate(process_cpu_seconds_total[5m]) * 100 > 80
```

### KMS Alerts
```
# Low cache hit rate
kms_cache_hit_rate < 80

# High error rate
rate(kms_errors_total[5m]) > 0.1

# Security events
rate(kms_security_events_total[5m]) > 0
```

### Redis Alerts
```
# High memory usage
redis_memory_used_bytes / redis_memory_max_bytes > 0.9

# High number of evicted keys
rate(redis_evicted_keys_total[5m]) > 100

# Connection saturation
redis_connected_clients > 1000
```

## Best Practices

### Dashboard Organization
1. Group related metrics on the same dashboard
2. Use consistent time ranges across panels
3. Provide clear panel titles and descriptions
4. Use appropriate visualization types for data
5. Include units in legend formats

### Performance Considerations
1. Use appropriate time ranges for queries
2. Limit the number of series in each panel
3. Use recording rules for expensive calculations
4. Regularly review and optimize dashboard queries

### Maintenance
1. Regularly update dashboards as metrics evolve
2. Document dashboard purpose and key metrics
3. Review alert thresholds periodically
4. Archive unused dashboards

## Troubleshooting

### Common Issues

#### Missing Metrics
1. Verify the `/metrics` endpoint is accessible
2. Check Prometheus target configuration
3. Ensure proper scraping interval
4. Review metric naming conventions

#### Dashboard Loading Slow
1. Optimize PromQL queries
2. Reduce time range
3. Limit series per panel
4. Use recording rules for complex calculations

#### Alert Flapping
1. Adjust alert thresholds
2. Increase evaluation intervals
3. Add hysteresis to alert conditions
4. Review alert grouping settings

## Future Enhancements

Planned improvements for monitoring dashboards:

1. **Distributed Tracing Integration**: Add trace-based panels for request flow visualization
2. **Business Metrics Dashboards**: Create dashboards for business KPIs and user engagement
3. **Machine Learning Anomaly Detection**: Integrate ML-based anomaly detection
4. **Mobile-Optimized Views**: Create responsive dashboard layouts for mobile devices
5. **Automated Dashboard Generation**: Generate dashboards from service metadata
6. **Custom Visualization Plugins**: Develop specialized panels for domain-specific metrics