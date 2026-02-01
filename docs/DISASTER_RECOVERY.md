# Disaster Recovery Plan

This document outlines the procedures for recovering the SmartLaw system in the event of major failures.

## 1. Objectives

*   **RPO (Recovery Point Objective):** 24 hours (maximum data loss).
*   **RTO (Recovery Time Objective):** 4 hours (maximum downtime).

## 2. Failure Scenarios

### 2.1 Database Failure
**Symptoms:** API returns 500 errors, logs show connection timeouts or corruption errors.
**Recovery:**
1.  **Assess:** detailed check of database logs.
2.  **Restore:** If corruption is confirmed, restore from latest backup.
    ```bash
    # Stop API services
    docker-compose stop backend

    # Restore Database
    psql -h <db_host> -U postgres -d smartlaw < <backup_file>.sql

    # Restart Services
    docker-compose start backend
    ```
3.  **Verify:** Run health check (`/health`) and critical functional tests.

### 2.2 Application Service Failure
**Symptoms:** API unreacheable, 502 Bad Gateway.
**Recovery:**
1.  **Restart:** Attempt to restart containers.
    ```bash
    docker-compose restart backend
    ```
2.  **Rollback:** If restart fails after deployment, rollback to previous image.
    ```bash
    # Edit docker-compose.yml to previous tag
    docker-compose up -d
    ```

### 2.3 Data Center / Region Failure (Cloud)
**Recovery:**
1.  **Failover:** Switch DNS to standby region (if configured).
2.  **Rebuild:** If no standby, provision new infrastructure using Terraform/Ansible scripts.
3.  **Restore Data:** Restore database from off-site backups.

## 3. Communication Plan

1.  **Notify Stakeholders:** Inform management about the outage and estimated resolution time.
2.  **Status Page:** Update system status page.
3.  **Post-Mortem:** After recovery, conduct a full analysis of the root cause and update this plan.
