/**
 * Test script for Enhanced Monitoring and Logging
 * This script tests the enhanced monitoring and logging functionality
 */

const { EnhancedMonitor } = require('../monitoring/enhancedMonitor.js');
const { Logger } = require('../monitoring/logService.js');

console.log("=== Enhanced Monitoring and Logging Test ===");

async function runEnhancedMonitoringTests() {
  try {
    // Test 1: Enhanced Monitor
    console.log("\n1. Testing Enhanced Monitor...");
    const monitor = new EnhancedMonitor();
    
    monitor.start();
    
    // Record some API calls
    monitor.recordApiCall('bgh', 150, true, { test: true });
    monitor.recordApiCall('landgerichte', 200, true, { test: true });
    monitor.recordApiCall('beckOnline', 300, false, { test: true, error: 'timeout' });
    
    // Record email sends
    monitor.recordEmailSend(true, 50, { test: true });
    monitor.recordEmailSend(false, 0, { test: true, error: 'invalid address' });
    
    // Record execution times
    monitor.recordExecutionTime('testFunction', 100, { test: true });
    monitor.recordExecutionTime('slowFunction', 6000, { test: true }); // This should trigger a warning
    
    // Record memory usage
    monitor.recordMemoryUsage();
    
    // Record an error
    const testError = new Error('Test error');
    monitor.recordError(testError, 'testContext');
    
    // Log some messages
    await monitor.log('info', 'Test info message', { test: true });
    await monitor.log('warning', 'Test warning message', { test: true });
    await monitor.log('error', 'Test error message', { test: true });
    
    // End monitoring
    const report = monitor.end({ test: true, successful: 1, failed: 1 });
    
    console.log("  ✓ Enhanced Monitor test completed");
    console.log(`  Report generated with ${Object.keys(report.api).length} API sources`);
    
    // Test 2: Logger
    console.log("\n2. Testing Logger...");
    const logger = new Logger('test-service');
    
    await logger.debug('Test debug message', { test: true });
    await logger.info('Test info message', { test: true });
    await logger.warn('Test warning message', { test: true });
    await logger.error('Test error message', { test: true });
    
    console.log("  ✓ Logger test completed");
    
    // Test 3: Default logger
    console.log("\n3. Testing Default Logger...");
    const { debug, info, warn, error } = require('../monitoring/logService.js');
    
    debug('Test debug via default logger', { test: true });
    info('Test info via default logger', { test: true });
    warn('Test warning via default logger', { test: true });
    error('Test error via default logger', { test: true });
    
    console.log("  ✓ Default Logger test completed");
    
    console.log("\n=== All Enhanced Monitoring and Logging Tests Passed! ===");
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  }
}

// Run the tests
runEnhancedMonitoringTests();