# Backup and Recovery Guide

## Overview

This guide explains how to create backups of the Mietrecht Webinterface and restore them in case of data loss or system failure.

## Backup Strategy

### 1. Database Backups

#### PostgreSQL Backup
The application uses PostgreSQL as its database. Regular backups should be created to protect against data loss.

**Backup Command**:
```bash
pg_dump -h localhost -p 5432 -U mietrecht_user mietrecht_agent > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Automated Backup Script**:
```bash
#!/bin/bash
# backup.sh

# Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mietrecht_agent
DB_USER=mietrecht_user
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.sql.gz"
```

#### Backup Frequency
- **Daily**: Full database backup
- **Hourly**: Transaction log backup (if using continuous archiving)
- **Weekly**: Full system backup

#### Backup Storage
- Local storage (separate disk/volume)
- Cloud storage (AWS S3, Google Cloud Storage, Azure Blob Storage)
- Offsite storage (different physical location)

### 2. Application Code Backups

#### Git Repository
The application code should be stored in a Git repository with regular commits.

**Backup Steps**:
1. Commit all changes: `git add . && git commit -m "Backup commit"`
2. Push to remote repository: `git push origin main`
3. Create tags for releases: `git tag -a v1.0.0 -m "Release version 1.0.0"`

#### File System Backups
Backup the entire application directory including:
- Application code
- Configuration files
- Static assets
- Logs (if needed for audit purposes)

### 3. Configuration Backups

#### Environment Variables
Store environment variables in version-controlled files:
- `.env.production` (without sensitive data)
- Configuration templates
- Deployment scripts

#### Database Schema
Keep database schema definitions in version control:
- Migration scripts
- Schema documentation
- Initial data scripts

## Recovery Procedures

### 1. Database Recovery

#### Full Database Restore
**From SQL Dump**:
```bash
# Drop existing database
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS mietrecht_agent;"

# Create new database
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE mietrecht_agent;"

# Restore from backup
psql -h localhost -p 5432 -U mietrecht_user mietrecht_agent < backup_20251126_100000.sql
```

#### Point-in-Time Recovery
If using continuous archiving:
1. Identify recovery target time
2. Stop PostgreSQL server
3. Restore base backup
4. Restore WAL files
5. Create recovery.conf file
6. Start PostgreSQL server

### 2. Application Recovery

#### Code Restoration
1. Clone repository: `git clone <repository-url>`
2. Checkout specific commit/tag: `git checkout v1.0.0`
3. Install dependencies: `npm install`
4. Restore configuration files
5. Start application: `npm start`

#### Configuration Restoration
1. Restore environment variables
2. Configure database connection
3. Set up email configuration
4. Configure API keys
5. Verify all settings

### 3. Disaster Recovery

#### Complete System Recovery
1. Provision new server/environment
2. Install required software (Node.js, PostgreSQL, etc.)
3. Restore application code
4. Restore database
5. Configure environment
6. Test application
7. Update DNS records

#### Failover Setup
For high availability:
1. Set up standby server
2. Configure database replication
3. Set up load balancer
4. Configure automatic failover
5. Test failover procedures

## Backup Validation

### Regular Testing
- Test backup restoration monthly
- Verify data integrity
- Check backup file integrity
- Validate application functionality after restore

### Monitoring
- Monitor backup job completion
- Alert on backup failures
- Track backup sizes
- Monitor storage space

### Documentation
- Document backup procedures
- Record backup schedules
- Maintain recovery instructions
- Update documentation regularly

## Security Considerations

### Backup Encryption
- Encrypt backups at rest
- Use strong encryption algorithms
- Securely store encryption keys
- Encrypt backups in transit

### Access Control
- Restrict backup access
- Use role-based access control
- Audit backup access
- Rotate access credentials

### Compliance
- Follow data retention policies
- Meet regulatory requirements
- Protect sensitive data
- Maintain audit trails

## Automation

### Backup Automation
Use cron jobs or scheduled tasks to automate backups:

**Daily Database Backup**:
```bash
# Add to crontab: crontab -e
0 2 * * * /path/to/backup.sh
```

**Weekly Full System Backup**:
```bash
# Add to crontab
0 3 * * 0 /path/to/full_backup.sh
```

### Monitoring Automation
- Set up backup success/failure alerts
- Monitor backup storage usage
- Automate backup validation
- Send backup reports

## Testing

### Recovery Testing
- Test restoration procedures quarterly
- Verify data consistency
- Check application functionality
- Document test results

### Performance Testing
- Measure backup duration
- Test restore performance
- Monitor resource usage
- Optimize backup processes

## Conclusion

Regular backups and well-tested recovery procedures are essential for protecting the Mietrecht Webinterface against data loss and system failures. By following the procedures outlined in this guide, you can ensure that your application and data remain safe and can be quickly restored in case of any issues.