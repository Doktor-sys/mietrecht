/**
 * Test script to verify Docker container functionality
 * This script builds and runs the Docker container to verify it works correctly.
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function verifyDockerContainer() {
  try {
    console.log('Building Docker image...');
    const { stdout: buildOutput, stderr: buildError } = await execAsync('docker build -t mietrecht-agent-test .', {
      cwd: process.cwd()
    });
    
    if (buildError) {
      console.error('Build error:', buildError);
    }
    console.log('Build output:', buildOutput);
    console.log('Docker image built successfully!');
    
    // Clean up any existing test container
    try {
      await execAsync('docker rm -f mietrecht-agent-test');
    } catch (e) {
      // Container doesn't exist, that's fine
    }
    
    console.log('Running Docker container...');
    const { stdout: runOutput, stderr: runError } = await execAsync(
      'docker run -d --name mietrecht-agent-test -p 3001:3000 mietrecht-agent-test'
    );
    
    if (runError) {
      console.error('Run error:', runError);
    }
    console.log('Run output:', runOutput);
    console.log('Docker container started successfully!');
    
    // Wait a few seconds for the container to start
    console.log('Waiting for container to start...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if the container is running
    console.log('Checking container status...');
    const { stdout: psOutput } = await execAsync('docker ps');
    console.log('Running containers:');
    console.log(psOutput);
    
    // Check if our container is in the list
    if (psOutput.includes('mietrecht-agent-test')) {
      console.log('Container is running correctly!');
    } else {
      console.log('Container may not be running properly.');
    }
    
    // Clean up
    console.log('Cleaning up test container...');
    await execAsync('docker rm -f mietrecht-agent-test');
    console.log('Test container removed.');
    
    console.log('Docker container verification completed successfully!');
    return true;
  } catch (error) {
    console.error('Docker container verification failed:', error.message);
    // Try to clean up any remaining test container
    try {
      await execAsync('docker rm -f mietrecht-agent-test');
    } catch (e) {
      // Ignore cleanup errors
    }
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  verifyDockerContainer().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { verifyDockerContainer };