# API Documentation

## Overview

This document describes the REST API endpoints for the Mietrecht Webinterface. The API provides access to lawyers, their preferences, court decisions, and newsletters.

## Authentication

Most endpoints require authentication. Authentication is done through session cookies in the web interface or JWT tokens in API calls.

## Base URL

```
http://localhost:3002/api
```

## Lawyers

### Get all lawyers
```
GET /lawyers
```

**Description**: Get a list of all lawyers (admin only)

**Parameters**:
- `limit` (optional): Number of results to return (default: 10)
- `offset` (optional): Number of results to skip (default: 0)

**Response**:
```json
[
  {
    "id": 1,
    "name": "Max Mustermann",
    "email": "max.mustermann@lawfirm.de",
    "law_firm": "Mustermann & Partner",
    "created_at": "2025-11-26T10:00:00.000Z"
  }
]
```

### Get lawyer by ID
```
GET /lawyers/{id}
```

**Description**: Get a specific lawyer by ID

**Response**:
```json
{
  "id": 1,
  "name": "Max Mustermann",
  "email": "max.mustermann@lawfirm.de",
  "law_firm": "Mustermann & Partner",
  "created_at": "2025-11-26T10:00:00.000Z"
}
```

### Create lawyer
```
POST /lawyers
```

**Description**: Create a new lawyer

**Request Body**:
```json
{
  "name": "Max Mustermann",
  "email": "max.mustermann@lawfirm.de",
  "password": "securepassword",
  "lawFirm": "Mustermann & Partner"
}
```

**Response**:
```json
{
  "id": 1,
  "name": "Max Mustermann",
  "email": "max.mustermann@lawfirm.de",
  "law_firm": "Mustermann & Partner",
  "created_at": "2025-11-26T10:00:00.000Z"
}
```

### Update lawyer
```
PUT /lawyers/{id}
```

**Description**: Update a lawyer's information

**Request Body**:
```json
{
  "name": "Max Mustermann",
  "lawFirm": "Mustermann & Partner"
}
```

**Response**:
```json
{
  "id": 1,
  "name": "Max Mustermann",
  "email": "max.mustermann@lawfirm.de",
  "law_firm": "Mustermann & Partner",
  "updated_at": "2025-11-26T11:00:00.000Z"
}
```

### Delete lawyer
```
DELETE /lawyers/{id}
```

**Description**: Delete a lawyer

**Response**:
```json
{
  "message": "Lawyer deleted successfully"
}
```

## Lawyer Preferences

### Get lawyer preferences
```
GET /lawyers/{id}/preferences
```

**Description**: Get a lawyer's preferences

**Response**:
```json
{
  "id": 1,
  "lawyer_id": 1,
  "court_levels": ["Bundesgerichtshof", "Landgericht"],
  "topics": ["Mietminderung", "Kündigung"],
  "frequency": "weekly",
  "regions": ["Berlin", "Brandenburg"],
  "created_at": "2025-11-26T10:00:00.000Z",
  "updated_at": "2025-11-26T10:00:00.000Z"
}
```

### Create lawyer preferences
```
POST /lawyers/{id}/preferences
```

**Description**: Create preferences for a lawyer

**Request Body**:
```json
{
  "courtLevels": ["Bundesgerichtshof", "Landgericht"],
  "topics": ["Mietminderung", "Kündigung"],
  "frequency": "weekly",
  "regions": ["Berlin", "Brandenburg"]
}
```

**Response**:
```json
{
  "id": 1,
  "lawyer_id": 1,
  "court_levels": ["Bundesgerichtshof", "Landgericht"],
  "topics": ["Mietminderung", "Kündigung"],
  "frequency": "weekly",
  "regions": ["Berlin", "Brandenburg"],
  "created_at": "2025-11-26T10:00:00.000Z"
}
```

### Update lawyer preferences
```
PUT /lawyers/{id}/preferences
```

**Description**: Update a lawyer's preferences

**Request Body**:
```json
{
  "courtLevels": ["Bundesgerichtshof", "Landgericht"],
  "topics": ["Mietminderung", "Kündigung"],
  "frequency": "weekly",
  "regions": ["Berlin", "Brandenburg"]
}
```

**Response**:
```json
{
  "id": 1,
  "lawyer_id": 1,
  "court_levels": ["Bundesgerichtshof", "Landgericht"],
  "topics": ["Mietminderung", "Kündigung"],
  "frequency": "weekly",
  "regions": ["Berlin", "Brandenburg"],
  "updated_at": "2025-11-26T11:00:00.000Z"
}
```

### Delete lawyer preferences
```
DELETE /lawyers/{id}/preferences
```

