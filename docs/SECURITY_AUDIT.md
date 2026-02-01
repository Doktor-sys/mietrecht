# Security Audit: Environment Variables

This document lists critical environment variables and their security requirements for the production environment.

## 1. Critical Secrets (MUST BE CHANGED)
The following variables must have strong, unique values in production. Do NOT use default values.

*   `DATABASE_PASSWORD`: Use a strong random password (e.g., 32 characters).
*   `JWT_SECRET`: Critical for authentication. Use `openssl rand -base64 64` to generate.
*   `MINIO_ROOT_PASSWORD`: Protects object storage.
*   `REDIS_PASSWORD`: (If applicable) Protects cache.
*   `SESSION_SECRET`: If using session-based auth.

## 2. Configuration Checks
*   `NODE_ENV`: Must be set to `production` to enable performance optimizations and disable verbose error messages.
*   `CORS_ORIGIN`: Must be restricted to the actual production domain (e.g., `https://app.smartlaw.com`), NOT `*`.
*   `ENABLE_SWAGGER`: Should be `false` in production to hide API documentation from public.

## 3. Deployment Checklist
- [ ] Rotating keys generated?
- [ ] Secrets injected via secure mechanism (e.g., GitHub Secrets, Docker Secrets, or Env Manager)?
- [ ] `.env` file NOT committed to Git?
