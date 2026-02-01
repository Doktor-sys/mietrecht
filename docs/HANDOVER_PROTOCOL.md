# System Handover Protocol

**Project:** SmartLaw Mietrecht
**Date:** 2025-12-15
**Version:** 1.0 (Go-Live)

## 1. System Overview
- **Backend:** Node.js/Express with Prisma (PostgreSQL).
- **Frontend:** React Native (Expo) Mobile App.
- **Infrastructure:** Docker Compose (Production).

## 2. Key Documentation
The following documents are essential for the operation and maintenance of the system:

| Document | Location | Purpose |
|----------|----------|---------|
| **System Administration** | `docs/SYSTEM_ADMIN.md` | Monitoring, Backups, Disaster Recovery. |
| **Disaster Recovery** | `docs/DISASTER_RECOVERY.md` | RPO/RTO goals, detailed recovery steps. |
| **Security Audit** | `docs/SECURITY_AUDIT.md` | Env var guidelines, security checklist. |
| **Publishing Guide** | `mobile-app/PUBLISHING_GUIDE.md` | App Store/Play Store submission guide. |
| **User Manual** | `docs/USER_MANUAL.md` | End-user documentation. |

## 3. Deployment Scripts
- **Production Deploy:** `scripts/deploy_prod.bat`
- **Smoke Test:** `scripts/smoke_test_prod.js`

## 4. Infrastructure Credentials (References)
*Note: Actual secrets are in `.env` (server) or CI/CD secrets (GitHub).*
- **Database:** `DATABASE_URL` (PostgreSQL)
- **Redis:** `REDIS_URL`
- **Object Storage:** `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`

## 5. Known Issues / Limitations
- **Biometric Login:** Requires HTTPS in production for full security compliance on some Android versions.
- **Feedback:** Currently stores to DB; email notification integration pending (Roadmap Phase 17).

## 6. Sign-off
**Developer:** SmartLaw Dev Team
**Operations:** [Pending Acceptance]
