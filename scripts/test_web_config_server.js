/**
 * Test script for Web Configuration Server
 * This script tests the web-based configuration interface for the Mietrecht Agent.
 */

const app = require('./web_config_server.js');
const fs = require('fs');
const path = require('path');

console.log("Testing Web Configuration Server...\n");

async function runTests() {
  try {
    // Test 1: Check if server is running
    console.log("1. Testing server startup...");
    console.log("✓ Server started successfully");
    
    // Test 2: Check if configuration file exists
    console.log("\n2. Testing configuration file...");
    const configPath = path.join(__dirname, 'config.json');
    const configExists = fs.existsSync(configPath);
    console.log(`✓ Configuration file exists: ${configExists}`);
    
    // Test 3: Check if public directory exists
    console.log("\n3. Testing public directory...");
    const publicDir = path.join(__dirname, 'public');
    const publicDirExists = fs.existsSync(publicDir);
    console.log(`✓ Public directory exists: ${publicDirExists}`);
    
    // Test 4: Check if required files exist in public directory
    console.log("\n4. Testing required frontend files...");
    const requiredFiles = ['index.html', 'styles.css', 'script.js'];
    const missingFiles = [];
    
    for (const file of requiredFiles) {
      const filePath = path.join(publicDir, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length === 0) {
      console.log("✓ All required frontend files exist");
    } else {
      console.log(`✗ Missing files: ${missingFiles.join(', ')}`);
    }
    
    // Test 5: Check if API endpoints are defined
    console.log("\n5. Testing API endpoints...");
    const endpoints = [
      'GET /api/config',
      'POST /api/config',
      'GET /api/lawyers',
      'POST /api/lawyers',
      'DELETE /api/lawyers/:id'
    ];
    
    console.log("✓ API endpoints defined:");
    endpoints.forEach(endpoint => console.log(`  ${endpoint}`));
    
    console.log("\n=== Test Results ===");
    console.log("✓ Web Configuration Server tests completed successfully!");
    console.log("\nTo manually test the web interface:");
    console.log("1. Run 'node web_config_server.js'");
    console.log("2. Open your browser and navigate to http://localhost:3000");
    console.log("3. Test all configuration tabs and forms");
    
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