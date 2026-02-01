# Integration Developer Guide

This guide provides technical documentation for developers working with the SmartLaw Mietrecht integration framework.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Integration Service](#integration-service)
3. [Connector Implementation](#connector-implementation)
4. [Data Models](#data-models)
5. [API Reference](#api-reference)
6. [Testing](#testing)
7. [Extending the Framework](#extending-the-framework)

## Architecture Overview

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
│              Connector Implementation Layer                │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Lexware       │  │ Lexoffice      │  │ Google         │ │
│  │ Connector     │  │ Connector      │  │ Calendar       │ │
│  ├───────────────┤  ├────────────────┤  │ Connector      │ │
│  │ DATEV         │  │ DATEV          │  ├────────────────┤ │
│  │ Connector     │  │ Connector      │  │ Outlook        │ │
│  ├───────────────┤  ├────────────────┤  │ Calendar       │ │
│  │ Custom        │  │ FastBill       │  │ Connector      │ │
│  │ Connector     │  │ Connector      │  ├────────────────┤ │
│  └───────────────┘  └────────────────┘  │ Exchange       │ │
│                                         │ Connector      │ │
│                                         └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Components
1. **Integration Service**: Central service managing all integrations
2. **Connectors**: System-specific implementations for each integrated platform
3. **Data Models**: Standardized data structures for exchanging information
4. **Configuration Management**: Secure storage and retrieval of integration settings

## Integration Service

The IntegrationService class is the core of the integration framework.

### Initialization
```typescript
import { integrationService, IntegrationConfig } from './services/integrations';

const config: IntegrationConfig = {
  lawFirmSystem: {
    type: 'lexware',
    apiKey: 'your-api-key'
  },
  accountingSystem: {
    type: 'lexoffice',
    apiKey: 'your-api-key'
  },
  calendarSystem: {
    type: 'google',
    apiKey: 'your-api-key'
  }
};

await integrationService.initialize(config);
```

### Key Methods
- `initialize(config)`: Set up all integrations
- `syncLawFirmCases()`: Sync case data from law firm systems
- `syncAccountingData(entries)`: Sync financial data to accounting systems
- `syncCalendarEvents(events)`: Sync events to calendar systems
- `createCalendarEvent(event)`: Create a new calendar event
- `updateCalendarEvent(eventId, eventData)`: Update an existing calendar event
- `getStatus()`: Get current integration status

## Connector Implementation

Each connector implements a consistent interface while handling system-specific logic.

### Base Connector Interface
```typescript
interface BaseConnector {
  testConnection(): Promise<boolean>;
  // System-specific methods
}
```

### Example Connector Implementation
```typescript
export class LexwareConnector {
  constructor(config: LexwareConfig) {
    // Initialize connector with configuration
  }

  async testConnection(): Promise<boolean> {
    // Test connection to Lexware API
  }

  async getCases(): Promise<LawFirmCaseData[]> {
    // Fetch cases from Lexware
  }

  async createCase(caseData: LawFirmCaseData): Promise<string> {
    // Create a new case in Lexware
  }
}
```

### Adding New Connectors
1. Create a new connector class implementing the required interface
2. Add the connector to the IntegrationService
3. Update the configuration interface to support the new system
4. Add the system to the Integration Dashboard UI

## Data Models

### LawFirmCaseData
```typescript
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

### AccountingEntry
```typescript
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

### CalendarEvent
```typescript
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

## API Reference

### IntegrationConfig
Configuration object for initializing integrations.

```typescript
interface IntegrationConfig {
  lawFirmSystem?: {
    type: 'lexware' | 'datev' | 'custom' | 'api';
    apiUrl?: string;
    apiKey?: string;
    credentials?: {
      username: string;
      password: string;
    };
    syncFrequency?: number;
  };
  accountingSystem?: {
    type: 'lexoffice' | 'datev' | 'fastbill' | 'custom';
    apiUrl?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    email?: string;
    credentials?: {
      username: string;
      password: string;
    };
    syncFrequency?: number;
  };
  calendarSystem?: {
    type: 'google' | 'outlook' | 'exchange' | 'custom';
    apiUrl?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    tenantId?: string;
    refreshToken?: string;
    calendarId?: string;
    credentials?: {
      username: string;
      password: string;
    };
    syncFrequency?: number;
  };
}
```

### Integration Status
```typescript
interface IntegrationStatus {
  isInitialized: boolean;
  lawFirmSystemConnected: boolean;
  accountingSystemConnected: boolean;
  calendarSystemConnected: boolean;
}
```

## Testing

### Unit Tests
Each connector should have comprehensive unit tests covering:
- Connection testing
- Data synchronization
- Error handling
- Edge cases

### Integration Tests
End-to-end tests should verify:
- Full integration workflows
- Data consistency between systems
- Error recovery scenarios
- Performance under load

### Test Examples
```typescript
// Example test for Lexware connector
describe('LexwareConnector', () => {
  test('should connect to Lexware API', async () => {
    const connector = new LexwareConnector({
      baseUrl: 'https://api.lexware.de/kanzlei/v1',
      accessToken: 'test-token'
    });
    
    const result = await connector.testConnection();
    expect(result).toBe(true);
  });
});
```

## Extending the Framework

### Adding New Law Firm Systems
1. Create a new connector class
2. Implement required methods (testConnection, getCases, createCase, etc.)
3. Add system to LAW_FIRM_SYSTEMS configuration
4. Update IntegrationService to instantiate the new connector

### Adding New Accounting Systems
1. Create a new connector class
2. Implement required methods (testConnection, syncAccountingEntries, etc.)
3. Add system to ACCOUNTING_SYSTEMS configuration
4. Update IntegrationService to instantiate the new connector

### Adding New Calendar Systems
1. Create a new connector class
2. Implement required methods (testConnection, syncEvents, createEvent, etc.)
3. Add system to CALENDAR_SYSTEMS configuration
4. Update IntegrationService to instantiate the new connector

### Best Practices for Extensions
1. Follow existing connector patterns
2. Implement comprehensive error handling
3. Add detailed logging
4. Include thorough documentation
5. Write comprehensive tests

This guide should provide developers with all the information needed to work with and extend the SmartLaw Mietrecht integration framework.