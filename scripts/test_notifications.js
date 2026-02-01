/**
 * Test script for all notification functionality
 */

const { runNotificationTests } = require('./notifications/testNotifications.js');

async function runAllNotificationTests() {
  try {
    console.log('Starting all notification tests...\n');
    
    // Run notification system tests
    await runNotificationTests();
    
    console.log('\nAll notification tests completed successfully!');
  } catch (error) {
    console.error('Notification test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllNotificationTests();
}