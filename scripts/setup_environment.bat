@echo off
echo Setting up environment variables for Mietrecht Agent...
echo ======================================================

echo Setting data source configuration...
set BGH_MAX_RESULTS=25
set LANDGERICHTE_MAX_RESULTS=30
set BVERFG_MAX_RESULTS=20

echo Setting email configuration...
set EMAIL_NOTIFICATIONS_ENABLED=true
set SMTP_HOST=smtp.gmail.com
set SMTP_PORT=587
set SMTP_SECURE=true
set SMTP_USER=your-email@gmail.com
set SMTP_PASS=your-app-password

echo Setting performance configuration...
set CACHE_TTL=60
set RATE_LIMIT=15
set MAX_RETRIES=5

echo Environment variables set successfully!
echo You can now run the Mietrecht Agent with these configurations.
echo ======================================================
pause