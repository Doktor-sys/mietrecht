/**
 * Test script for Simple Performance Monitor
 * This script tests the simple performance monitoring functionality
 */

const { SimplePerfMonitor } = require('../performance/simplePerfMonitor.js');

console.log("=== Simple Performance Monitor Test ===");

// Create monitor instance
const monitor = new SimplePerfMonitor();

async function runPerformanceTests() {
  try {
    // Test 1: Start monitoring
    console.log("\n1. Starting performance monitoring...");
    monitor.start();
    console.log("  ✓ Performance monitoring started");
    
    // Test 2: Record API calls
    console.log("\n2. Recording API calls...");
    monitor.recordApiCall('bgh', 150, true);
    monitor.recordApiCall('bgh', 200, true);
    monitor.recordApiCall('landgerichte', 180, true);
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
    monitor.recordExecutionTime('abrufeEchteUrteile', 1100);
    monitor.recordExecutionTime('filterUrteileFuerAnwalt', 300);
    monitor.recordExecutionTime('generiereNewsletter', 150);
    console.log("  ✓ Execution times recorded");
    
    // Test 5: Record memory usage
    console.log("\n5. Recording memory usage...");
    monitor.recordMemoryUsage();
    console.log("  ✓ Memory usage recorded");
    
    // Simulate some delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Record more memory usage
    monitor.recordMemoryUsage();
    console.log("  ✓ Additional memory usage recorded");
    
    // Test 6: End monitoring and generate report
    console.log("\n6. Ending monitoring and generating report...");
    const report = monitor.end({
      lawyersProcessed: 2,
      successful: 2,
      failed: 0
    });
    
    console.log("  ✓ Performance report generated");
    
    // Test 7: Display report
    console.log("\n7. Displaying performance report...");
    monitor.printReport(report);
    console.log("  ✓ Performance report displayed");
    
    console.log("\n=== Simple Performance Monitor Test Complete ===");
  } catch (error) {
    console.error("Error in performance monitoring test:", error);
  }
}

// Run the tests
runPerformanceTests();