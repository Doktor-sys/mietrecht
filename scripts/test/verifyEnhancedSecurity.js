/**
 * Enhanced Security Verification Script
 * This script verifies the enhanced security implementations in the Mietrecht Agent.
 */

// Import required modules
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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
    
    // Check for CORS
    if (content.includes('require(\'cors\')') || content.includes('import cors')) {
      console.log('✓ CORS is implemented');
    } else {
      console.log('✗ CORS is not implemented');
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

// Function to check for enhanced security middleware usage
function checkEnhancedSecurityMiddleware() {
  try {
    const content = fs.readFileSync('./scripts/web_config_server.js', 'utf8');
    
    // Check for security middleware imports
    if (content.includes('require(\'./middleware/securityMiddleware.js\')')) {
      console.log('✓ Security middleware is imported');
    } else {
      console.log('✗ Security middleware is not imported');
    }
    
    // Check for CORS usage
    if (content.includes('app.use(cors(corsOptions))')) {
      console.log('✓ CORS middleware is configured and used');
    } else {
      console.log('✗ CORS middleware is not configured or used');
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

// Function to check for enhanced input validation
function checkEnhancedInputValidation() {
  try {
    const content = fs.readFileSync('./scripts/middleware/securityMiddleware.js', 'utf8');
    
    // Check for enhanced lawyer data validation
    if (content.includes('Name is required') && content.includes('Email is required')) {
      console.log('✓ Enhanced lawyer data validation is implemented');
    } else {
      console.log('✗ Enhanced lawyer data validation is not implemented');
    }
    
    // Check for array validation
    if (content.includes('Practice areas must be an array') && content.includes('Regions must be an array')) {
      console.log('✓ Array input validation is implemented');
    } else {
      console.log('✗ Array input validation is not implemented');
    }
    
    // Check for length validation
    if (content.includes('maximum 100 characters') && content.includes('maximum 50 characters')) {
      console.log('✓ Length validation is implemented');
    } else {
      console.log('✗ Length validation is not implemented');
    }
  } catch (err) {
    console.log(`Error reading security middleware file: ${err.message}`);
  }
}

// Function to check for enhanced rate limiting
function checkEnhancedRateLimiting() {
  try {
    const content = fs.readFileSync('./scripts/middleware/securityMiddleware.js', 'utf8');
    
    // Check for authentication rate limiting
    if (content.includes('authLimiter') && content.includes('api/auth/')) {
      console.log('✓ Authentication rate limiting is implemented');
    } else {
      console.log('✗ Authentication rate limiting is not implemented');
    }
    
    // Check for different rate limits
    if (content.includes('max: 100') && content.includes('max: 50') && content.includes('max: 5')) {
      console.log('✓ Multiple rate limiting tiers are implemented');
    } else {
      console.log('✗ Multiple rate limiting tiers are not implemented');
    }
  } catch (err) {
    console.log(`Error reading security middleware file: ${err.message}`);
  }
}

// Function to check for enhanced Helmet configuration
function checkEnhancedHelmetConfig() {
  try {
    const content = fs.readFileSync('./scripts/middleware/securityMiddleware.js', 'utf8');
    
    // Check for additional Helmet configurations
    if (content.includes('referrerPolicy') && content.includes('dnsPrefetchControl')) {
      console.log('✓ Enhanced Helmet configuration is implemented');
    } else {
      console.log('✗ Enhanced Helmet configuration is not implemented');
    }
  } catch (err) {
    console.log(`Error reading security middleware file: ${err.message}`);
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
function verifyEnhancedSecurity() {
  console.log('=== Mietrecht Agent Enhanced Security Verification ===\n');
  
  // Check if security packages are installed
  console.log('Checking installed security packages:');
  checkPackageInstalled('helmet');
  checkPackageInstalled('express-rate-limit');
  checkPackageInstalled('express-validator');
  checkPackageInstalled('cors');
  console.log();
  
  // Check security implementations
  console.log('Checking security implementations:');
  checkEnhancedSecurityMiddleware();
  checkSecurityHeadersInFile('./scripts/middleware/securityMiddleware.js');
  checkEnhancedInputValidation();
  checkEnhancedRateLimiting();
  checkEnhancedHelmetConfig();
  console.log();
  
  // Run npm audit
  runNpmAudit();
}

// Run the verification
verifyEnhancedSecurity();