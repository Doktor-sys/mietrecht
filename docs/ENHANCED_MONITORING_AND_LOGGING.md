# Enhanced Monitoring and Logging System

## Overview

The Enhanced Monitoring and Logging System provides advanced observability capabilities for the Mietrecht Agent. This system offers comprehensive monitoring, flexible logging options, and performance tracking to ensure reliable operation and simplified troubleshooting.

## Architecture

The system consists of three main components:

1. **[EnhancedMonitor](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/monitoring/enhancedMonitor.js#L9-L222)** - Advanced performance monitoring and metrics collection
2. **[Logger](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/monitoring/logService.js#L12-L156)** - Centralized logging service with multiple output options
3. **[logConfig](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/monitoring/logConfig.js)** - Centralized logging configuration management

## Features

### Enhanced Monitor

The EnhancedMonitor provides comprehensive performance tracking:

- **API Call Monitoring**: Tracks calls to external data sources with success/failure rates
- **Email Send Tracking**: Monitors email delivery success and performance
- **Function Execution Timing**: Measures key function performance with detailed statistics
- **Memory Usage Tracking**: Monitors application memory consumption
- **Error and Warning Tracking**: Records and categorizes application issues
- **Performance Reports**: Generates detailed performance reports with actionable insights
- **External Monitoring Integration**: Sends metrics to external monitoring services

### Logger

The Logger provides flexible logging capabilities:

- **Multi-Output Support**: Console, file, database, and external service logging
- **Configurable Log Levels**: Debug, info, warning, and error levels with customizable thresholds
- **Structured Logging**: JSON and simple text formatting options
- **Metadata Support**: Rich metadata attachment to log messages
- **Log Rotation**: Automatic log file rotation based on size or age
- **External Service Integration**: Integration with popular logging services

### Configuration

The system supports comprehensive configuration through:

- **Environment Variables**: Runtime configuration via environment variables
- **Default Settings**: Sensible defaults for all configuration options
- **Hierarchical Configuration**: Multiple configuration sources with clear precedence

## Usage

### Basic Monitoring

```javascript
const { EnhancedMonitor } = require('./monitoring/enhancedMonitor.js');

const monitor = new EnhancedMonitor();
monitor.start();

// Record API calls
monitor.recordApiCall('bgh', 150, true, { results: 10 });

// Record email sends
monitor.recordEmailSend(true, 50, { recipient: 'test@example.com' });

// Record function execution
monitor.recordExecutionTime('processData', 200, { records: 1000 });

// End monitoring and generate report
const report = monitor.end({ processed: 1000, successful: 995, failed: 5 });
monitor.printReport(report);
```

### Basic Logging

```javascript
const { Logger } = require('./monitoring/logService.js');

const logger = new Logger('my-service');

// Different log levels
await logger.debug('Debug information', { variable: 'value' });
await logger.info('Process started', { processId: 12345 });
await logger.warn('High memory usage detected', { memory: '250MB' });
await logger.error('Failed to process record', { recordId: 98765, error: 'Timeout' });
```

### Default Logger

```javascript
const { info, warn, error } = require('./monitoring/logService.js');

info('Using default logger', { component: 'startup' });
warn('This is a warning', { component: 'validation' });
error('This is an error', { component: 'processing' });
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_CONSOLE_ENABLED` | Enable/disable console logging | true |
| `LOG_CONSOLE_LEVEL` | Minimum log level for console | info |
| `LOG_FILE_ENABLED` | Enable/disable file logging | false |
| `LOG_FILE_LEVEL` | Minimum log level for file | debug |
| `LOG_FILE_PATH` | Path to log file | ./logs/mietrecht-agent.log |
| `LOG_DATABASE_ENABLED` | Enable/disable database logging | true |
| `LOG_DATABASE_LEVEL` | Minimum log level for database | info |
| `LOG_EXTERNAL_ENABLED` | Enable/disable external logging | false |
| `LOG_EXTERNAL_LEVEL` | Minimum log level for external | error |
| `LOG_EXTERNAL_ENDPOINT` | External logging service endpoint | null |
| `LOG_EXTERNAL_TOKEN` | Authentication token for external service | null |
| `ENABLE_EXTERNAL_MONITORING` | Enable external monitoring integration | false |
| `EXTERNAL_MONITORING_ENDPOINT` | External monitoring service endpoint | null |

## Integration with Mietrecht Agent

The Mietrecht Agent has been updated to use the enhanced monitoring and logging system:

- **Performance Monitoring**: Comprehensive tracking of API calls, email sends, and function execution
- **Detailed Logging**: Structured logging with rich metadata for all operations
- **Error Tracking**: Automatic recording and categorization of errors and warnings
- **Memory Monitoring**: Periodic memory usage tracking with alerts for high consumption
- **Performance Reports**: Detailed performance reports at the end of each execution

## Testing

The enhanced monitoring and logging system includes comprehensive tests:

- **[test_enhanced_monitoring.js](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/test/test_enhanced_monitoring.js)** - Complete test suite for monitoring and logging functionality
- **[test_enhanced_monitoring.bat](file:///f:/-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/test_enhanced_monitoring.bat)** - Batch script for easy test execution

Run tests using:
```bash
cd scripts
test_enhanced_monitoring.bat
```

## Benefits

1. **Improved Observability**: Comprehensive monitoring and logging for better system insight
2. **Flexible Configuration**: Multiple configuration options for different deployment scenarios
3. **Performance Tracking**: Detailed performance metrics for optimization opportunities
4. **Error Analysis**: Structured error tracking for faster troubleshooting
5. **External Integration**: Support for external monitoring and logging services
6. **Resource Monitoring**: Memory usage tracking to prevent resource exhaustion
7. **Structured Data**: Rich metadata for better log analysis and correlation

## Future Enhancements

Potential areas for future improvement:

1. **Distributed Tracing**: Integration with distributed tracing systems
2. **Metrics Export**: Prometheus metrics endpoint
3. **Dashboard Integration**: Real-time monitoring dashboards
4. **Alerting System**: Automated alerting based on performance thresholds
5. **Log Aggregation**: Centralized log aggregation for multi-instance deployments