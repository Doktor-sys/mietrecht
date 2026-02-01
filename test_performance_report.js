/**
 * Test script for Performance Report Generator
 * This script tests the performance report generation functionality
 */

// Import required modules
const { PerformanceReportGenerator } = require('./scripts/performance/reportGenerator_fixed.js');

async function testPerformanceReportGeneration() {
  console.log('Testing Performance Report Generation...');
  
  try {
    // Create report generator instance
    const reportGenerator = new PerformanceReportGenerator();
    
    // Generate comprehensive report
    const report = await reportGenerator.generateComprehensiveReport();
    console.log('Performance report generated successfully:');
    console.log('Report timestamp:', report.timestamp);
    console.log('System info:', report.systemInfo);
    console.log('Summary health:', report.summary.overallHealth);
    
    // Save JSON report
    const jsonReportPath = await reportGenerator.saveReportToFile(report);
    console.log('JSON report saved to:', jsonReportPath);
    
    // Generate and save HTML report
    const htmlReport = await reportGenerator.generateHtmlReport(report);
    const htmlReportPath = await reportGenerator.saveHtmlReportToFile(htmlReport);
    console.log('HTML report saved to:', htmlReportPath);
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error generating performance reports:', error);
  }
}

// Run the test
testPerformanceReportGeneration();