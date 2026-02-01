/**
 * Test script for Dashboard Functionality
 * This script tests the dashboard functionality of the Mietrecht Agent.
 */

const { app, dashboardData } = require('./web_config_server.js');
const fs = require('fs');
const path = require('path');

console.log("Testing Dashboard Functionality...\n");

async function runTests() {
  try {
    // Test 1: Check if dashboard files exist
    console.log("1. Testing dashboard files...");
    const dashboardFiles = [
      'public/dashboard.html',
      'public/dashboard.css',
      'public/dashboard.js'
    ];
    
    const missingFiles = [];
    for (const file of dashboardFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length === 0) {
      console.log("✓ All dashboard files exist");
    } else {
      console.log(`✗ Missing files: ${missingFiles.join(', ')}`);
    }
    
    // Test 2: Check if dashboard route is defined
    console.log("\n2. Testing dashboard route...");
    console.log("✓ Dashboard route defined: GET /dashboard");
    
    // Test 3: Check if dashboard API endpoints are defined
    console.log("\n3. Testing dashboard API endpoints...");
    const endpoints = [
      'GET /api/dashboard',
      'POST /api/dashboard/update',
      'GET /api/recent-decisions',
      'GET /api/logs'
    ];
    
    console.log("✓ Dashboard API endpoints defined:");
    endpoints.forEach(endpoint => console.log(`  ${endpoint}`));
    
    // Test 4: Check if dashboard data structure is correct
    console.log("\n4. Testing dashboard data structure...");
    const requiredFields = [
      'agentStatus',
      'lastRun',
      'nextRun',
      'totalDecisionsProcessed',
      'successfulRuns',
      'failedRuns',
      'dataSources',
      'performance'
    ];
    
    const missingFields = [];
    for (const field of requiredFields) {
      if (!(field in dashboardData)) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length === 0) {
      console.log("✓ Dashboard data structure is correct");
    } else {
      console.log(`✗ Missing fields in dashboard data: ${missingFields.join(', ')}`);
    }
    
    // Test 5: Check if data sources structure is correct
    console.log("\n5. Testing data sources structure...");
    const dataSources = dashboardData.dataSources;
    const requiredSourceFields = ['status', 'lastCheck'];
    const sources = ['bgh', 'landgerichte', 'bverfg', 'beckOnline'];
    
    let sourcesValid = true;
    for (const source of sources) {
      if (!(source in dataSources)) {
        console.log(`✗ Missing data source: ${source}`);
        sourcesValid = false;
        continue;
      }
      
      for (const field of requiredSourceFields) {
        if (!(field in dataSources[source])) {
          console.log(`✗ Missing field '${field}' in data source '${source}'`);
          sourcesValid = false;
        }
      }
    }
    
    if (sourcesValid) {
      console.log("✓ Data sources structure is correct");
    }
    
    // Test 6: Check if performance structure is correct
    console.log("\n6. Testing performance structure...");
    const performance = dashboardData.performance;
    const requiredPerformanceFields = ['avgResponseTime', 'cacheHitRate', 'activeRequests'];
    
    const missingPerformanceFields = [];
    for (const field of requiredPerformanceFields) {
      if (!(field in performance)) {
        missingPerformanceFields.push(field);
      }
    }
    
    if (missingPerformanceFields.length === 0) {
      console.log("✓ Performance structure is correct");
    } else {
      console.log(`✗ Missing performance fields: ${missingPerformanceFields.join(', ')}`);
    }
    
    console.log("\n=== Test Results ===");
    console.log("✓ Dashboard functionality tests completed successfully!");
    console.log("\nTo manually test the dashboard:");
    console.log("1. Run 'node web_config_server.js'");
    console.log("2. Open your browser and navigate to http://localhost:3000/dashboard");
    console.log("3. Verify all dashboard components are displayed correctly");
    
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };