/**
 * Test script for Enhanced Health Check System
 * This script tests the enhanced health check functionality
 */

const { performComprehensiveHealthCheck } = require('../health/comprehensiveHealthCheck.js');

console.log("=== Enhanced Health Check Test ===\n");

async function runHealthCheckTests() {
  try {
    console.log("1. Running comprehensive health check...");
    
    const healthReport = await performComprehensiveHealthCheck();
    
    console.log("Health Check Results:");
    console.log("--------------------");
    console.log(`Overall Status: ${healthReport.status}`);
    console.log(`Total Time: ${healthReport.totalTime}`);
    console.log(`Timestamp: ${healthReport.timestamp}`);
    
    console.log("\nComponent Details:");
    console.log("------------------");
    
    // Database check
    const dbCheck = healthReport.checks.database;
    console.log(`Database: ${dbCheck.status}`);
    if (dbCheck.responseTime) {
      console.log(`  Response Time: ${dbCheck.responseTime}`);
    }
    if (dbCheck.error) {
      console.log(`  Error: ${dbCheck.error}`);
    }
    
    // Disk space check
    const diskCheck = healthReport.checks.diskSpace;
    console.log(`Disk Space: ${diskCheck.status}`);
    console.log(`  Free Space: ${diskCheck.freeSpace}`);
    console.log(`  Total Space: ${diskCheck.totalSpace}`);
    console.log(`  Used Percentage: ${diskCheck.usedPercentage}`);
    if (diskCheck.message) {
      console.log(`  Message: ${diskCheck.message}`);
    }
    if (diskCheck.error) {
      console.log(`  Error: ${diskCheck.error}`);
    }
    
    // Memory check
    const memoryCheck = healthReport.checks.memory;
    console.log(`Memory: ${memoryCheck.status}`);
    console.log(`  Free: ${memoryCheck.free}`);
    console.log(`  Used: ${memoryCheck.used}`);
    console.log(`  Total: ${memoryCheck.total}`);
    console.log(`  Usage Percentage: ${memoryCheck.usagePercentage}`);
    if (memoryCheck.message) {
      console.log(`  Message: ${memoryCheck.message}`);
    }
    
    // CPU check
    const cpuCheck = healthReport.checks.cpu;
    console.log(`CPU: ${cpuCheck.status}`);
    console.log(`  CPU Count: ${cpuCheck.cpuCount}`);
    console.log(`  Load Average:`);
    console.log(`    1 min: ${cpuCheck.loadAverage['1min']}`);
    console.log(`    5 min: ${cpuCheck.loadAverage['5min']}`);
    console.log(`    15 min: ${cpuCheck.loadAverage['15min']}`);
    if (cpuCheck.message) {
      console.log(`  Message: ${cpuCheck.message}`);
    }
    
    // File system check
    const fsCheck = healthReport.checks.fileSystem;
    console.log(`File System: ${fsCheck.status}`);
    if (fsCheck.message) {
      console.log(`  Message: ${fsCheck.message}`);
    }
    if (fsCheck.error) {
      console.log(`  Error: ${fsCheck.error}`);
    }
    
    // Network check
    const netCheck = healthReport.checks.network;
    console.log(`Network: ${netCheck.status}`);
    if (netCheck.message) {
      console.log(`  Message: ${netCheck.message}`);
    }
    if (netCheck.error) {
      console.log(`  Error: ${netCheck.error}`);
    }
    
    console.log("\n✓ Health check test completed successfully!");
    
  } catch (error) {
    console.error("❌ Health check test failed:", error.message);
    process.exit(1);
  }
}

// Run the tests
runHealthCheckTests();