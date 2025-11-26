# Application Monitoring Guide

## Overview

This guide explains how to set up monitoring for the Mietrecht Webinterface to ensure optimal performance and quick issue detection.

## Monitoring Components

### 1. Application Performance Monitoring (APM)

#### Express Application Monitoring
The application includes built-in health check endpoints and error tracking that can be used with APM tools.

**Health Check Endpoint**: `GET /health`
Returns:
```json
{
  "status": "OK",
  "timestamp": "2025-11-26T10:00:00.000Z",
  "uptime": 3600.123
}
```

#### Recommended APM Tools
1. **New Relic**
   - Install: `npm install newrelic`
   - Configure with environment variables
   - Monitor response times, throughput, and errors

2. **Datadog**
   - Install: `npm install dd-trace`
   - Configure tracing for Express routes
   - Monitor database queries and external API calls

3. **Elastic APM**
   - Install: `npm install elastic-apm-node`
   - Configure with APM server URL
   - Monitor transaction performance

### 2. Infrastructure Monitoring

#### Server Metrics
Monitor these key server metrics:
- CPU usage
- Memory usage
- Disk space
- Network I/O

#### Database Monitoring
- Connection pool usage
- Query performance
- Database size
- Slow queries

#### Container Monitoring (Docker)
- Container resource usage
- Container health status
- Restart counts
- Image vulnerabilities

### 3. Log Management

#### Application Logs
The application outputs logs to stdout/stderr which can be collected by log management systems.

**Log Types**:
- Info logs (application startup, requests)
- Warning logs (non-critical issues)
- Error logs (exceptions, failures)

#### Recommended Log Management Tools
1. **ELK Stack** (Elasticsearch, Logstash, Kibana)
2. **Splunk**
3. **Datadog Logs**
4. **Papertrail**

### 4. Error Tracking

#### Error Reporting
The application includes error handling that can be integrated with error tracking services.

#### Recommended Error Tracking Tools
1. **Sentry**
   - Install: `npm install @sentry/node`
   - Capture exceptions and errors
   - Monitor error frequency and impact

2. **Rollbar**
   - Install: `npm install rollbar`
   - Real-time error alerting
   - Error grouping and filtering

3. **Bugsnag**
   - Install: `npm install bugsnag`
   - Error trend analysis
   - Release correlation

## Setup Instructions

### New Relic Setup
1. Create a New Relic account
2. Get your license key
3. Install the agent:
   ```bash
   npm install newrelic
   ```
4. Add to your application:
   ```javascript
   require('newrelic');
   ```
5. Set environment variables:
   ```env
   NEW_RELIC_LICENSE_KEY=your-license-key
   NEW_RELIC_APP_NAME=Mietrecht Webinterface
   ```

### Datadog Setup
1. Create a Datadog account
2. Install the agent:
   ```bash
   npm install dd-trace
   ```
3. Initialize in your application:
   ```javascript
   const tracer = require('dd-trace').init();
   ```
4. Set environment variables:
   ```env
   DD_AGENT_HOST=localhost
   DD_TRACE_AGENT_PORT=8126
   ```

### Sentry Setup
1. Create a Sentry account
2. Create a new project
3. Install the SDK:
   ```bash
   npm install @sentry/node
   ```
4. Initialize in your application:
   ```javascript
   const Sentry = require('@sentry/node');
   
   Sentry.init({
     dsn: 'YOUR_DSN_HERE',
     tracesSampleRate: 1.0,
   });
   ```

## Alerting Configuration

### Critical Alerts
- Application downtime (health check fails)
- High error rate (>5%)
- High response time (>5 seconds)
- Database connection failures
- High memory usage (>80%)

### Warning Alerts
- Moderate error rate (>1%)
- Moderate response time (>2 seconds)
- Low memory usage (>60%)
- High CPU usage (>70%)

### Notification Channels
- Email
- Slack
- SMS
- PagerDuty
- Webhooks

## Dashboard Setup

### Key Metrics to Display
1. **Application Health**
   - Uptime percentage
   - Response time (avg, p95, p99)
   - Requests per second
   - Error rate

2. **Database Performance**
   - Connection pool usage
   - Query response time
   - Database size
   - Slow query count

3. **Infrastructure**
   - CPU usage
   - Memory usage
   - Disk space
   - Network I/O

4. **Business Metrics**
   - Active users
   - API calls
   - Newsletter deliveries
   - Search queries

## Best Practices

### 1. Monitoring Strategy
- Monitor both synthetic and real user traffic
- Set up alerts with appropriate thresholds
- Regularly review and adjust monitoring rules
- Document monitoring procedures

### 2. Alert Management
- Avoid alert fatigue with proper thresholding
- Use escalation policies
- Regular alert review and tuning
- Maintain on-call schedules

### 3. Performance Optimization
- Monitor performance trends
- Identify bottlenecks
- Optimize slow queries
- Cache frequently accessed data

### 4. Security Monitoring
- Monitor authentication attempts
- Track suspicious activities
- Log security events
- Set up intrusion detection

## Troubleshooting

### Common Issues
1. **Health Check Failures**
   - Check application logs
   - Verify database connectivity
   - Ensure required services are running

2. **High Response Times**
   - Check database query performance
   - Review external API calls
   - Monitor resource usage

3. **High Error Rates**
   - Review error logs
   - Check recent deployments
   - Verify external service availability

### Diagnostic Steps
1. Check application logs
2. Verify health check endpoint
3. Test database connectivity
4. Review recent changes
5. Check external dependencies

## Conclusion

Proper monitoring is essential for maintaining a reliable and performant application. By implementing the monitoring solutions described in this guide, you can ensure that the Mietrecht Webinterface operates smoothly and issues are detected and resolved quickly.