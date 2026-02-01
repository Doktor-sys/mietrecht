# Enhanced Profile Preferences Feature - Post-Deployment Verification Checklist

## Overview
This checklist ensures that the enhanced profile preferences feature is working correctly after deployment.

## Prerequisites
- Application deployed successfully
- Database migrations applied
- Backend service running
- Frontend application accessible

## Verification Steps

### 1. Database Schema Verification
- [ ] Connect to the database
- [ ] Verify that the `user_preferences` table has the new columns:
  - [ ] `accessibility` (JSONB)
  - [ ] `legalTopics` (JSONB)
  - [ ] `frequentDocuments` (JSONB)
  - [ ] `alerts` (JSONB)
- [ ] Confirm that existing user preferences are intact

### 2. API Endpoint Verification
- [ ] Test GET `/api/users/preferences` endpoint:
  - [ ] Returns 200 OK for authenticated users
  - [ ] Response includes new preference fields (accessibility, legalTopics, frequentDocuments, alerts)
  - [ ] New fields are present with default null values for existing users
- [ ] Test PUT `/api/users/preferences` endpoint:
  - [ ] Accepts requests with new preference fields
  - [ ] Successfully updates all preference types
  - [ ] Returns updated preferences in response

### 3. Accessibility Preferences Verification
- [ ] Test setting accessibility preferences:
  - [ ] highContrast: true/false
  - [ ] dyslexiaFriendly: true/false
  - [ ] reducedMotion: true/false
  - [ ] largerText: true/false
  - [ ] screenReaderMode: true/false
- [ ] Verify that preferences are persisted correctly
- [ ] Confirm that invalid values are rejected with appropriate error messages

### 4. Legal Topics Preferences Verification
- [ ] Test setting legal topics preferences:
  - [ ] Empty array []
  - [ ] Array with valid topic IDs ["tenant-protection", "modernization"]
  - [ ] Array with mixed valid/invalid topic IDs
- [ ] Verify that preferences are persisted correctly
- [ ] Confirm that invalid data types are rejected with appropriate error messages

### 5. Frequent Documents Preferences Verification
- [ ] Test setting frequent documents preferences:
  - [ ] Empty array []
  - [ ] Array with valid document type IDs ["rental-contract", "warning-letter"]
  - [ ] Array with mixed valid/invalid document type IDs
- [ ] Verify that preferences are persisted correctly
- [ ] Confirm that invalid data types are rejected with appropriate error messages

### 6. Alert Preferences Verification
- [ ] Test setting alert preferences:
  - [ ] newCaseLaw: "instant", "daily", "weekly", "disabled"
  - [ ] documentUpdates: "instant", "daily", "disabled"
  - [ ] newsletter: "monthly", "disabled"
- [ ] Verify that preferences are persisted correctly
- [ ] Confirm that invalid values are rejected with appropriate error messages

### 7. Frontend Component Verification
- [ ] Access the profile page at `/profile`
- [ ] Navigate to the "Erweiterte Einstellungen" tab
- [ ] Verify that all UI elements are displayed correctly:
  - [ ] Accessibility settings section
  - [ ] Legal topics selection
  - [ ] Frequent documents selection
  - [ ] Alert preferences section
- [ ] Test form interactions:
  - [ ] Checkboxes toggle correctly
  - [ ] Select dropdowns work properly
  - [ ] Save button functions correctly
  - [ ] Success/error messages display appropriately

### 8. Data Persistence Verification
- [ ] Make changes to all preference types
- [ ] Save the preferences
- [ ] Refresh the page
- [ ] Verify that all preferences are loaded correctly
- [ ] Log out and log back in
- [ ] Verify that preferences are still available

### 9. Error Handling Verification
- [ ] Test with invalid data:
  - [ ] Non-boolean values for accessibility settings
  - [ ] Non-array values for legalTopics and frequentDocuments
  - [ ] Invalid enum values for alert preferences
- [ ] Verify that appropriate error responses are returned
- [ ] Confirm that error messages are displayed in the UI

### 10. Performance Verification
- [ ] Measure response times for GET/PUT preferences endpoints
- [ ] Verify that requests complete within acceptable time limits (< 500ms)
- [ ] Test with multiple concurrent users if possible

### 11. Security Verification
- [ ] Verify that endpoints require authentication
- [ ] Confirm that users can only access their own preferences
- [ ] Test with invalid authentication tokens
- [ ] Verify that appropriate HTTP status codes are returned for unauthorized access

## Rollback Plan
If any critical issues are found:
1. Revert the database migration
2. Deploy the previous version of the backend
3. Notify the development team
4. Investigate and fix the issues
5. Reschedule deployment

## Success Criteria
- [ ] All verification steps completed successfully
- [ ] No critical or high-severity issues found
- [ ] Performance metrics within acceptable ranges
- [ ] Feature ready for production use