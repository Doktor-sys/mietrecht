/**
 * Alert Rules Engine
 * This module defines and evaluates alert rules.
 */

/**
 * Alert rule definition
 */
class AlertRule {
  constructor(name, condition, severity, channels, throttleMinutes = 0) {
    this.name = name;
    this.condition = condition; // Function that returns true/false
    this.severity = severity; // info, warning, error
    this.channels = channels; // Array of notification channels
    this.throttleMinutes = throttleMinutes; // Throttling period in minutes
    this.lastTriggered = null; // Timestamp of last trigger
  }

  /**
   * Check if the rule condition is met
   * @param {Object} context - Context data for evaluation
   * @returns {boolean} True if condition is met
   */
  evaluate(context) {
    return this.condition(context);
  }

  /**
   * Check if the rule can be triggered (considering throttling)
   * @returns {boolean} True if rule can be triggered
   */
  canTrigger() {
    if (this.throttleMinutes === 0) {
      return true;
    }

    if (!this.lastTriggered) {
      return true;
    }

    const now = new Date();
    const minutesSinceLastTrigger = (now - this.lastTriggered) / (1000 * 60);
    
    return minutesSinceLastTrigger >= this.throttleMinutes;
  }

  /**
   * Mark the rule as triggered
   */
  markTriggered() {
    this.lastTriggered = new Date();
  }
}

/**
 * Alert rules manager
 */
class AlertRulesManager {
  constructor() {
    this.rules = [];
  }

  /**
   * Add a new alert rule
   * @param {AlertRule} rule - Alert rule to add
   */
  addRule(rule) {
    this.rules.push(rule);
  }

  /**
   * Evaluate all rules against context data
   * @param {Object} context - Context data for evaluation
   * @returns {Array} Array of triggered rules
   */
  evaluateRules(context) {
    const triggeredRules = [];

    for (const rule of this.rules) {
      if (rule.evaluate(context) && rule.canTrigger()) {
        triggeredRules.push(rule);
        rule.markTriggered();
      }
    }

    return triggeredRules;
  }

  /**
   * Get all rules
   * @returns {Array} Array of all rules
   */
  getRules() {
    return this.rules;
  }
}

/**
 * Predefined alert rules
 */

// High error rate alert
const highErrorRateRule = new AlertRule(
  'High Error Rate',
  (context) => context.errorRate > 0.05, // More than 5% errors
  'error',
  ['email', 'sms'],
  60 // Throttle for 1 hour
);

// Low cache hit rate alert
const lowCacheHitRateRule = new AlertRule(
  'Low Cache Hit Rate',
  (context) => context.cacheHitRate < 0.5, // Less than 50% cache hits
  'warning',
  ['email'],
  120 // Throttle for 2 hours
);

// High response time alert
const highResponseTimeRule = new AlertRule(
  'High Response Time',
  (context) => context.avgResponseTime > 2000, // More than 2 seconds
  'warning',
  ['email'],
  30 // Throttle for 30 minutes
);

// DataSource offline alert
const dataSourceOfflineRule = new AlertRule(
  'Data Source Offline',
  (context) => {
    for (const sourceStatus of Object.values(context.dataSourceStatus)) {
      if (sourceStatus === 'offline') {
        return true;
      }
    }
    return false;
  },
  'error',
  ['email', 'sms'],
  15 // Throttle for 15 minutes
);

// No new decisions alert
const noNewDecisionsRule = new AlertRule(
  'No New Decisions',
  (context) => context.newDecisionsCount === 0 && context.expectedDecisions > 0,
  'warning',
  ['email'],
  1440 // Throttle for 24 hours
);

// Export classes and predefined rules
module.exports = {
  AlertRule,
  AlertRulesManager,
  highErrorRateRule,
  lowCacheHitRateRule,
  highResponseTimeRule,
  dataSourceOfflineRule,
  noNewDecisionsRule
};