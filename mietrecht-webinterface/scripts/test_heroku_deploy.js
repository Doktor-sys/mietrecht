/**
 * Test script for Heroku deployment functions
 */

const { 
  checkHerokuCLI, 
  checkGit, 
  initializeGitRepository,
  setHerokuConfigVars
} = require('./deploy_heroku');

async function runTests() {
  console.log('🧪 Testing Heroku deployment functions');
  console.log('====================================');
  
  try {
    // Test 1: Check Heroku CLI
    console.log('\n1. Testing Heroku CLI check...');
    const herokuInstalled = checkHerokuCLI();
    console.log(`✅ Heroku CLI check completed: ${herokuInstalled ? 'Installed' : 'Not installed'}`);
    
    // Test 2: Check Git
    console.log('\n2. Testing Git check...');
    const gitInstalled = checkGit();
    console.log(`✅ Git check completed: ${gitInstalled ? 'Installed' : 'Not installed'}`);
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };