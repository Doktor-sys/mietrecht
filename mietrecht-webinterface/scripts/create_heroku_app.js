/**
 * Heroku App Creation Helper
 * This script helps create a Heroku app and configure it for deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
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

// Function to create Heroku app
async function createHerokuApp() {
  console.log('🚀 Creating Heroku app...\n');
  
  try {
    // Create Heroku app with a unique name
    const timestamp = Date.now();
    const appName = `mietrecht-webinterface-${timestamp}`;
    
    console.log(`Creating Heroku app with name: ${appName}`);
    runCommand(`heroku create ${appName}`);
    
    console.log(`\n✅ Heroku app created successfully!`);
    console.log(`App URL: https://${appName}.herokuapp.com`);
    console.log(`Git remote added automatically`);
    
    // Add Heroku Postgres
    console.log('\n Adding Heroku Postgres addon...');
    try {
      runCommand('heroku addons:create heroku-postgresql:hobby-dev');
      console.log('✅ Heroku Postgres addon added');
    } catch (error) {
      console.log('Note: Heroku Postgres addon may already be installed or there was an error');
    }
    
    // Set config vars
    console.log('\n Setting config vars...');
    try {
      runCommand('heroku config:set NODE_ENV=production');
      runCommand('heroku config:set APP_NAME="Mietrecht Webinterface"');
      console.log('✅ Config vars set');
    } catch (error) {
      console.error('Error setting config vars:', error.message);
    }
    
    console.log('\n📝 Next steps:');
    console.log('1. Set your actual config vars using: heroku config:set KEY=VALUE');
    console.log('2. Deploy your app: git push heroku main');
    console.log('3. Run database initialization: heroku run npm run init-db');
    console.log('4. Open your app: heroku open');
    
    return appName;
    
  } catch (error) {
    console.error('❌ Error creating Heroku app:', error.message);
    
    // Provide manual instructions
    console.log('\n📝 Manual instructions:');
    console.log('1. Create Heroku app manually:');
    console.log('   heroku create your-app-name');
    console.log('2. Add Heroku Postgres:');
    console.log('   heroku addons:create heroku-postgresql:hobby-dev');
    console.log('3. Set config vars:');
    console.log('   heroku config:set NODE_ENV=production');
    console.log('   heroku config:set APP_NAME="Mietrecht Webinterface"');
    
    return null;
  }
}

// Main function
async function main() {
  console.log('Heroku App Creation Helper');
  console.log('========================\n');
  
  // Check if Heroku CLI is installed
  try {
    runCommand('heroku --version', { stdio: 'pipe' });
    console.log('✅ Heroku CLI is installed\n');
  } catch (error) {
    console.log('❌ Heroku CLI is not installed');
    console.log('Please install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli');
    process.exit(1);
  }
  
  // Create the app
  await createHerokuApp();
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { createHerokuApp };