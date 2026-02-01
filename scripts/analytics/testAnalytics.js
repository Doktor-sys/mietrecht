/**
 * Test script for analytics and reporting
 * This script tests the analytics and reporting functionality
 */

const { 
  generatePerformanceReport, 
  generateEngagementReport, 
  generateDataSourceReport, 
  generateComprehensiveReport, 
  getLawyerAnalytics,
  generateCSVReport
} = require('./reportingAnalytics.js');

async function testAnalytics() {
  console.log("Testing analytics and reporting functionality...\n");
  
  try {
    const options = {
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    };
    
    // Test 1: Generate performance report
    console.log("Test 1: Generate performance report");
    const performanceReport = await generatePerformanceReport(options);
    console.log(`  Generated performance report with ${performanceReport.totalMetrics} metrics`);
    console.log(`  Report type: ${performanceReport.type}`);
    
    // Test 2: Generate engagement report
    console.log("\nTest 2: Generate engagement report");
    const engagementReport = await generateEngagementReport(options);
    console.log(`  Generated engagement report for ${engagementReport.totalLawyers} lawyers`);
    console.log(`  Report type: ${engagementReport.type}`);
    
    // Test 3: Generate data source report
    console.log("\nTest 3: Generate data source report");
    const dataSourceReport = await generateDataSourceReport(options);
    console.log(`  Generated data source report for ${dataSourceReport.totalSources} sources`);
    console.log(`  Report type: ${dataSourceReport.type}`);
    
    // Test 4: Generate comprehensive report
    console.log("\nTest 4: Generate comprehensive report");
    const comprehensiveReport = await generateComprehensiveReport(options);
    console.log(`  Generated comprehensive report`);
    console.log(`  Report type: ${comprehensiveReport.type}`);
    
    // Test 5: Get lawyer analytics (using lawyer ID 1 as example)
    console.log("\nTest 5: Get lawyer analytics");
    const lawyerAnalytics = await getLawyerAnalytics(1, options);
    console.log(`  Generated analytics for lawyer ID ${lawyerAnalytics.lawyerId}`);
    console.log(`  Total interactions: ${lawyerAnalytics.totalInteractions}`);
    
    // Test 6: Generate CSV report
    console.log("\nTest 6: Generate CSV report");
    const csvReport = generateCSVReport(engagementReport);
    console.log(`  Generated CSV report (${csvReport.length} characters)`);
    
    console.log("\nAnalytics and reporting tests completed successfully!");
    return true;
  } catch (error) {
    console.error("Error testing analytics and reporting:", error.message);
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAnalytics().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = { testAnalytics };