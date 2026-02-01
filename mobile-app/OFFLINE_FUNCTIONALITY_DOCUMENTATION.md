# Offline Functionality Documentation

## Overview

The SmartLaw Mietrecht mobile app includes enhanced offline functionality that allows users to continue working with the app even when network connectivity is unavailable. This documentation covers the implementation details, usage patterns, and testing procedures for the offline features.

## Enhanced Offline Storage

### Implementation

The enhanced offline storage system is implemented in `src/services/enhancedOfflineStorage.ts` and provides the following capabilities:

1. **Offline Queue Management**: Stores user actions (like document uploads) when offline and automatically processes them when connectivity is restored.
2. **Data Persistence**: Persists important user data locally to ensure availability during offline periods.
3. **Sync Coordination**: Coordinates synchronization of offline data with the server when connectivity is restored.
4. **Data Cleanup**: Automatically cleans up old offline data to manage storage space.

### Key Features

- **Maximum Queue Size**: The offline queue is limited to 100 items to prevent excessive storage usage.
- **Automatic Sync**: When network connectivity is restored, the system automatically processes the offline queue.
- **Data Expiration**: Old offline data (older than 1 week by default) is automatically cleaned up.
- **Statistics Tracking**: Provides insights into offline data usage and storage.

### Usage Examples

```typescript
// Store data offline
await enhancedOfflineStorage.storeOfflineData('userPreferences', preferences);

// Retrieve offline data
const preferences = await enhancedOfflineStorage.getOfflineData('userPreferences');

// Add item to offline queue
await enhancedOfflineStorage.addToOfflineQueue({
  type: 'document_upload',
  file: documentFile,
  documentType: 'rental_contract'
});

// Get offline statistics
const stats = await enhancedOfflineStorage.getOfflineStatistics();
```

## Push Notifications

### Implementation

The enhanced push notification system is implemented in `src/services/pushNotifications.ts` and provides advanced notification capabilities:

1. **Notification Channels**: Supports multiple notification channels for different types of notifications.
2. **Scheduling**: Allows scheduling of immediate, delayed, and repeating notifications.
3. **Categories**: Supports notification categories for better organization and handling.
4. **Actions**: Supports notification actions for interactive notifications.

### Key Features

- **Multiple Channels**: 
  - `default`: General notifications
  - `chat`: Chat messages
  - `legal_updates`: Legal updates and reminders
  - `reminders`: General reminders
- **Scheduling Options**:
  - Immediate notifications
  - Delayed notifications (with configurable delay)
  - Repeating notifications (minute, hour, day, week, month intervals)
- **Interactive Actions**: Support for actions like "Mark as Read", "Reply", and "Dismiss"

### Usage Examples

```typescript
// Schedule an immediate notification
await pushNotificationService.scheduleLocalNotification(
  'Document Uploaded',
  'Your document has been successfully uploaded',
  { documentId: 'doc123' },
  'reminders'
);

// Schedule a delayed notification
await pushNotificationService.scheduleDelayedNotification(
  'Legal Consultation Reminder',
  'Remember to document your legal question',
  300, // 5 minutes
  { screen: 'Chat', conversationId: 'conv123' },
  'legal_updates'
);

// Schedule a repeating notification
await pushNotificationService.scheduleRepeatingNotification(
  'Weekly Legal Update',
  'Check the latest legal developments',
  'week',
  {},
  'legal_updates'
);
```

## Integration with App Screens

### Chat Screen

The Chat screen (`src/screens/Main/ChatScreen.tsx`) integrates push notifications to provide reminders for legal questions:

- When a user sends a message containing legal terms (like "Mietrecht" or "Recht"), a delayed notification is scheduled to remind them to document their question.
- Notifications are categorized as `legal_updates` for proper handling.

### Documents Screen

The Documents screen (`src/screens/Main/DocumentsScreen.tsx`) integrates enhanced offline storage:

- Documents are stored locally when uploaded while offline.
- The screen displays both online and offline documents with appropriate status indicators.
- When network connectivity is restored, offline documents are automatically uploaded.
- Users receive notifications when documents are successfully uploaded.

## End-to-End Testing

### Test Cases

The end-to-end tests in `e2e/tests/offline.e2e.js` cover the following scenarios:

1. **Offline Document Upload**: Verifies that documents can be uploaded and stored when offline, and are automatically synced when connectivity is restored.
2. **Offline Status Display**: Ensures that offline documents are displayed with appropriate status indicators.
3. **Push Notifications**: Tests that users receive push notifications for legal updates.
4. **Offline Queue Processing**: Validates that multiple documents queued while offline are correctly processed when connectivity is restored.

### Running Tests

To run the offline functionality tests:

```bash
npm run e2e:test
```

## API Endpoints

The backend provides API endpoints for risk assessment and strategy recommendations:

### Risk Assessment

- `POST /api/risk-assessment/document/:documentId` - Assess risk for a document
- `POST /api/risk-assessment/case/:caseId` - Assess risk for a case
- `POST /api/risk-assessment/document/:documentId/enhanced` - Enhanced risk assessment for a document
- `POST /api/risk-assessment/case/:caseId/enhanced` - Enhanced risk assessment for a case

### Strategy Recommendations

- `POST /api/strategy-recommendations/document/:documentId` - Generate recommendations for a document
- `POST /api/strategy-recommendations/case/:caseId` - Generate recommendations for a case
- `POST /api/strategy-recommendations/document/:documentId/enhanced` - Enhanced recommendations for a document
- `POST /api/strategy-recommendations/case/:caseId/enhanced` - Enhanced recommendations for a case

## Future Improvements

Potential areas for future enhancement include:

1. **Enhanced Conflict Resolution**: Better handling of conflicts when syncing offline data with server data.
2. **Improved Offline Search**: Enable searching through offline-stored documents and data.
3. **Extended Offline Functionality**: Expand offline capabilities to more areas of the app.
4. **Advanced Analytics**: Provide more detailed analytics on offline usage patterns.