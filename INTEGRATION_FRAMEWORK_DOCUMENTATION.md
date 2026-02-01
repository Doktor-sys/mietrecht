# Integration Framework Documentation

## Overview

The SmartLaw Mietrecht Integration Framework provides seamless connectivity between the legal platform and external systems commonly used in law firms. This framework enables automated data synchronization with:

1. **Law Firm Management Systems** - For case and client management
2. **Accounting Systems** - For financial data transfer
3. **Calendar Systems** - For deadline and event synchronization

## Architecture

The integration framework follows a modular architecture with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Integration Service                      │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Law Firm      │  │ Accounting     │  │ Calendar       │ │
│  │ Integration   │  │ Integration    │  │ Integration    │ │
│  └───────────────┘  └────────────────┘  └────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│           Configuration & Authentication Layer             │
├─────────────────────────────────────────────────────────────┤
│              External System APIs (REST/GraphQL)           │
└─────────────────────────────────────────────────────────────┘
```

## Supported Systems

### Law Firm Management Systems

| System | Features | Authentication | API Documentation |
|--------|----------|----------------|-------------------|
| Lexware Kanzlei | Cases, Clients, Documents, Billing | OAuth 2.0 | [Lexware Developer Portal](https://developer.lexware.de/docs/kanzlei-api) |
| DATEV Kanzlei-Rechnungswesen | Cases, Clients, Documents, Financial | Certificate | [DATEV Developer Portal](https://developer.datev.de/docs/kanzlei-rechnungswesen-api) |
| Kanzleisoft | Cases, Clients, Documents, Billing, Calendar | API Key | [Kanzleisoft API Docs](https://docs.kanzleisoft.de/api) |

### Accounting Systems

| System | Features | Authentication | API Documentation |
|--------|----------|----------------|-------------------|
| DATEV Unternehmen Online | Invoices, Expenses, Clients, Tax, Reports | Certificate | [DATEV Developer Portal](https://developer.datev.de/docs/unternehmen-online-api) |
| FastBill | Invoices, Subscriptions, Clients, Payments | API Key | [FastBill API Docs](https://www.fastbill.com/api-komplettuebersicht) |
| Lexoffice | Invoices, Expenses, Clients, VAT, Reports | Bearer Token | [Lexoffice Developer Portal](https://developers.lexoffice.de/docs/) |

### Calendar Systems

| System | Features | Authentication | API Documentation |
|--------|----------|----------------|-------------------|
| Microsoft Outlook | Events, Reminders, Attendees, Sync | OAuth 2.0 | [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/api/resources/calendar) |
| Google Calendar | Events, Reminders, Attendees, Sync | OAuth 2.0 | [Google Calendar API](https://developers.google.com/calendar/api) |
| Microsoft Exchange | Events, Reminders, Attendees, Sync | OAuth 2.0 | [Exchange Web Services](https://learn.microsoft.com/en-us/exchange/client-developer/exchange-web-services/explore-the-ews-managed-api-ews-and-web-services) |

## Connector Implementation Details

### DATEV Connector

The DATEV connector implements integration with DATEV accounting software through their API. It supports OAuth 2.0 authentication with certificate-based security.

Key features:
- Sync accounting entries to DATEV
- Fetch accounting entries from DATEV
- Automatic token refresh for long-running sessions
- Error handling with automatic retry mechanisms

### FastBill Connector

The FastBill connector implements integration with FastBill accounting software through their XML API. It supports API key authentication.

Key features:
- Sync accounting entries to FastBill as invoices
- Fetch invoices from FastBill
- Customer management (create/get)
- Error handling with detailed logging

### Outlook Calendar Connector

The Outlook Calendar connector implements integration with Microsoft Outlook Calendar through the Microsoft Graph API. It supports OAuth 2.0 authentication.

Key features:
- Sync calendar events to Outlook
- Fetch calendar events from Outlook
- Create special deadline events with advanced features
- Automatic token refresh for long-running sessions
- Error handling with automatic retry mechanisms

## Implementation Guide

### 1. Installation

The integration framework is included in the web application by default. No additional installation is required.

### 2. Configuration

Configuration is done through the `IntegrationConfig` interface:

```
import { IntegrationConfig } from './services/integrations';

const config: IntegrationConfig = {
  lawFirmSystem: {
    type: 'lexware',
    apiUrl: 'https://api.lexware.de/kanzlei/v1',
    apiKey: 'your-api-key',
    syncFrequency: 30 // minutes
  },
  accountingSystem: {
    type: 'lexoffice', // or 'datev' or 'fastbill'
    apiUrl: 'https://api.lexoffice.de/v1',
    apiKey: 'your-api-key',
    clientId: 'your-client-id', // For DATEV and Outlook
    clientSecret: 'your-client-secret', // For DATEV and Outlook
    refreshToken: 'your-refresh-token', // For DATEV and Outlook
    email: 'your-email', // For FastBill
    syncFrequency: 60 // minutes
  },
  calendarSystem: {
    type: 'google', // or 'outlook' or 'exchange'
    apiUrl: 'https://www.googleapis.com/calendar/v3/calendars',
    apiKey: 'your-api-key',
    clientId: 'your-client-id', // For Outlook
    clientSecret: 'your-client-secret', // For Outlook
    tenantId: 'your-tenant-id', // For Outlook
    refreshToken: 'your-refresh-token', // For Outlook
    calendarId: 'primary',
    syncFrequency: 15 // minutes
  }
};

