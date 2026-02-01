/**
 * Test script for Performance Monitoring
 * This script tests the performance monitoring functionality
 */

const { MietrechtAgentPerformanceMonitor } = require('../performance/mietrechtAgentMonitor.js');

console.log("=== Performance Monitoring Test ===");

// Create monitor instance
const monitor = new MietrechtAgentPerformanceMonitor();

async function runPerformanceTests() {
  try {
    // Test 1: Start monitoring
    console.log("\n1. Starting performance monitoring...");
    await monitor.startAgentExecution();
    console.log("  ✓ Performance monitoring started");
    
    // Test 2: Record API calls
    console.log("\n2. Recording API calls...");
    monitor.recordApiCall('bgh', 150, true);
    monitor.recordApiCall('landgerichte', 200, true);
    monitor.recordApiCall('bverfg', 180, true);
    monitor.recordApiCall('beckOnline', 300, false); // Simulate failure
    console.log("  ✓ API calls recorded");
    
    // Test 3: Record email sends
    console.log("\n3. Recording email sends...");
    monitor.recordEmailSend(true, 50);
    monitor.recordEmailSend(false, 0); // Simulate failure
    console.log("  ✓ Email sends recorded");
    
    // Test 4: Record execution times
    console.log("\n4. Recording execution times...");
    monitor.recordExecutionTime('abrufeEchteUrteile', 1200);
    monitor.recordExecutionTime('filterUrteileFuerAnwalt', 300);
    monitor.recordExecutionTime('generiereNewsletter', 150);
    console.log("  ✓ Execution times recorded");
    
    // Test 5: End monitoring and generate report
    console.log("\n5. Ending monitoring and generating report...");
    const perfData = await monitor.endAgentExecution({
      lawyersProcessed: 2,
      successful: 2,
      failed: 0
    });
    
    const report = monitor.generatePerformanceReport(perfData);
    console.log("  ✓ Performance report generated");
    
    // Test 6: Display report summary
    console.log("\n6. Performance Report Summary:");
    console.log(`  Duration: ${report.execution.duration}ms`);
    console.log(`  Memory RSS: ${report.execution.memoryUsed.rss} bytes`);
    console.log(`  Memory Heap: ${report.execution.memoryUsed.heapUsed} bytes`);
    console.log(`  Total API Calls: ${report.api.totalCalls}`);
    console.log(`  API Success Rate: ${report.api.successRate.toFixed(2)}%`);
    console.log(`  Emails Sent: ${report.email.sent}`);
    console.log(`  Email Success Rate: ${report.email.successRate.toFixed(2)}%`);
    console.log(`  Average Function Execution Time: ${report.performance.avgFunctionExecutionTime.toFixed(2)}ms`);
    
    console.log("\n  Slowest Functions:");
    report.performance.slowestFunctions.forEach((func, index) => {
      console.log(`    ${index + 1}. ${func.function}: ${func.duration}ms`);
    });
    
    // Test 7: Log performance metrics
    console.log("\n7. Logging performance metrics...");
    await monitor.logPerformanceMetrics(report);
    console.log("  ✓ Performance metrics logged");
    
    console.log("\n=== Performance Monitoring Test Complete ===");
  } catch (error) {
    console.error("Error in performance monitoring test:", error);
  }
}

// Run the tests
runPerformanceTests();