# SmartLaw Admin User Guide

## Overview
This guide provides comprehensive instructions for using the SmartLaw Admin Dashboard. The dashboard offers administrators tools to monitor system performance, manage users, review audit logs, and maintain security compliance.

## Accessing the Admin Dashboard

### Prerequisites
- Business user account with admin privileges
- Valid login credentials
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Login Process
1. Navigate to the SmartLaw application
2. Click on the "Login" button
3. Enter your admin credentials
4. Upon successful authentication, you will be redirected to the Admin Dashboard

## Dashboard Navigation

### Main Navigation Menu
The left sidebar provides quick access to all admin features:
- **Overview**: System metrics and key performance indicators
- **Audit Logs**: Detailed system activity records
- **Users**: User management and account administration
- **Settings**: System configuration and preferences

### Tab Navigation
The top tab bar allows switching between main dashboard sections:
- **Overview**: Analytics and system metrics
- **Audit Logs**: Detailed audit trail information

## Admin Dashboard Features

### 1. System Overview

#### Key Metrics Display
The overview section displays critical system metrics:
- **Total Users**: Current user count with monthly growth indicator
- **Active Cases**: Number of ongoing legal cases
- **Revenue (MTD)**: Monthly revenue with performance comparison

#### Analytics Charts
Interactive charts provide visual insights into system performance:
- **User Growth**: Line chart showing user registration trends over time
- **API Usage**: Bar chart displaying API call volume by day

### 2. Audit Logs Management

#### Log Filtering
Filter audit logs by:
- Action type (LOGIN, DOCUMENT_ACCESS, SETTINGS_CHANGE)
- User ID
- Date range
- Resource accessed

#### Log Details
Each audit log entry includes:
- Timestamp of the action
- Type of action performed
- User who performed the action
- Resource affected
- Status (success/failure)

#### Export Functionality
Export audit logs for compliance reporting:
- JSON format for technical analysis
- CSV format for spreadsheet applications

### 3. User Management

#### User List
View all registered users with details:
- User ID and email
- Account type (tenant, landlord, business)
- Registration date
- Last login time
- Account status (active/inactive)

#### User Actions
Perform administrative actions on user accounts:
- Activate/deactivate accounts
- Reset passwords
- View detailed user profiles
- Modify user permissions

### 4. System Settings

#### Configuration Options
Manage system-wide settings:
- Security policies
- Notification preferences
- Integration configurations
- Compliance settings

#### Monitoring Configuration
Configure system monitoring:
- Alert thresholds
- Notification channels (email, Slack, PagerDuty)
- Log retention policies
- Performance monitoring intervals

## Security Features

### Key Management System (KMS)
Manage cryptographic keys for data protection:
- Create new encryption keys
- Rotate existing keys
- Monitor key usage
- Revoke compromised keys

### Threat Detection
Monitor for security threats:
- Brute force attack detection
- Suspicious IP address monitoring
- Unauthorized access attempts
- Key compromise alerts

### Compliance Reporting
Generate compliance reports:
- GDPR compliance status
- Audit trail documentation
- Security incident reports
- Key management logs

## Best Practices

### Regular Monitoring
- Check system overview daily for anomalies
- Review audit logs weekly for suspicious activity
- Monitor user growth and engagement metrics
- Verify API usage patterns

### Security Maintenance
- Rotate encryption keys regularly
- Review and update security policies
- Monitor threat detection alerts
- Maintain up-to-date compliance documentation

### User Management
- Deactivate inactive user accounts
- Monitor account access patterns
- Review user permission levels
- Handle password reset requests promptly

## Troubleshooting

### Common Issues

#### Dashboard Loading Problems
- Refresh the browser page
- Clear browser cache and cookies
- Check internet connection
- Verify admin account permissions

#### Audit Log Access Issues
- Ensure proper date range selection
- Check filter criteria
- Verify admin privileges
- Contact system administrator if issues persist

#### Export Functionality Problems
- Verify date range parameters
- Check file download permissions
- Ensure sufficient disk space
- Try different export formats

### Support Resources
- Contact system administrator for account issues
- Refer to technical documentation for advanced configuration
- Submit support tickets for persistent problems
- Check system status page for known issues

## Appendix

### Keyboard Shortcuts
- **Ctrl+R**: Refresh dashboard
- **Ctrl+F**: Focus on filter input
- **Esc**: Close modal dialogs
- **Tab**: Navigate between UI elements

### Browser Requirements
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Mobile Access
The admin dashboard is optimized for desktop use. Mobile access is limited and may not provide full functionality.

## Version Information
- Current Version: 1.0.0
- Last Updated: November 2025
- Next Review Date: May 2026