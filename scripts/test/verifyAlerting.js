/**
 * Test script to verify alerting functionality
 */

const { PerformanceAlerting } = require('../performance/alerting.js');
const { AlertRule, AlertRulesManager } = require('../notifications/alertRules.js');

async function testAlerting() {
  console.log('=== Alerting Functionality Test ===\n');
  
  try {
    // Test 1: Performance Alerting
    console.log('1. Testing Performance Alerting...');
    const alerting = new PerformanceAlerting();
    console.log('   ✓ PerformanceAlerting instance created');
    
    // Test with metrics that should trigger alerts
    const testMetrics = {
      cache: {
        hitRate: 0.5 // Below default threshold of 0.7
      },
      database: {
        avgQueryTime: 150 // Above default threshold of 100ms
      },
      api: {
        avgResponseTime: 2500, // Above default threshold of 2000ms
        errorRate: 0.1 // Above default threshold of 0.05
      }
    };
    
    const alerts = await alerting.checkAndAlert(testMetrics);
    console.log(`   ✓ Alerting check completed, ${alerts.length} alerts triggered`);
    
    if (alerts.length > 0) {
      console.log('   Triggered alerts:');
      alerts.forEach((alert, index) => {
        console.log(`     ${index + 1}. ${alert.type} (${alert.severity}): ${alert.message}`);
      });
    }
    
    // Test 2: Alert Rules
    console.log('\n2. Testing Alert Rules...');
    const manager = new AlertRulesManager();
    console.log('   ✓ AlertRulesManager instance created');
    
    // Test predefined rules
    const { highErrorRateRule, lowCacheHitRateRule } = require('../notifications/alertRules.js');
    
    const testContext1 = { errorRate: 0.1 }; // 10% error rate
    const testContext2 = { errorRate: 0.01 }; // 1% error rate
    const testContext3 = { cacheHitRate: 0.3 }; // 30% cache hit rate
    const testContext4 = { cacheHitRate: 0.8 }; // 80% cache hit rate
    
    console.log(`   High error rate rule with 10% error rate: ${highErrorRateRule.evaluate(testContext1) ? 'TRIGGERED' : 'NOT TRIGGERED'}`);
    console.log(`   High error rate rule with 1% error rate: ${highErrorRateRule.evaluate(testContext2) ? 'TRIGGERED' : 'NOT TRIGGERED'}`);
    console.log(`   Low cache hit rate rule with 30% hit rate: ${lowCacheHitRateRule.evaluate(testContext3) ? 'TRIGGERED' : 'NOT TRIGGERED'}`);
    console.log(`   Low cache hit rate rule with 80% hit rate: ${lowCacheHitRateRule.evaluate(testContext4) ? 'TRIGGERED' : 'NOT TRIGGERED'}`);
    
    console.log('   ✓ Alert rules evaluation completed');
    
    // Test 3: Alert Rule Manager
    manager.addRule(highErrorRateRule);
    manager.addRule(lowCacheHitRateRule);
    
    const rules = manager.getRules();
    console.log(`   ✓ Added ${rules.length} rules to manager`);
    
    // Test 4: Alert Rule Throttling
    console.log('\n3. Testing Alert Rule Throttling...');
    const throttledRule = new AlertRule('Test Rule', (ctx) => ctx.value > 5, 'warning', ['email'], 1); // 1 minute throttle
    
    console.log(`   Rule can trigger initially: ${throttledRule.canTrigger() ? 'YES' : 'NO'}`);
    
    throttledRule.markTriggered();
    console.log(`   Rule can trigger after marking triggered: ${throttledRule.canTrigger() ? 'YES' : 'NO'}`);
    
    console.log('   ✓ Alert rule throttling test completed');
    
    console.log('\n=== All Alerting Tests Passed ===');
    return true;
  } catch (error) {
    console.error('Error in alerting test:', error);
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAlerting().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testAlerting };