/**
 * Deployment script for Mietrecht Webinterface
 */

const fs = require('fs');
const path = require('path');

// Deployment configuration
const config = {
  // Application name
  appName: 'mietrecht-webinterface',
  
  // Deployment targets
  targets: {
    heroku: {
      name: 'Heroku',
      description: 'Deploy to Heroku platform',
      steps: [
        'Ensure Heroku CLI is installed',
        'Log in to Heroku: heroku login',
        'Create Heroku app: heroku create',
        'Set environment variables',
        'Deploy: git push heroku main'
      ]
    },
    docker: {
      name: 'Docker',
      description: 'Deploy using Docker container',
      steps: [
        'Build Docker image: docker build -t mietrecht-webinterface .',
        'Run container: docker run -p 3002:3002 mietrecht-webinterface'
      ]
    },
    traditional: {
      name: 'Traditional Server',
      description: 'Deploy to traditional server',
      steps: [
        'Upload application files to server',
        'Install Node.js dependencies: npm install',
        'Configure environment variables',
        'Start application: npm start'
      ]
    }
  }
};

// Function to create deployment instructions
function createDeploymentInstructions() {
  console.log('🚀 Creating deployment instructions...\n');
  
  // Create deployment directory if it doesn't exist
  const deployDir = path.join(__dirname, '..', 'deployment');
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }
  
  // Generate deployment guide
  let guide = `# Deployment Guide for ${config.appName}\n\n`;
  guide += '## Overview\n\n';
  guide += 'This guide provides instructions for deploying the Mietrecht Webinterface to different environments.\n\n';
  
  guide += '## Prerequisites\n\n';
  guide += '- Node.js 18 or higher\n';
  guide += '- npm package manager\n';
  guide += '- Git (for Heroku deployment)\n';
  guide += '- Docker (for Docker deployment)\n\n';
  
  // Add instructions for each target
  for (const [key, target] of Object.entries(config.targets)) {
    guide += `## ${target.name} Deployment\n\n`;
    guide += `${target.description}\n\n`;
    guide += '### Steps:\n\n';
    
    target.steps.forEach((step, index) => {
      guide += `${index + 1}. ${step}\n`;
    });
    
    guide += '\n';
  }
  
  // Write guide to file
  const guidePath = path.join(deployDir, 'DEPLOYMENT_GUIDE.md');
  fs.writeFileSync(guidePath, guide);
  
  console.log(`✅ Deployment guide created at: ${guidePath}\n`);
  
  return guidePath;
}

// Function to create Heroku deployment files
function createHerokuDeployment() {
  console.log('🚀 Creating Heroku deployment files...\n');
  
  // Create Procfile
  const procfileContent = 'web: npm start\n';
  const procfilePath = path.join(__dirname, '..', 'Procfile');
  fs.writeFileSync(procfilePath, procfileContent);
  
  console.log(`✅ Procfile created at: ${procfilePath}\n`);
  
  // Create .slugignore file for Heroku
  const slugignoreContent = '# Files and directories to exclude from Heroku slug\n';
  const slugignorePath = path.join(__dirname, '..', '.slugignore');
  fs.writeFileSync(slugignorePath, slugignoreContent);
  
  console.log(`✅ .slugignore created at: ${slugignorePath}\n`);
  
  return { procfilePath, slugignorePath };
}

// Function to create Docker deployment files
function createDockerDeployment() {
  console.log('🚀 Creating Docker deployment files...\n');
  
  // Create Dockerfile
  const dockerfileContent = `# Use Node.js 18 base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3002

# Start application
CMD ["npm", "start"]
`;
  
  const dockerfilePath = path.join(__dirname, '..', 'Dockerfile');
  fs.writeFileSync(dockerfilePath, dockerfileContent);
  
  console.log(`✅ Dockerfile created at: ${dockerfilePath}\n`);
  
  // Create .dockerignore file
  const dockerignoreContent = `node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.example
.nyc_output
coverage
.nyc_output
docs
scripts/test-*.js
`;
  
  const dockerignorePath = path.join(__dirname, '..', '.dockerignore');
  fs.writeFileSync(dockerignorePath, dockerignoreContent);
  
  console.log(`✅ .dockerignore created at: ${dockerignorePath}\n`);
  
  return { dockerfilePath, dockerignorePath };
}

// Function to create environment configuration files
function createEnvironmentConfigs() {
  console.log('🚀 Creating environment configuration files...\n');
  
  // Create production environment file
  const prodEnvContent = `# Production Environment Configuration

# Server Configuration
PORT=3002
NODE_ENV=production

# Database Configuration
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=mietrecht_agent
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=true

# Email Configuration
EMAIL_SERVICE=your-email-service
EMAIL_USER=your-email-user
EMAIL_PASS=your-email-password

# API Keys
BGH_API_KEY=your-bgh-api-key
LANDGERICHTE_API_KEY=your-landgerichte-api-key
`;
  
  const prodEnvPath = path.join(__dirname, '..', '.env.production');
  fs.writeFileSync(prodEnvPath, prodEnvContent);
  
  console.log(`✅ Production environment file created at: ${prodEnvPath}\n`);
  
  return { prodEnvPath };
}

// Main deployment function
async function deploy() {
  console.log('🚀 Starting deployment preparation...\n');
  
  try {
    // Create deployment instructions
    const guidePath = createDeploymentInstructions();
    
    // Create Heroku deployment files
    const herokuFiles = createHerokuDeployment();
    
    // Create Docker deployment files
    const dockerFiles = createDockerDeployment();
    
    // Create environment configuration files
    const envFiles = createEnvironmentConfigs();
    
    // Summary
    console.log('🎉 Deployment preparation completed successfully!\n');
    console.log('Files created:');
    console.log(`  - ${guidePath}`);
    console.log(`  - ${herokuFiles.procfilePath}`);
    console.log(`  - ${herokuFiles.slugignorePath}`);
    console.log(`  - ${dockerFiles.dockerfilePath}`);
    console.log(`  - ${dockerFiles.dockerignorePath}`);
    console.log(`  - ${envFiles.prodEnvPath}`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Review the deployment guide for detailed instructions');
    console.log('2. Choose your deployment target (Heroku, Docker, or Traditional)');
    console.log('3. Configure environment variables for your target environment');
    console.log('4. Follow the specific deployment steps for your chosen target');
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
    process.exit(1);
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  deploy();
}

module.exports = {
  createDeploymentInstructions,
  createHerokuDeployment,
  createDockerDeployment,
  createEnvironmentConfigs,
  deploy
};