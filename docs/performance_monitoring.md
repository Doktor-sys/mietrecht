# Performance Monitoring System

## Overview

The Mietrecht Agent includes a performance monitoring system to track and analyze the execution performance of the application. The system provides insights into API calls, email sending, function execution times, and memory usage.

## Architecture

The performance monitoring system consists of two components:

1. **Simple Performance Monitor** - A lightweight monitoring solution specifically designed for the Mietrecht Agent
2. **Advanced Performance Monitor** - A more comprehensive monitoring system (currently has some issues)

For the Mietrecht Agent, we're using the Simple Performance Monitor which provides all the necessary functionality without the complexity and issues of the advanced system.

## Simple Performance Monitor

### Key Features

- **API Call Tracking**: Monitors calls to external data sources (BGH, Landgerichte, Beck-Online)
- **Email Sending Monitoring**: Tracks email sending success rates and performance
- **Function Execution Timing**: Measures execution times of key functions
- **Memory Usage Tracking**: Monitors memory consumption during execution
- **Performance Reporting**: Generates detailed performance reports

### Usage

The Simple Performance Monitor is automatically integrated into the Mietrecht Agent. Here's how it works:

```javascript
const { SimplePerfMonitor } = require('./performance/simplePerfMonitor.js');

// Create monitor instance
const perfMonitor = new SimplePerfMonitor();

// Start monitoring
perfMonitor.start();

// Record API calls
perfMonitor.recordApiCall('bgh', 150, true); // dataSource, duration, success

// Record email sends
perfMonitor.recordEmailSend(true, 50); // success, duration

// Record function execution times
perfMonitor.recordExecutionTime('myFunction', 1200); // functionName, duration

// Record memory usage
perfMonitor.recordMemoryUsage();

// End monitoring and generate report
const report = perfMonitor.end({
  lawyersProcessed: 2,
  successful: 2,
  failed: 0
});

// Print report
perfMonitor.printReport(report);
```

### Performance Metrics Collected

1. **Execution Time**: Total time taken for the agent to complete
2. **Memory Usage**: RSS and Heap memory differences
3. **API Calls**: 
   - Call count per data source
   - Total and average duration per data source
   - Success rates per data source
4. **Email Sending**:
   - Sent count
   - Failed count
   - Success rate
5. **Function Performance**:
   - Call count per function
   - Total and average duration per function
   - Min and max duration per function

### Performance Report Example

```
=== Mietrecht Agent Performance Report ===
Execution Time: 105ms
Memory Used: RSS 73728 bytes, Heap 84552 bytes

API Calls:
  bgh: 2 calls, avg 175.00ms, 100.00% success
  landgerichte: 1 calls, avg 180.00ms, 100.00% success
  beckOnline: 1 calls, avg 300.00ms, 0.00% success

Emails: 1 sent, 1 failed, 50.00% success rate

Function Performance:
  abrufeEchteUrteile: 2 calls, avg 1150.00ms, min 1100ms, max 1200ms
  filterUrteileFuerAnwalt: 1 calls, avg 300.00ms, min 300ms, max 300ms
  generiereNewsletter: 1 calls, avg 150.00ms, min 150ms, max 150ms

Execution Results:
  lawyersProcessed: 2
  successful: 2
  failed: 0
========================================
```

## Integration with Mietrecht Agent

The performance monitoring is automatically integrated into the Mietrecht Agent:

1. Monitoring starts when the agent begins execution
2. API calls are tracked during data retrieval
3. Email sending performance is monitored
4. Key function execution times are recorded
5. A comprehensive performance report is generated at the end of execution

## Testing

To test the performance monitoring system:

1. Run the test script: `node test/test_simple_perf_monitor.js`
2. Or use the batch file: `test_simple_perf_monitor.bat`

## Benefits

1. **Performance Insights**: Understand which operations take the most time
2. **Issue Detection**: Identify failing API calls or email sends
3. **Optimization Guidance**: Focus optimization efforts on the slowest functions
4. **Success Rate Monitoring**: Track reliability of external services
5. **Memory Usage Tracking**: Monitor memory consumption patterns

## Future Enhancements

1. **Persistent Storage**: Store performance metrics in the database for historical analysis
2. **Alerting**: Send alerts when performance degrades beyond thresholds
3. **Dashboard**: Create a web-based dashboard for real-time performance monitoring
4. **Trend Analysis**: Analyze performance trends over time
5. **Resource Optimization**: Add recommendations based on performance data