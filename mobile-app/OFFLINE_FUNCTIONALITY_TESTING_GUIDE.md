# Offline Functionality Testing Guide

## Overview
This guide explains how to test the offline capabilities of the SmartLaw Mietrecht mobile application.

## Prerequisites
- Mobile app successfully built and running
- Development environment set up
- Testing device or emulator

## Testing Methods

### 1. Manual Network Disconnection Testing
1. Launch the mobile app on a device or emulator
2. Navigate to a feature that requires network connectivity (e.g., chat)
3. Send a message to verify normal operation
4. Disable Wi-Fi and cellular data on the device
5. Attempt to send another message
6. Verify that:
   - The message is stored locally
   - A confirmation message is displayed to the user
   - The message appears in the offline queue
7. Re-enable network connectivity
8. Verify that:
   - The queued message is sent automatically
   - The response is received and displayed

### 2. Airplane Mode Testing
1. Enable airplane mode on the device
2. Open the mobile app
3. Perform various actions that would normally require internet connectivity:
   - Sending chat messages
   - Uploading documents
   - Booking lawyer consultations
4. Verify that all actions are properly queued
5. Disable airplane mode
6. Verify that all queued actions are processed

### 3. Poor Network Conditions Simulation
1. Use network conditioning tools to simulate poor network conditions
2. Perform typical user actions
3. Verify that the app handles timeouts and retries appropriately
4. Confirm that data is not lost during network interruptions

## Automated Testing

### Unit Tests
The offline functionality includes unit tests that can be run with:

```bash
npm test
```

These tests cover:
- Offline storage operations
- Queue management
- Network status detection
- Data retrieval and storage

### Integration Tests
Integration tests verify the complete offline workflow:

```bash
npm run e2e:test
```

## Key Test Scenarios

### Scenario 1: Chat Message Offline Handling
1. User sends a message while offline
2. Message is stored locally with a "pending" status
3. Message is added to the offline queue
4. User receives confirmation that the message will be sent when online
5. When connectivity is restored, message is automatically sent
6. Response from the server is received and displayed

### Scenario 2: Document Upload Offline Handling
1. User selects a document to upload while offline
2. Document information is stored locally
3. Upload request is added to the offline queue
4. User receives confirmation that the document will be uploaded when online
5. When connectivity is restored, document is automatically uploaded

### Scenario 3: Lawyer Booking Offline Handling
1. User attempts to book a lawyer consultation while offline
2. Booking request is stored locally
3. Request is added to the offline queue
4. User receives confirmation that the booking will be processed when online
5. When connectivity is restored, booking request is automatically processed

## Debugging Offline Issues

### Checking Local Storage
To inspect locally stored data, you can use React Native Debugger or similar tools to examine the AsyncStorage contents.

### Monitoring Network Events
Network connectivity changes are logged to the console. Check the device logs for entries like:
- "Network status changed to online/offline"
- "Processing offline queue"
- "Successfully processed offline item"

### Verifying Queue Processing
When connectivity is restored, check that:
- The offline queue is processed automatically
- Items are removed from the queue after successful processing
- Error handling works correctly for failed items

## Performance Considerations

### Storage Limits
Monitor the amount of data stored locally to ensure it doesn't exceed reasonable limits.

### Battery Usage
Network monitoring and synchronization processes should be optimized to minimize battery drain.

### Memory Usage
Large amounts of queued data should not impact app performance.

## Troubleshooting Common Issues

### Offline Data Not Syncing
1. Check network connectivity status
2. Verify that the offline queue contains items
3. Check for error messages in the console
4. Ensure the app has proper permissions

### Data Loss
1. Verify that data is properly stored before network requests
2. Check for exceptions during storage operations
3. Ensure proper error handling in all offline operations

### Duplicate Requests
1. Verify that items are properly removed from the queue after processing
2. Check for race conditions in queue processing
3. Ensure unique identifiers for all queued items

## Conclusion
Thorough testing of offline functionality ensures that users have a seamless experience regardless of network conditions. Regular testing should be part of the development cycle to catch issues early.