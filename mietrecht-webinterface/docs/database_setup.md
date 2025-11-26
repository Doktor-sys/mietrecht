# Database Setup Guide

## Overview

This guide explains how to set up the PostgreSQL database for the Mietrecht Webinterface.

## Prerequisites

1. PostgreSQL 12 or higher installed
2. Node.js 18 or higher installed
3. npm (Node Package Manager)

## PostgreSQL Installation

### Windows

1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. During installation, set a password for the postgres user
4. Make sure to install pgAdmin (optional but recommended)

### macOS

Using Homebrew:
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql.service
```

## Database Setup

### 1. Create Database and User

Connect to PostgreSQL as the superuser:
```bash
# Windows
psql -U postgres

# macOS/Linux
sudo -u postgres psql
```

Create the database and user:
```sql
-- Create the database
CREATE DATABASE mietrecht_agent;

-- Create a dedicated user
CREATE USER mietrecht_user WITH ENCRYPTED PASSWORD 'mietrecht_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mietrecht_agent TO mietrecht_user;
```

### 2. Configure Environment Variables

Create a `.env` file in the project root with the following content:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mietrecht_agent
DB_USER=mietrecht_user
DB_PASSWORD=mietrecht_password
DB_SSL=false

# Server Configuration
PORT=3002
```

### 3. Initialize the Database

Run the database initialization script:
```bash
cd mietrecht-webinterface
npm run init-db
```

This will:
- Create all required tables
- Insert sample data for development

## Database Connection Troubleshooting

### Common Issues

1. **Connection refused**: Make sure PostgreSQL is running
2. **Authentication failed**: Check username and password in `.env`
3. **Database does not exist**: Run the CREATE DATABASE command
4. **Permission denied**: Grant proper privileges to the user

### Testing Connection

You can test the database connection with:
```bash
# Connect to the database
psql -h localhost -p 5432 -U mietrecht_user -d mietrecht_agent
```

## Backup and Restore

### Backup
```bash
pg_dump -h localhost -p 5432 -U mietrecht_user mietrecht_agent > backup.sql
```

### Restore
```bash
psql -h localhost -p 5432 -U mietrecht_user mietrecht_agent < backup.sql
```

## Development vs Production

For production environments, consider:

1. Using environment-specific `.env` files
2. Enabling SSL connections (DB_SSL=true)
3. Using stronger passwords
4. Setting up proper database backups
5. Configuring connection pooling
6. Monitoring database performance

## Schema Updates

When updating the database schema:

1. Create a new migration file in `database/migrations/`
2. Follow the naming convention: `XX_description.sql` (e.g., `02_add_indexes.sql`)
3. Test migrations in development first
4. Apply migrations to production during maintenance windows