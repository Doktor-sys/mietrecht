/**
 * Test script for Report Generator
 * This script tests the report generation functionality
 */

// Import required modules
const { generateAllReports } = require('./scripts/analytics/reportGenerator.js');

async function testReportGeneration() {
  console.log('Testing Report Generation...');
  
  try {
    // Generate all reports
    const reportPaths = await generateAllReports();
    console.log('Reports generated successfully:');
    console.log(reportPaths);
  } catch (error) {
    console.error('Error generating reports:', error);
  }
}

// Run the test
testReportGeneration();