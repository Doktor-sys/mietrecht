# Enhanced Profile Preferences Feature Documentation

## Overview
This document describes the implementation of the enhanced profile preferences feature, which extends the user preferences system to support more granular customization options for accessibility, legal topics, document preferences, and alert notifications.

## New Database Fields

The `user_preferences` table has been extended with the following new JSON fields:

### accessibility (JSON)
Stores accessibility settings for users with special needs:
```json
{
  "highContrast": boolean,
  "dyslexiaFriendly": boolean,
  "reducedMotion": boolean,
  "largerText": boolean,
  "screenReaderMode": boolean
}
```

### legalTopics (JSON Array)
Stores an array of legal topic IDs that the user is interested in:
```json
["tenant-protection", "modernization", "rent-increases"]
```

### frequentDocuments (JSON Array)
Stores an array of document type IDs that the user frequently works with:
```json
["rental-contract", "warning-letter", "termination"]
```

### alerts (JSON)
Stores user preferences for different types of alerts:
```json
{
  "newCaseLaw": "instant" | "daily" | "weekly" | "disabled",
  "documentUpdates": "instant" | "daily" | "disabled",
  "newsletter": "monthly" | "disabled"
}
```

## New API Endpoints

### GET /api/users/preferences
Retrieves the current user's preferences including the new enhanced profile settings.

#### Response
```json
{
  "success": true,
  "data": {
    "id": "string",
    "userId": "string",
    "notifications": {},
    "privacy": {},
    "language": "string",
    "accessibility": {
      "highContrast": boolean,
      "dyslexiaFriendly": boolean,
      "reducedMotion": boolean,
      "largerText": boolean,
      "screenReaderMode": boolean
    },
    "legalTopics": ["string"],
    "frequentDocuments": ["string"],
    "alerts": {
      "newCaseLaw": "string",
      "documentUpdates": "string",
      "newsletter": "string"
    }
  }
}
```

### PUT /api/users/preferences
Updates the user's preferences including the new enhanced profile settings.

#### Request Body
```json
{
  "notifications": {},
  "privacy": {},
  "language": "string",
  "accessibility": {
    "highContrast": boolean,
    "dyslexiaFriendly": boolean,
    "reducedMotion": boolean,
    "largerText": boolean,
    "screenReaderMode": boolean
  },
  "legalTopics": ["string"],
  "frequentDocuments": ["string"],
  "alerts": {
    "newCaseLaw": "instant" | "daily" | "weekly" | "disabled",
    "documentUpdates": "instant" | "daily" | "disabled",
    "newsletter": "monthly" | "disabled"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "string",
    "userId": "string",
    "notifications": {},
    "privacy": {},
    "language": "string",
    "accessibility": {},
    "legalTopics": ["string"],
    "frequentDocuments": ["string"],
    "alerts": {}
  },
  "message": "Präferenzen erfolgreich aktualisiert"
}
```

## Validation Rules

### Accessibility Settings
- All fields must be boolean values
- Fields are optional and default to false if not provided

### Legal Topics
- Must be an array of strings
- Each string represents a legal topic ID
- Empty array is valid

### Frequent Documents
- Must be an array of strings
- Each string represents a document type ID
- Empty array is valid

### Alerts
- newCaseLaw: Must be one of "instant", "daily", "weekly", "disabled"
- documentUpdates: Must be one of "instant", "daily", "disabled"
- newsletter: Must be one of "monthly", "disabled"

## Implementation Details

### Backend
- Extended Prisma schema with new JSON fields
- Updated UserService to handle new preference fields
- Added validation for new fields
- Updated UserController with new endpoints
- Added comprehensive Swagger documentation
- Created database migration script

### Frontend
- Updated API client with new userAPI methods
- Enhanced ProfileSettings component to use new API methods
- Added TypeScript interfaces for new preference structures

### Testing
- Added unit tests for UserService methods
- Added integration tests for API endpoints
- Added validation tests for new preference fields

## Migration Notes

The database migration adds four new nullable JSON columns to the `user_preferences` table:
1. `accessibility` - JSONB
2. `legalTopics` - JSONB
3. `frequentDocuments` - JSONB
4. `alerts` - JSONB

Existing user preferences will continue to work without any changes, as the new fields are optional and nullable.