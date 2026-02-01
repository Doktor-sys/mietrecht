/**
 * Heroku Environment Variables Setup
 * This script helps set up the required environment variables for Heroku deployment
 */

const { execSync } = require('child_process');
const path = require('path');

// Function to run shell commands
function runCommand(command, options = {}) {
  try {
    console.log(`Running: ${command}`);
    const result = execSync(command, { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..'),
      ...options
    });
    return result;
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    throw error;
  }
}

// Function to set Heroku config vars
async function setHerokuConfigVars() {
  console.log('🔧 Setting Heroku config variables...\n');
  
  const configVars = [
    { key: 'NODE_ENV', value: 'production', description: 'Node environment' },
    { key: 'APP_NAME', value: 'Mietrecht Webinterface', description: 'Application name' },
    { key: 'EMAIL_SERVICE', value: 'sendgrid', description: 'Email service provider' },
    { key: 'SESSION_SECRET', value: 'your-random-session-secret', description: 'Session secret (replace with secure value)' },
    { key: 'JWT_SECRET', value: 'your-random-jwt-secret', description: 'JWT secret (replace with secure value)' },
    { key: 'BGH_API_KEY', value: 'your-bgh-api-key', description: 'BGH API key (replace with actual key)' },
    { key: 'LANDGERICHTE_API_KEY', value: 'your-landgerichte-api-key', description: 'Landgerichte API key (replace with actual key)' }
  ];
  
  try {
    for (const configVar of configVars) {
      console.log(`Setting ${configVar.key}...`);
      runCommand(`heroku config:set ${configVar.key}="${configVar.value}"`);
      console.log(`✅ ${configVar.key} set (${configVar.description})\n`);
    }
    
    console.log('✅ All config variables set successfully!');
    
    console.log('\n📝 Important:');
    console.log('Please replace the placeholder values with your actual secure values:');
    console.log('- SESSION_SECRET: Generate a random secure string');
    console.log('- JWT_SECRET: Generate a random secure string');
    console.log('- EMAIL_SERVICE: Configure with your email provider');
    console.log('- BGH_API_KEY: Use your actual BGH API key');
    console.log('- LANDGERICHTE_API_KEY: Use your actual Landgerichte API key');
    
  } catch (error) {
    console.error('❌ Error setting config variables:', error.message);
    
    // Provide manual instructions
    console.log('\n📝 Manual instructions:');
    console.log('Set each config variable manually:');
    configVars.forEach(configVar => {
      console.log(`heroku config:set ${configVar.key}="${configVar.value}"`);
    });
  }
}

// Function to get current config vars
async function getCurrentConfigVars() {
  console.log('🔍 Getting current Heroku config variables...\n');
  
  try {
    runCommand('heroku config');
  } catch (error) {
    console.error('❌ Error getting config variables:', error.message);
  }
}

// Main function
async function main() {
  console.log('Heroku Environment Variables Setup');
  console.log('================================\n');
  
  // Check if Heroku CLI is installed
  try {
    runCommand('heroku --version', { stdio: 'pipe' });
    console.log('✅ Heroku CLI is installed\n');
  } catch (error) {
    console.log('❌ Heroku CLI is not installed');
    console.log('Please install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli');
    process.exit(1);
  }
  
  // Show current config
  await getCurrentConfigVars();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Set config vars
  await setHerokuConfigVars();
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { setHerokuConfigVars, getCurrentConfigVars };