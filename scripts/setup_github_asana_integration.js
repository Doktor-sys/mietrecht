/**
 * GitHub-Asana Integration Setup Script
 * This script guides users through setting up the GitHub-Asana integration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration file path
const configPath = path.join(__dirname, '..', '.env.github-asana');

// Function to prompt user for input
function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const fullQuestion = defaultValue 
      ? `${question} (default: ${defaultValue}): ` 
      : `${question}: `;
      
    rl.question(fullQuestion, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Function to validate Asana access token format
function validateAsanaToken(token) {
  // Asana personal access tokens are typically 32 characters long
  return token.length >= 32;
}

// Function to validate GitHub webhook secret
function validateGitHubSecret(secret) {
  // Should be at least 16 characters for security
  return secret.length >= 16;
}

// Function to save configuration to .env file
function saveConfig(config) {
  const envContent = `# GitHub-Asana Integration Configuration
ASANA_ACCESS_TOKEN=${config.asanaToken}
GITHUB_WEBHOOK_SECRET=${config.githubSecret}
ASANA_WORKSPACE_ID=${config.workspaceId}
PORT=${config.port}
`;

  try {
    fs.writeFileSync(configPath, envContent);
    console.log(`✅ Configuration saved to ${configPath}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving configuration:', error.message);
    return false;
  }
}

// Function to display setup instructions
function displayInstructions() {
  console.log(`
============================================
 GitHub-Asana Integration Setup
============================================

This script will guide you through setting up the GitHub-Asana integration.

Prerequisites:
1. Asana account with personal access token
2. GitHub repository with admin access
3. This webhook handler running on a server

The integration will:
- Automatically link commits to Asana tasks using task IDs in commit messages
- Update task status based on GitHub activities
- Add commit and pull request information as comments on tasks
`);
}

// Function to display GitHub webhook setup instructions
function displayWebhookInstructions(webhookUrl, secret) {
  console.log(`
============================================
 GitHub Webhook Setup Instructions
============================================

To complete the integration, you need to configure a webhook in your GitHub repository:

1. Go to your GitHub repository settings
2. Navigate to "Webhooks & Services" (or "Webhooks" in newer GitHub UI)
3. Click "Add webhook"
4. Set the following configuration:
   - Payload URL: ${webhookUrl}
   - Content type: application/json
   - Secret: ${secret}
   - Events: Select "Just the push events" or customize to include:
     * push
     * pull_request

5. Click "Add webhook"

After setting up the webhook, start the webhook handler:
   npm start

The integration will now automatically update Asana tasks based on GitHub activities.
`);
}

// Main setup function
async function runSetup() {
  displayInstructions();
  
  try {
    // Get configuration from user
    const asanaToken = await askQuestion('Enter your Asana personal access token');
    if (!validateAsanaToken(asanaToken)) {
      console.log('⚠️  Warning: Asana token seems too short. Please verify it is correct.');
    }
    
    const githubSecret = await askQuestion('Enter a secret for GitHub webhook verification', 'mySecret123');
    if (!validateGitHubSecret(githubSecret)) {
      console.log('⚠️  Warning: GitHub secret should be at least 16 characters for security.');
    }
    
    const workspaceId = await askQuestion('Enter your Asana workspace ID (optional, can be left blank)');
    
    const port = await askQuestion('Enter the port for the webhook handler', '3000');
    
    // Confirm configuration
    console.log(`
============================================
 Configuration Summary
============================================`);
    console.log(`Asana Token: ${asanaToken ? '✅ Provided' : '❌ Missing'}`);
    console.log(`GitHub Secret: ${githubSecret ? '✅ Provided' : '❌ Missing'}`);
    console.log(`Workspace ID: ${workspaceId || 'Not provided'}`);
    console.log(`Port: ${port}`);
    
    const confirm = await askQuestion('\nSave this configuration? (y/N)', 'N');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
    
    // Save configuration
    const config = {
      asanaToken,
      githubSecret,
      workspaceId,
      port
    };
    
    if (saveConfig(config)) {
      console.log('\n✅ Setup completed successfully!');
      
      // Display webhook instructions
      const webhookUrl = `http://your-server.com:${port}/webhook/github`;
      displayWebhookInstructions(webhookUrl, githubSecret);
      
      console.log(`
============================================
 Next Steps
============================================

1. Deploy this webhook handler to a server accessible from the internet
2. Update the webhook URL in GitHub with your actual server URL
3. Start the webhook handler with: npm start
4. Test the integration by making a commit with a task ID

For testing locally, you can:
1. Use ngrok to expose your local server:
   ngrok http ${port}
2. Update the GitHub webhook URL with the ngrok URL
3. Start the webhook handler: npm run dev
`);
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run setup if script is executed directly
if (require.main === module) {
  runSetup();
}

module.exports = { runSetup };