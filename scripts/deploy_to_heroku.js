/**
 * Heroku Deployment Script for GitHub-Asana Integration
 * This script helps deploy the webhook handler to Heroku
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
      cwd: path.join(__dirname),
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

// Function to create Heroku app
async function createHerokuApp() {
  try {
    // Check if we're already in a Heroku app directory
    try {
      runCommand('heroku apps:info', { stdio: 'pipe' });
      console.log('✅ Already in a Heroku app directory');
      return true;
    } catch (error) {
      // Not in a Heroku app directory, create a new one
      console.log('Creating new Heroku app...');
      runCommand('heroku create github-asana-integration-smartlaw');
      console.log('✅ Heroku app created successfully');
      return true;
    }
  } catch (error) {
    console.log('❌ Failed to create Heroku app');
    return false;
  }
}

// Function to set up environment variables
function setupEnvironmentVariables() {
  console.log('Setting up environment variables...');
  
  // These are placeholder values - in a real deployment, you would use actual values
  const envVars = {
    ASANA_ACCESS_TOKEN: 'your_asana_personal_access_token_here',
    GITHUB_WEBHOOK_SECRET: 'your_github_webhook_secret_here',
    ASANA_WORKSPACE_ID: 'your_asana_workspace_id_here'
  };
  
  try {
    for (const [key, value] of Object.entries(envVars)) {
      runCommand(`heroku config:set ${key}=${value}`);
    }
    console.log('✅ Environment variables set');
    return true;
  } catch (error) {
    console.log('❌ Failed to set environment variables');
    return false;
  }
}

// Function to create Procfile if it doesn't exist
function createProcfile() {
  const procfilePath = path.join(__dirname, '..', 'Procfile');
  if (!fs.existsSync(procfilePath)) {
    const procfileContent = 'web: cd scripts && node github_asana_webhook.js\n';
    fs.writeFileSync(procfilePath, procfileContent);
    console.log('✅ Procfile created');
  } else {
    console.log('✅ Procfile already exists');
  }
}

// Function to create .gitignore if it doesn't exist
function createGitignore() {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    const gitignoreContent = `node_modules/
.env
.env.*
!.env.github-asana
`;
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ .gitignore created');
  } else {
    console.log('✅ .gitignore already exists');
  }
}

// Function to deploy to Heroku
async function deployToHeroku() {
  console.log('🚀 Starting Heroku deployment process...\n');
  
  // Check Heroku CLI
  if (!checkHerokuCLI()) {
    return false;
  }
  
  // Create Procfile
  createProcfile();
  
  // Create .gitignore
  createGitignore();
  
  // Initialize git repository if needed
  try {
    runCommand('git init', { stdio: 'pipe' });
    console.log('✅ Git repository initialized');
  } catch (error) {
    console.log('ℹ️  Git repository already exists or error initializing');
  }
  
  // Add files to git
  try {
    runCommand('git add .');
    console.log('✅ Files added to git');
  } catch (error) {
    console.log('❌ Failed to add files to git');
    return false;
  }
  
  // Commit files
  try {
    runCommand('git commit -m "Initial commit for GitHub-Asana integration"');
    console.log('✅ Files committed');
  } catch (error) {
    console.log('ℹ️  No changes to commit or error committing');
  }
  
  // Create Heroku app
  if (!await createHerokuApp()) {
    return false;
  }
  
  // Set up environment variables
  if (!setupEnvironmentVariables()) {
    return false;
  }
  
  // Deploy to Heroku
  try {
    console.log('Deploying to Heroku...');
    runCommand('git push heroku main');
    console.log('✅ Deployment successful!');
    
    // Get the app URL
    const appName = execSync('heroku apps:info --json', { cwd: path.join(__dirname), stdio: 'pipe' })
      .toString()
      .match(/"name":"([^"]+)"/)[1];
    
    console.log(`\n🎉 Deployment completed successfully!`);
    console.log(`应用查看: https://${appName}.herokuapp.com`);
    console.log(`Health endpoint: https://${appName}.herokuapp.com/health`);
    console.log(`Webhook endpoint: https://${appName}.herokuapp.com/webhook/github`);
    
    return true;
  } catch (error) {
    console.log('❌ Deployment failed');
    return false;
  }
}

// Main function
async function main() {
  try {
    await deployToHeroku();
  } catch (error) {
    console.error('Deployment process failed:', error.message);
    process.exit(1);
  }
}

// Run if script is executed directly
if (require.main === module) {
  main();
}

module.exports = { deployToHeroku };