**Description**: Delete a lawyer's preferences

**Response**:
```json
{
  "message": "Preferences deleted successfully"
}
```

## Court Decisions

### Get all court decisions
```
GET /decisions
```

**Description**: Get a list of court decisions

**Parameters**:
- `limit` (optional): Number of results to return (default: 20)
- `offset` (optional): Number of results to skip (default: 0)

**Response**:
```json
[
  {
    "id": 1,
    "case_number": "VIII ZR 121/24",
    "court": "Bundesgerichtshof",
    "location": "Karlsruhe",
    "date": "2025-11-15",
    "summary": "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern",
    "content": "Full decision text...",
    "importance": "high",
    "topics": ["Mietminderung", "Schimmelbefall"],
    "created_at": "2025-11-15T10:00:00.000Z",
    "updated_at": "2025-11-15T10:00:00.000Z"
  }
]
```

### Get court decision by ID
```
GET /decisions/{id}
```

**Description**: Get a specific court decision by ID

**Response**:
```json
{
  "id": 1,
  "case_number": "VIII ZR 121/24",
  "court": "Bundesgerichtshof",
  "location": "Karlsruhe",
  "date": "2025-11-15",
  "summary": "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern",
  "content": "Full decision text...",
  "importance": "high",
  "topics": ["Mietminderung", "Schimmelbefall"],
  "created_at": "2025-11-15T10:00:00.000Z",
  "updated_at": "2025-11-15T10:00:00.000Z"
}
```

### Create court decision
```
POST /decisions
```

**Description**: Create a new court decision (admin only)

**Request Body**:
```json
{
  "caseNumber": "VIII ZR 121/24",
  "court": "Bundesgerichtshof",
  "location": "Karlsruhe",
  "date": "2025-11-15",
  "summary": "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern",
  "content": "Full decision text...",
  "importance": "high",
  "topics": ["Mietminderung", "Schimmelbefall"]
}
```

**Response**:
```json
{
  "id": 1,
  "case_number": "VIII ZR 121/24",
  "court": "Bundesgerichtshof",
  "location": "Karlsruhe",
  "date": "2025-11-15",
  "summary": "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern",
  "content": "Full decision text...",
  "importance": "high",
  "topics": ["Mietminderung", "Schimmelbefall"],
  "created_at": "2025-11-15T10:00:00.000Z"
}
```

### Update court decision
```
PUT /decisions/{id}
```

**Description**: Update a court decision (admin only)

**Request Body**:
```json
{
  "caseNumber": "VIII ZR 121/24",
  "court": "Bundesgerichtshof",
  "location": "Karlsruhe",
  "date": "2025-11-15",
  "summary": "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern",
  "content": "Full decision text...",
  "importance": "high",
  "topics": ["Mietminderung", "Schimmelbefall"]
}
```

**Response**:
```json
{
  "id": 1,
  "case_number": "VIII ZR 121/24",
  "court": "Bundesgerichtshof",
  "location": "Karlsruhe",
  "date": "2025-11-15",
  "summary": "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern",
  "content": "Full decision text...",
  "importance": "high",
  "topics": ["Mietminderung", "Schimmelbefall"],
  "updated_at": "2025-11-15T11:00:00.000Z"
}
```

### Delete court decision
```
DELETE /decisions/{id}
```

**Description**: Delete a court decision (admin only)

**Response**:
```json
{
  "message": "Court decision deleted successfully"
}
```

## Newsletters

### Get all newsletters
```
GET /newsletters
```

**Description**: Get a list of all newsletters (admin only)

**Parameters**:
- `limit` (optional): Number of results to return (default: 20)
- `offset` (optional): Number of results to skip (default: 0)

**Response**:
```json
[
  {
    "id": 1,
    "lawyer_id": 1,
    "subject": "Wöchentlicher Mietrecht-Newsletter",
    "content": "<p>HTML newsletter content...</p>",
    "sent_at": "2025-11-26T09:00:00.000Z",
    "created_at": "2025-11-26T09:00:00.000Z"
  }
]
```

### Get lawyer's newsletters
```
GET /lawyers/{id}/newsletters
```

**Description**: Get newsletters for a specific lawyer

**Parameters**:
- `limit` (optional): Number of results to return (default: 10)

**Response**:
```json
[
  {
    "id": 1,
    "lawyer_id": 1,
    "subject": "Wöchentlicher Mietrecht-Newsletter",
    "content": "<p>HTML newsletter content...</p>",
    "sent_at": "2025-11-26T09:00:00.000Z",
    "created_at": "2025-11-26T09:00:00.000Z"
  }
]
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Validation failed"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```