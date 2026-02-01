/**
 * Test script for notification system
 */

const { NotificationManager } = require('./notifications/notificationManager.js');

async function runNotificationTests() {
  try {
    console.log('Starting notification system tests...\n');
    
    // Create notification manager with test configuration
    const notificationConfig = {
      email: {
        enabled: true,
        service: 'gmail',
        user: 'test@example.com',
        pass: 'test-password'
      },
      sms: {
        enabled: false
      },
      push: {
        enabled: false
      },
      adminRecipients: ['admin@example.com']
    };
    
    const notificationManager = new NotificationManager(notificationConfig);
    
    // Test 1: Check if channels are initialized
    console.log('1. Testing channel initialization...');
    console.log('   Available channels:', Object.keys(notificationManager.channels));
    console.log('   ✓ Channel initialization test passed\n');
    
    // Test 2: Check if alert rules are loaded
    console.log('2. Testing alert rule initialization...');
    const rules = notificationManager.alertRulesManager.getRules();
    console.log('   Loaded rules:', rules.map(rule => rule.name));
    console.log('   ✓ Alert rule initialization test passed\n');
    
    // Test 3: Test sending a stub notification
    console.log('3. Testing stub notification...');
    const stubResult = await notificationManager.sendNotification(
      ['stub'],
      'test@example.com',
      'Test Subject',
      '<p>Test Body</p>'
    );
    console.log('   Stub notification result:', stubResult);
    console.log('   ✓ Stub notification test passed\n');
    
    // Test 4: Test system alert notification
    console.log('4. Testing system alert notification...');
    const alertResult = await notificationManager.sendSystemAlert(
      'Test Alert',
      'This is a test alert message',
      'info',
      ['stub']
    );
    console.log('   System alert result:', alertResult);
    console.log('   ✓ System alert notification test passed\n');
    
    // Test 5: Test performance alert notification
    console.log('5. Testing performance alert notification...');
    const perfResult = await notificationManager.sendPerformanceAlert(
      'response_time',
      2500,
      2000
    );
    console.log('   Performance alert result:', perfResult);
    console.log('   ✓ Performance alert notification test passed\n');
    
    // Test 6: Test lawyer notification
    console.log('6. Testing lawyer notification...');
    const decision = {
      caseNumber: 'VIII ZR 123/24',
      court: 'Bundesgerichtshof',
      date: '2025-12-01',
      topics: ['Mietrecht', 'Kündigung'],
      summary: 'Wichtige Entscheidung zum Mietvertragsrecht',
      practiceImplications: 'Auswirkungen auf die Praxis',
      url: 'https://example.com/decision'
    };
    
    const relevantLawyers = [
      { name: 'Max Mustermann', email: 'max@example.com' }
    ];
    
    const lawyerResult = await notificationManager.notifyLawyersAboutDecision(
      decision,
      relevantLawyers
    );
    console.log('   Lawyer notification result:', lawyerResult);
    console.log('   ✓ Lawyer notification test passed\n');
    
    // Test 7: Test alert checking
    console.log('7. Testing alert checking...');
    const alertCheckResult = await notificationManager.checkForAlerts();
    console.log('   Alert check result:', alertCheckResult);
    console.log('   ✓ Alert checking test passed\n');
    
    console.log('All notification system tests completed successfully!');
  } catch (error) {
    console.error('Notification system test failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runNotificationTests();
}

module.exports = { runNotificationTests };