# Alert Correlation Engine

The Alert Correlation Engine is an advanced feature of the monitoring system that identifies patterns and relationships between alerts to reduce noise and provide more meaningful insights.

## Overview

The correlation engine uses machine learning-based pattern recognition to:

1. Identify recurring alert patterns
2. Group related alerts into meaningful clusters
3. Reduce alert fatigue by correlating similar events
4. Provide actionable insights based on historical alert data

## How It Works

### Pattern Recognition

The engine comes with predefined patterns for common security scenarios:

- **Brute Force Attack Pattern**: Multiple failed login attempts followed by a successful login
- **Performance Degradation Pattern**: High CPU usage followed by slow response times
- **Unusual Data Access Pattern**: Multiple data export events from a single user

### Alert Grouping

When alerts are received, the engine:

1. Checks for existing correlated groups within the correlation window
2. Attempts to match alerts against known patterns
3. Creates new groups when patterns are detected
4. Updates confidence scores based on correlation strength

### Confidence Scoring

Each correlated group receives a confidence score between 0.0 and 1.0:

- **0.0-0.3**: Low confidence, likely unrelated alerts
- **0.3-0.7**: Medium confidence, possibly related
- **0.7-1.0**: High confidence, strong correlation detected

## Configuration

To enable alert correlation, set the following environment variables:

```bash
# Enable alert correlation
ALERT_CORRELATION_ENABLED=true

# Set correlation window in milliseconds (default: 300000ms / 5 minutes)
ALERT_CORRELATION_WINDOW_MS=300000
```

## Usage

### Creating Alerts with Correlation

When creating alerts through the AdvancedAlertManager, the correlation engine automatically processes them:

```typescript
const alertManager = new AdvancedAlertManager({
  enabled: true,
  correlationEnabled: true,
  correlationWindowMs: 300000
});

// Create an alert - it will be automatically correlated
const alert = alertManager.createAlert(
  AlertSeverity.WARNING,
  'Failed Login Attempt',
  'User admin failed to login',
  {
    userId: 'admin',
    ipAddress: '192.168.1.100'
  }
);
```

### Working with Correlated Groups

```typescript
// Get correlation statistics
const stats = alertManager.getCorrelationStatistics();
console.log(`Total correlated groups: ${stats.totalGroups}`);

// Get known patterns
const patterns = alertManager.getKnownPatterns();
console.log(`Known patterns: ${patterns.length}`);

// Resolve a correlated group
const success = alertManager.resolveCorrelatedGroup('group-id-123');
```

## Custom Patterns

You can define custom alert patterns:

```typescript
const customPattern = {
  id: 'custom_pattern_1',
  name: 'Custom Alert Pattern',
  description: 'Multiple database connection failures',
  pattern: ['db_connection_failure', 'db_connection_failure', 'db_connection_failure'],
  frequency: 0,
  severity: AlertSeverity.ERROR,
  recommendations: [
    'Check database server status',
    'Review connection pool settings',
    'Monitor database logs'
  ]
};

alertManager.addPattern(customPattern);
```

## Benefits

1. **Reduced Alert Fatigue**: Fewer notifications by grouping related alerts
2. **Actionable Insights**: Clear recommendations based on identified patterns
3. **Historical Analysis**: Learn from past alert patterns to improve future detection
4. **Scalable Architecture**: Handles large volumes of alerts efficiently

## Best Practices

1. **Tune Correlation Window**: Adjust the correlation window based on your system's typical alert patterns
2. **Regular Pattern Review**: Periodically review and update alert patterns based on new threat intelligence
3. **Monitor Confidence Scores**: Pay attention to low-confidence correlations that might indicate new patterns
4. **Combine with Deduplication**: Use alert deduplication alongside correlation for optimal noise reduction