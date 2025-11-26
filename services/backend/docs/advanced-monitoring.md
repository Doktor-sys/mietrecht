# Advanced Monitoring System

## Overview

The Advanced Monitoring System extends the existing alerting capabilities with additional notification channels and enhanced features. This system provides comprehensive alerting through multiple channels including email, Slack, Microsoft Teams, PagerDuty, SMS, and custom webhooks.

## Features

### Multi-Channel Notifications
- **Email Alerts**: HTML-formatted email notifications with detailed alert information
- **Slack Integration**: Rich notifications with color-coded severity indicators
- **Microsoft Teams Integration**: Card-based notifications for Teams channels
- **PagerDuty Integration**: Incident creation for critical alerts with phone call escalation
- **SMS Alerts**: Text message notifications via Twilio for critical alerts
- **Custom Webhooks**: Integration with any system that accepts webhook notifications

### Advanced Features
- **Alert Deduplication**: Prevents notification spam by deduplicating similar alerts within a configurable time window
- **Alert Correlation**: Identifies patterns and relationships between alerts to reduce noise and provide meaningful insights
- **Configurable Routing**: Different notification channels for different severity levels
- **Rich Alert Metadata**: Detailed context information in all notifications
- **Bulk Notification Handling**: Efficient handling of notifications to multiple recipients

## Configuration

### Environment Variables

```bash
# Microsoft Teams Integration
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR-TEAMS-WEBHOOK

# Twilio SMS Integration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890
TWILIO_CRITICAL_ALERT_NUMBERS=+1234567890,+0987654321

# Custom Webhook URLs (comma-separated)
CUSTOM_WEBHOOK_URLS=https://your-webhook1.com,https://your-webhook2.com

# Email Recipients (comma-separated)
ALERT_EMAIL_RECIPIENTS=admin@yourcompany.com,security@yourcompany.com

# Alert Deduplication Window (in milliseconds)
ALERT_DEDUPLICATION_WINDOW_MS=300000

# Alert Correlation (enabled/disabled)
ALERT_CORRELATION_ENABLED=true

# Alert Correlation Window (in milliseconds)
ALERT_CORRELATION_WINDOW_MS=300000
```

### Configuration in Code

The advanced monitoring system can be configured programmatically:

```typescript
import { AdvancedAlertManager, AdvancedAlertConfig } from '../services/AdvancedAlertManager';

const config: AdvancedAlertConfig = {
  enabled: true,
  teamsWebhookUrl: process.env.TEAMS_WEBHOOK_URL,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER,
  twilioCriticalAlertNumbers: process.env.TWILIO_CRITICAL_ALERT_NUMBERS?.split(',') || [],
  customWebhookUrls: process.env.CUSTOM_WEBHOOK_URLS?.split(',') || [],
  emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
  alertDeduplicationWindowMs: process.env.ALERT_DEDUPLICATION_WINDOW_MS ? 
    parseInt(process.env.ALERT_DEDUPLICATION_WINDOW_MS, 10) : 300000,
  correlationEnabled: process.env.ALERT_CORRELATION_ENABLED === 'true',
  correlationWindowMs: process.env.ALERT_CORRELATION_WINDOW_MS ? 
    parseInt(process.env.ALERT_CORRELATION_WINDOW_MS, 10) : 300000,
  // Existing configuration
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  slackChannel: process.env.SLACK_CHANNEL,
  pagerDutyIntegrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
  pagerDutyApiKey: process.env.PAGERDUTY_API_KEY
};

const alertManager = new AdvancedAlertManager(config);
```

## Usage

### Creating Alerts

```typescript
import { AlertSeverity } from '../services/kms/AlertManager';

// Create a critical alert
const alert = alertManager.createAlert(
  AlertSeverity.CRITICAL,
  'Database Connection Failed',
  'Unable to connect to the primary database server',
  {
    server: 'db-primary-01',
    error: 'Connection timeout',
    timestamp: new Date().toISOString()
  }
);

// Create a warning alert
const warningAlert = alertManager.createAlert(
  AlertSeverity.WARNING,
  'High CPU Usage',
  'CPU usage exceeded 80% threshold',
  {
    server: 'app-server-01',
    cpuUsage: 85.5,
    threshold: 80
  }
);
```

### Resolving Alerts