// Initialize the integration service
await integrationService.initialize(config);
```

### 3. Using the React Hook

For React components, use the `useIntegrations` hook:

```
import { useIntegrations } from '../services/useIntegrations';

const MyComponent: React.FC = () => {
  const {
    isInitialized,
    lawFirmSystemConnected,
    syncLawFirmCases,
    createLawFirmCase
  } = useIntegrations();

  const handleSync = async () => {
    try {
      await syncLawFirmCases();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <div>
      {lawFirmSystemConnected ? (
        <button onClick={handleSync}>Sync Cases</button>
      ) : (
        <p>Please configure law firm integration</p>
      )}
    </div>
  );
};
```

### 4. Data Models

#### Law Firm Case Data

```
interface LawFirmCaseData {
  caseId: string;
  clientId: string;
  clientName: string;
  caseType: string;
  startDate: string;
  endDate?: string;
  status: 'open' | 'closed' | 'pending';
  assignedLawyer: string;
  billingInfo?: {
    hourlyRate: number;
    hoursWorked: number;
    totalAmount: number;
  };
  documents?: Array<{
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }>;
}
```

#### Accounting Entry

```
interface AccountingEntry {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  clientId?: string;
  caseId?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  isTaxRelevant?: boolean;
  taxAmount?: number;
  taxRate?: number;
}
```

#### Calendar Event

```
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  attendees?: string[];
  reminderMinutes?: number;
  isAllDay?: boolean;
  caseId?: string;
  clientId?: string;
  eventType: 'deadline' | 'court_date' | 'meeting' | 'conference' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'confirmed' | 'tentative' | 'cancelled';
}
```

## Security Considerations

1. **Authentication Tokens**: All API keys and credentials are stored securely using industry-standard encryption.
2. **Data Transmission**: All data is transmitted over HTTPS with TLS 1.3 encryption.
3. **Access Control**: Role-based access control ensures only authorized users can configure integrations.
4. **Audit Logging**: All integration activities are logged for compliance and security monitoring.

## Error Handling

The framework implements comprehensive error handling with automatic retry mechanisms:

- **Network Failures**: Automatic retry with exponential backoff
- **Authentication Errors**: Automatic token refresh when possible
- **API Rate Limits**: Automatic throttling to respect rate limits
- **Data Validation**: Comprehensive validation before sending data to external systems

## Monitoring and Maintenance

### Health Checks

Regular health checks monitor the status of all integrations:

```
const status = integrationService.getStatus();
console.log(status);
// {
//   initialized: true,
//   lawFirmSystemConnected: true,
//   accountingSystemConnected: true,
//   calendarSystemConnected: true
// }
```

### Logging

All integration activities are logged with detailed information for troubleshooting:

```
// Example log entry
INFO: Syncing 15 law firm cases
DEBUG: Fetching cases from Lexware API
INFO: Successfully synced 15 cases
```

## Extending the Framework

To add support for additional systems:

1. **Add System Definition**: Update `integrationConfig.ts` with the new system details
2. **Implement Connector**: Create a connector class that implements the system's API
3. **Update Service**: Modify `integrations.ts` to include the new connector
4. **Update UI**: Add the new system to the configuration interface

## Best Practices

1. **Regular Sync**: Configure appropriate sync frequencies based on business needs
2. **Data Validation**: Always validate data before sending to external systems
3. **Error Monitoring**: Monitor integration errors and address them promptly
4. **Security Updates**: Keep API credentials secure and rotate them regularly
5. **Backup Plans**: Have contingency plans for when integrations fail

## Troubleshooting

### Common Issues

1. **Connection Failures**: Check API credentials and network connectivity
2. **Authentication Errors**: Verify token validity and refresh if needed
3. **Rate Limiting**: Reduce sync frequency or implement queuing
4. **Data Mapping Issues**: Ensure data formats match between systems

### Support

For integration issues, contact the technical support team with:
- System logs
- Error messages
- Configuration details
- Steps to reproduce the issue

## Future Enhancements

Planned improvements include:
- Real-time webhook integration for instant updates
- Advanced data mapping and transformation capabilities
- Support for additional regional law firm systems
- Enhanced analytics and reporting on integration performance
- Machine learning-based optimization of sync schedules