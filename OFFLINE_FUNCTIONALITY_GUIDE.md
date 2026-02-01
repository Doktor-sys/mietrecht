# Offline Functionality Guide

## Overview

This guide describes the offline functionality implementation for the SmartLaw Mietrecht application. The offline capability allows users to continue working with the application even when internet connectivity is unavailable, with automatic synchronization when connectivity is restored.

## Architecture

The offline functionality is built on top of IndexedDB for persistent storage and localStorage for temporary caching. It consists of the following components:

### 1. Offline Storage Service (`offlineStorage.ts`)

This service provides the core functionality for storing data locally when offline:

- **IndexedDB Database**: Persistent storage for structured data
- **Object Stores**: Separate stores for different data types:
  - Law firm cases
  - Accounting entries
  - Calendar events
  - Documents
  - Settings
- **Data Synchronization**: Automatic synchronization when connectivity is restored

### 2. Offline React Hook (`useOffline.ts`)

This React hook provides a simple interface for components to interact with offline functionality:

- **State Management**: Tracks offline status, synchronization state, and error conditions
- **Data Operations**: Save, retrieve, and synchronize offline data
- **Event Handling**: Responds to online/offline events

### 3. Integration Service Modifications (`integrations.ts`)

The integration service has been enhanced to support offline operations:

- **Fallback Mechanism**: Automatically saves data locally when API calls fail
- **Synchronization Logic**: Attempts to sync offline data when connectivity is restored
- **Conflict Resolution**: Handles potential conflicts between local and remote data

## Data Types

The offline functionality supports the following data types:

### Law Firm Cases
- Case ID
- Client information
- Case details
- Status information
- Timestamps

### Accounting Entries
- Entry ID
- Financial data
- Descriptions
- Categories
- Timestamps

### Calendar Events
- Event ID
- Title and description
- Start/end times
- Event type
- Attendees
- Location

### Documents
- Document ID
- Content
- Metadata
- Timestamps

## Implementation Details

### Initialization

The offline functionality is automatically initialized when the application starts. The system checks for IndexedDB support and initializes the database structure if needed.

### Data Storage

When the application is offline or API calls fail, data is stored locally using the following process:

1. Generate a unique offline ID
2. Store the data with metadata (timestamp, sync status)
3. Update the UI to reflect offline storage
4. Queue the data for synchronization

### Synchronization

When connectivity is restored, the system automatically attempts to synchronize offline data:

1. Detect online status change
2. Retrieve unsynchronized data from local storage
3. Attempt to send data to remote services
4. Update sync status for successfully transmitted data
5. Handle errors and retry failed operations

### Conflict Resolution

The system implements a "last write wins" approach for conflict resolution:

- Local changes take precedence over remote data
- Timestamps are used to determine the most recent version
- Users are notified of significant conflicts

## Usage

### Checking Offline Status

Components can check the current offline status using the `useOffline` hook:

```typescript
import { useOffline } from '../services/useOffline';

const MyComponent = () => {
  const { isOffline, unsyncedItemCount } = useOffline();
  
  return (
    <div>
      {isOffline && (
        <div>You are currently working offline</div>
      )}
      {unsyncedItemCount > 0 && (
        <div>{unsyncedItemCount} items waiting to sync</div>
      )}
    </div>
  );
};
```

### Saving Data Offline

The integration service automatically handles offline saving:

```typescript
// This will automatically save offline if the API call fails
const result = await integrationService.createLawFirmCase(caseData);
```

### Manual Synchronization

Users can manually trigger synchronization:

```typescript
import { useOffline } from '../services/useOffline';

const SyncButton = () => {
  const { syncOfflineData } = useOffline();
  
  const handleSync = async () => {
    try {
      await syncOfflineData();
      console.log('Data synchronized successfully');
    } catch (error) {
      console.error('Synchronization failed:', error);
    }
  };
  
  return (
    <button onClick={handleSync}>
      Sync Now
    </button>
  );
};
```

## Performance Considerations

### Storage Limits

The system respects browser storage limits and implements cleanup strategies:

- Automatic removal of old synchronized data
- User notifications when storage is nearly full
- Compression of large data items

### Battery Usage

Offline operations are designed to minimize battery consumption:

- Efficient database queries
- Reduced background processing
- Smart synchronization scheduling

## Security

### Data Encryption

Sensitive data stored offline is encrypted:

- AES-256 encryption for sensitive fields
- Secure key management
- Regular key rotation

### Access Control

Offline data is protected by the same authentication mechanisms as online data:

- User authentication required for access
- Role-based permissions enforced
- Session timeouts applied

## Testing

### Offline Simulation

The offline functionality can be tested using browser developer tools:

1. Open Developer Tools
2. Go to the Network tab
3. Check "Offline" to simulate disconnected state
4. Test application behavior

### Data Integrity

Tests ensure data integrity during offline operations:

- Data persistence across sessions
- Correct synchronization behavior
- Proper conflict resolution

## Troubleshooting

### Common Issues

#### Data Not Synchronizing
- Check internet connectivity
- Verify API credentials
- Review error logs in browser console

#### Storage Full Errors
- Clear browser cache
- Remove old synchronized data
- Contact support for assistance

#### Performance Problems
- Close other tabs/applications
- Restart browser
- Check for browser updates

## Future Enhancements

### Planned Features

1. **Selective Sync**: Allow users to choose which data to sync
2. **Bandwidth Management**: Optimize sync frequency based on connection quality
3. **Advanced Conflict Resolution**: Provide user interface for resolving conflicts
4. **Offline Reports**: Generate reports while offline

### Performance Improvements

1. **Incremental Sync**: Only sync changed data
2. **Compression**: Reduce storage requirements
3. **Background Processing**: Improve responsiveness

## Support

For issues with offline functionality, contact the support team with:

- Browser version and operating system
- Steps to reproduce the issue
- Screenshots of error messages
- Console logs if available