```typescript
// Mark an alert as resolved
const resolved = alertManager.resolveAlert(alert.id);
if (resolved) {
  console.log('Alert successfully resolved');
}
```

### Getting Alert Statistics

```typescript
// Get alert statistics
const stats = alertManager.getStatistics();
console.log(`Total alerts: ${stats.total}`);
console.log(`Active alerts: ${stats.active}`);
console.log(`Resolved alerts: ${stats.resolved}`);
console.log(`By severity:`, stats.bySeverity);
```

## Notification Channels

### Email Notifications

Email notifications are sent as HTML-formatted messages with detailed alert information. They include:
- Color-coded severity indicators
- Alert title and message
- Timestamp
- Additional metadata in a structured format

Emails are sent to all configured recipients for all alert severities by default, but can be configured to only send critical alerts via email.

### Microsoft Teams Integration

Teams notifications use the Office 365 Connector Card format with:
- Color-coded theme based on severity
- Alert title and subtitle
- Detailed facts section with metadata
- Activity image for visual recognition

### SMS Alerts via Twilio

SMS alerts are only sent for CRITICAL severity alerts to prevent notification spam. They include:
- Alert title
- Alert message
- Severity level
- Timestamp

### Custom Webhooks

Custom webhooks receive JSON payloads with the complete alert information:
```json
{
  "id": "alert_1234567890",
  "severity": "critical",
  "title": "Database Connection Failed",
  "message": "Unable to connect to the primary database server",
  "timestamp": "2023-01-01T12:00:00.000Z",
  "metadata": {
    "server": "db-primary-01",
    "error": "Connection timeout"
  },
  "resolved": false
}
```

## Alert Deduplication

The system implements intelligent alert deduplication to prevent notification spam:
- Alerts are deduplicated based on severity, title, and message
- Configurable deduplication window (default: 5 minutes)
- Automatic cleanup of old deduplication records
- Logging of deduplicated alerts for audit purposes

## Alert Correlation

The system implements machine learning-based alert correlation to identify patterns and reduce alert noise:
- Predefined patterns for common security scenarios
- Dynamic grouping of related alerts
- Confidence scoring for correlation strength
- Custom pattern definition capabilities

For detailed information about the Alert Correlation Engine, see [Alert Correlation Documentation](./alert-correlation.md).

## Best Practices

### Configuration Management
- Store sensitive credentials securely (use secret management in production)
- Regularly rotate API keys and authentication tokens
- Monitor integration health through test alerts
- Maintain backup notification channels

### Alert Design
- Use descriptive alert titles that clearly indicate the issue
- Include actionable information in alert messages
- Provide relevant context in metadata
- Use appropriate severity levels

### Security Considerations
- Protect alert data according to sensitivity classification
- Implement access controls for alert management
- Regularly audit alert access and handling
- Encrypt alert transmission where appropriate

## Troubleshooting

### Common Issues

#### Notifications Not Being Sent
- Verify all integration credentials are correctly configured
- Check network connectivity to external services
- Review service-specific rate limiting
- Check logs for specific error messages

#### Duplicate Alerts
- Adjust the deduplication window setting
- Review alert generation logic for consistency
- Check if alerts are being generated from multiple sources

#### Email Formatting Issues
- Verify HTML template syntax
- Check email client compatibility
- Review email service configuration

### Log Analysis

Key log entries to monitor:
- Alert creation and resolution
- Notification delivery success/failure
- Integration connectivity issues
- Deduplication events

## Future Enhancements

### Planned Features
- **Alert Correlation**: Machine learning for pattern recognition to correlate related alerts
- **Dynamic Alert Routing**: Context-based alert routing based on severity, time, or user roles
- **Interactive Notifications**: Two-way communication through notifications
- **Alert Suppression**: Scheduled or conditional alert suppression
- **Notification Templates**: Customizable notification templates per channel

### Integration Possibilities
- **Jira Integration**: Automatic ticket creation for alerts
- **ServiceNow Integration**: Integration with ITSM platforms
- **Splunk Integration**: Forwarding alerts to SIEM systems
- **Datadog Integration**: Integration with monitoring platforms

## Conclusion

The Advanced Monitoring System provides a comprehensive solution for alerting and notification in enterprise environments. With support for multiple channels and advanced features like deduplication, it ensures that the right people get the right information at the right time while minimizing notification fatigue.