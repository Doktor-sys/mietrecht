/**
 * Test script for Docker setup
 * This script verifies that the Docker environment is set up correctly.
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testDockerSetup() {
  try {
    // Check if Docker is installed
    console.log('Checking Docker installation...');
    const { stdout: dockerVersion } = await execAsync('docker --version');
    console.log('Docker version:', dockerVersion.trim());

    // Check if Docker Compose is installed
    console.log('Checking Docker Compose installation...');
    const { stdout: composeVersion } = await execAsync('docker-compose --version');
    console.log('Docker Compose version:', composeVersion.trim());

    // Check if Docker daemon is running
    console.log('Checking Docker daemon status...');
    await execAsync('docker info');
    console.log('Docker daemon is running');

    console.log('Docker setup verification completed successfully!');
    return true;
  } catch (error) {
    console.error('Docker setup verification failed:', error.message);
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testDockerSetup().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testDockerSetup };