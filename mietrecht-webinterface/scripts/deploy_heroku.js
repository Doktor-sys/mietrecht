/**
 * Heroku Deployment Script for Mietrecht Webinterface
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

// Function to check if Heroku CLI is installed
function checkHerokuCLI() {
  try {
    runCommand('heroku --version', { stdio: 'pipe' });
    console.log('✅ Heroku CLI is installed');
    return true;
  } catch (error) {
    console.log('❌ Heroku CLI is not installed');
    console.log('Please install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli');
    return false;
  }
}

// Function to check if Git is installed
function checkGit() {
  try {
    runCommand('git --version', { stdio: 'pipe' });
    console.log('✅ Git is installed');
    return true;
  } catch (error) {
    console.log('❌ Git is not installed');
    console.log('Please install Git from https://git-scm.com/');
    return false;
  }
}

// Function to check if we're in a Git repository
function checkGitRepository() {
  try {
    runCommand('git rev-parse --git-dir', { stdio: 'pipe' });
    console.log('✅ Current directory is a Git repository');
    return true;
  } catch (error) {
    console.log('❌ Current directory is not a Git repository');
    return false;
  }
}

// Function to initialize Git repository if needed
function initializeGitRepository() {
  if (!checkGitRepository()) {
    console.log('Initializing Git repository...');
    runCommand('git init');
    runCommand('git add .');
    runCommand('git commit -m "Initial commit for Heroku deployment"');
    console.log('✅ Git repository initialized');
  }
}

// Function to create Heroku app
async function createHerokuApp(appName = null) {
  try {
    // Check if app already exists
    console.log('Checking if Heroku app exists...');
    const apps = execSync('heroku apps', { cwd: path.join(__dirname, '..'), stdio: 'pipe' }).toString();
    
    if (appName && apps.includes(appName)) {
      console.log(`✅ Heroku app ${appName} already exists`);
      runCommand(`heroku git:remote -a ${appName}`);
      return appName;
    } else {
      console.log('Creating new Heroku app...');
      if (appName) {
        runCommand(`heroku create ${appName}`);
        return appName;
      } else {
        const output = execSync('heroku create', { cwd: path.join(__dirname, '..'), stdio: 'pipe' }).toString();
        const appNameMatch = output.match(/https:\/\/([^.]+)\.herokuapp\.com/);
        if (appNameMatch) {
          console.log(`✅ Created Heroku app: ${appNameMatch[1]}`);
          return appNameMatch[1];
        }
        return null;
      }
    }
  } catch (error) {
    console.error('Error creating Heroku app:', error.message);
    return null;
  }
}

// Function to add Heroku Postgres addon
function addHerokuPostgres() {
  try {
    console.log('Adding Heroku Postgres addon...');
    runCommand('heroku addons:create heroku-postgresql:hobby-dev');
    console.log('✅ Heroku Postgres addon added');
  } catch (error) {
    console.log('Note: Heroku Postgres addon may already be installed or there was an error');
  }
}

// Function to set Heroku config vars
function setHerokuConfigVars() {
  try {
    console.log('Setting Heroku config vars...');
    
    // Set Node.js version
    runCommand('heroku config:set NODE_ENV=production');
    
    // Set other config vars (these will need to be updated with real values)
    runCommand('heroku config:set EMAIL_SERVICE=sendgrid');
    runCommand('heroku config:set APP_NAME="Mietrecht Webinterface"');
    
    console.log('✅ Heroku config vars set');
  } catch (error) {
    console.error('Error setting Heroku config vars:', error.message);
  }
}

// Function to deploy to Heroku
function deployToHeroku() {
  try {
    console.log('Deploying to Heroku...');
    runCommand('git push heroku main');
    console.log('✅ Deployment completed');
  } catch (error) {
    console.error('Error deploying to Heroku:', error.message);
  }
}

// Function to open deployed app
function openDeployedApp() {
  try {
    console.log('Opening deployed app...');
    runCommand('heroku open');
  } catch (error) {
    console.log('Could not open app automatically. Visit your app URL in a browser.');
  }
}

// Main deployment function
async function deployToHerokuMain() {
  console.log('🚀 Starting Heroku deployment process...\n');
  
  // Check prerequisites
  if (!checkHerokuCLI() || !checkGit()) {
    console.log('\n❌ Please install the missing prerequisites and try again.');
    process.exit(1);
  }
  
  try {
    // Initialize Git repository if needed
    initializeGitRepository();
    
    // Create Heroku app
    const appName = await createHerokuApp();
    
    // Add Heroku Postgres
    addHerokuPostgres();
    
    // Set config vars
    setHerokuConfigVars();
    
    // Deploy
    deployToHeroku();
    
    // Open app
    openDeployedApp();
    
    console.log('\n🎉 Heroku deployment completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Set your actual config vars using: heroku config:set KEY=VALUE');
    console.log('2. Run database initialization: heroku run npm run init-db');
    console.log('3. Check logs if needed: heroku logs --tail');
    
  } catch (error) {
    console.error('❌ Heroku deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  deployToHerokuMain();
}

module.exports = {
  checkHerokuCLI,
  checkGit,
  initializeGitRepository,
  createHerokuApp,
  addHerokuPostgres,
  setHerokuConfigVars,
  deployToHeroku,
  deployToHerokuMain
};