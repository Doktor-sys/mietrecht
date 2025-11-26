# Database Schema Documentation

## Overview

This document describes the database schema for the Mietrecht Webinterface. The database is designed to store information about lawyers, their preferences, court decisions, and newsletters.

## Tables

### 1. lawyers

Stores information about registered lawyers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for the lawyer |
| name | VARCHAR(255) | NOT NULL | Full name of the lawyer |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email address (used for login) |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| law_firm | VARCHAR(255) |  | Name of the law firm |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record last update timestamp |

### 2. lawyer_preferences

Stores preferences for each lawyer.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for the preference record |
| lawyer_id | INTEGER | REFERENCES lawyers(id) ON DELETE CASCADE | Foreign key to lawyers table |
| court_levels | TEXT[] |  | Preferred court levels (e.g., Bundesgerichtshof, Landgericht) |
| topics | TEXT[] |  | Preferred legal topics (e.g., Mietminderung, Kündigung) |
| frequency | VARCHAR(50) | DEFAULT 'weekly' | Newsletter frequency (daily, weekly, monthly) |
| regions | TEXT[] |  | Preferred regions (e.g., Berlin, Hamburg) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record last update timestamp |

### 3. court_decisions

Stores information about court decisions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for the court decision |
| case_number | VARCHAR(255) | NOT NULL | Official case number |
| court | VARCHAR(255) | NOT NULL | Court name (e.g., Bundesgerichtshof) |
| location | VARCHAR(255) |  | Court location |
| date | DATE |  | Decision date |
| summary | TEXT |  | Brief summary of the decision |
| content | TEXT |  | Full text of the decision |
| importance | VARCHAR(50) | DEFAULT 'medium' | Importance level (low, medium, high) |
| topics | TEXT[] |  | Related legal topics |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record last update timestamp |

### 4. newsletters

Stores information about sent newsletters.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for the newsletter |
| lawyer_id | INTEGER | REFERENCES lawyers(id) ON DELETE CASCADE | Foreign key to lawyers table |
| subject | VARCHAR(255) | NOT NULL | Newsletter subject |
| content | TEXT |  | Newsletter content (HTML) |
| sent_at | TIMESTAMP |  | Timestamp when newsletter was sent |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

## Indexes

The following indexes are created for performance optimization:

1. `idx_lawyers_email` - Index on lawyers.email for faster login lookups
2. `idx_court_decisions_case_number` - Index on court_decisions.case_number for faster searches
3. `idx_court_decisions_date` - Index on court_decisions.date for date-based queries
4. `idx_court_decisions_importance` - Index on court_decisions.importance for filtering by importance

## Relationships

- Each lawyer can have one set of preferences (one-to-one)
- Each lawyer can have multiple newsletters (one-to-many)
- Lawyers and court decisions are not directly related, but are connected through the newsletter system