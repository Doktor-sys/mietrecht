/**
 * Security Verification Script
 * This script verifies the security implementations in the Mietrecht Agent.
 */

// Import required modules
const { exec } = require('child_process');
const fs = require('fs');

// Function to check if a package is installed
function checkPackageInstalled(packageName) {
  try {
    require.resolve(packageName);
    console.log(`✓ ${packageName} is installed`);
    return true;
  } catch (err) {
    console.log(`✗ ${packageName} is not installed`);
    return false;
  }
}

// Function to check for security headers in a file
function checkSecurityHeadersInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for helmet import
    if (content.includes('require(\'helmet\')') || content.includes('import helmet')) {
      console.log('✓ Helmet security middleware is implemented');
    } else {
      console.log('✗ Helmet security middleware is not implemented');
    }
    
    // Check for rate limiting
    if (content.includes('require(\'express-rate-limit\')') || content.includes('rateLimit')) {
      console.log('✓ Rate limiting is implemented');
    } else {
      console.log('✗ Rate limiting is not implemented');
    }
    
    // Check for input validation
    if (content.includes('require(\'express-validator\')') || content.includes('validationResult')) {
      console.log('✓ Input validation is implemented');
    } else {
      console.log('✗ Input validation is not implemented');
    }
  } catch (err) {
    console.log(`Error reading file ${filePath}: ${err.message}`);
  }
}

// Function to check for security middleware usage
function checkSecurityMiddleware() {
  try {
    const content = fs.readFileSync('./scripts/web_config_server.js', 'utf8');
    
    // Check for security middleware imports
    if (content.includes('require(\'./middleware/securityMiddleware.js\')')) {
      console.log('✓ Security middleware is imported');
    } else {
      console.log('✗ Security middleware is not imported');
    }
    
    // Check for security middleware usage
    if (content.includes('applySecurityHeaders(app)') && content.includes('applyRateLimiting(app)')) {
      console.log('✓ Security middleware functions are called');
    } else {
      console.log('✗ Security middleware functions are not called');
    }
  } catch (err) {
    console.log(`Error reading web server file: ${err.message}`);
  }
}

// Function to run npm audit
function runNpmAudit() {
  console.log('\nRunning npm audit...');
  exec('npm audit', (error, stdout, stderr) => {
    if (error) {
      if (error.code === 1) {
        // This means vulnerabilities were found
        console.log('Security vulnerabilities found:');
        console.log(stdout);
      } else {
        console.log(`Error running npm audit: ${error.message}`);
      }
      return;
    }
    
    if (stderr) {
      console.log(`npm audit stderr: ${stderr}`);
      return;
    }
    
    console.log('No security vulnerabilities found');
    console.log(stdout);
  });
}

// Main verification function
function verifySecurity() {
  console.log('=== Mietrecht Agent Security Verification ===\n');
  
  // Check if security packages are installed
  console.log('Checking installed security packages:');
  checkPackageInstalled('helmet');
  checkPackageInstalled('express-rate-limit');
  checkPackageInstalled('express-validator');
  checkPackageInstalled('cors');
  console.log();
  
  // Check security implementations
  console.log('Checking security implementations:');
  checkSecurityMiddleware();
  checkSecurityHeadersInFile('./scripts/middleware/securityMiddleware.js');
  console.log();
  
  // Run npm audit
  runNpmAudit();
}

// Run the verification
verifySecurity();