#!/usr/bin/env node

/**
 * Example script demonstrating the Advanced Alert Manager
 * This script shows how to use the advanced alerting features
 */

const { AdvancedAlertManager, AlertSeverity } = require('../dist/services/AdvancedAlertManager');

async function runExample() {
  console.log('🚀 Starting Advanced Alert Manager Example');
  
  // Create alert manager with example configuration
  const alertManager = new AdvancedAlertManager({
    enabled: true,
    // In a real implementation, these would come from environment variables
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    slackChannel: process.env.SLACK_CHANNEL,
    pagerDutyIntegrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
    teamsWebhookUrl: process.env.TEAMS_WEBHOOK_URL,
    emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS ? process.env.ALERT_EMAIL_RECIPIENTS.split(',') : [],
    alertDeduplicationWindowMs: 300000, // 5 minutes
    correlationEnabled: true,
    correlationWindowMs: 300000, // 5 minutes
  });
  
  console.log('✅ Alert Manager initialized');
  
  // Example 1: Create a critical security alert
  console.log('\n📧 Creating critical security alert...');
  const criticalAlert = alertManager.createAlert(
    AlertSeverity.CRITICAL,
    'Unauthorized Database Access',
    'Multiple failed login attempts detected from suspicious IP address',
    {
      ipAddress: '192.168.1.100',
      userId: 'user-12345',
      attempts: 15,
      timeframe: 'last 5 minutes',
      recommendedAction: 'Block IP and notify security team'
    }
  );
  
  console.log(`✅ Critical alert created: ${criticalAlert.title}`);
  
  // Example 2: Create a warning performance alert
  console.log('\n📊 Creating performance warning alert...');
  const warningAlert = alertManager.createAlert(
    AlertSeverity.WARNING,
    'High CPU Usage',
    'CPU usage exceeded 85% threshold on application server',
    {
      server: 'app-server-01',
      cpuUsage: 87.5,
      threshold: 85,
      timestamp: new Date().toISOString()
    }
  );
  
  console.log(`✅ Warning alert created: ${warningAlert.title}`);
  
  // Example 3: Create an info alert
  console.log('\nℹ️  Creating info alert...');
  const infoAlert = alertManager.createAlert(
    AlertSeverity.INFO,
    'System Maintenance Completed',
    'Scheduled maintenance window completed successfully',
    {
      maintenanceWindow: '2023-01-01 02:00-04:00 UTC',
      systemsAffected: ['database-primary', 'cache-cluster'],
      duration: '2 hours'
    }
  );
  
  console.log(`✅ Info alert created: ${infoAlert.title}`);
  
  // Example 4: Demonstrate alert resolution
  console.log('\n✅ Resolving critical alert...');
  const resolved = alertManager.resolveAlert(criticalAlert.id);
  console.log(`Alert resolution result: ${resolved ? 'SUCCESS' : 'FAILED'}`);
  
  // Example 5: Get alert statistics
  console.log('\n📈 Getting alert statistics...');
  const stats = alertManager.getStatistics();
  console.log('Alert Statistics:');
  console.log(`  Total Alerts: ${stats.total}`);
  console.log(`  Active Alerts: ${stats.active}`);
  console.log(`  Resolved Alerts: ${stats.resolved}`);
  console.log('  By Severity:');
  console.log(`    Critical: ${stats.bySeverity[AlertSeverity.CRITICAL]}`);
  console.log(`    Error: ${stats.bySeverity[AlertSeverity.ERROR]}`);
  console.log(`    Warning: ${stats.bySeverity[AlertSeverity.WARNING]}`);
  console.log(`    Info: ${stats.bySeverity[AlertSeverity.INFO]}`);
  
  // Example 6: Demonstrate deduplication
  console.log('\n🔄 Testing alert deduplication...');
  const firstAlert = alertManager.createAlert(
    AlertSeverity.WARNING,
    'Duplicate Test Alert',
    'This is a test for deduplication'
  );
  
  // Create duplicate immediately
  const duplicateAlert = alertManager.createAlert(
    AlertSeverity.WARNING,
    'Duplicate Test Alert',
    'This is a test for deduplication'
  );
  
  console.log(`First alert ID: ${firstAlert.id}`);
  console.log(`Duplicate alert ID: ${duplicateAlert.id}`);
  console.log(`Duplicate alert marked as resolved: ${duplicateAlert.resolved}`);
  
  // Example 7: Demonstrate correlation features
  console.log('\n🔗 Testing alert correlation features...');
  
  // Get correlation statistics
  const correlationStats = alertManager.getCorrelationStatistics();
  if (correlationStats) {
    console.log('Correlation Statistics:');
    console.log(`  Total Groups: ${correlationStats.totalGroups}`);
    console.log(`  Active Groups: ${correlationStats.activeGroups}`);
    console.log(`  Average Confidence: ${correlationStats.averageConfidence}`);
  }
  
  // Get known patterns
  const patterns = alertManager.getKnownPatterns();
  console.log(`Known Patterns: ${patterns.length}`);
  
  console.log('\n🎉 Advanced Alert Manager Example Completed');
}

// Run the example
runExample().catch(error => {
  console.error('❌ Error running example:', error);
  process.exit(1);
});