# Heroku Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Mietrecht Webinterface to Heroku.

## Prerequisites

Before deploying to Heroku, ensure you have:

1. **Heroku Account**: Sign up at [https://signup.heroku.com/](https://signup.heroku.com/)
2. **Heroku CLI**: Install from [https://devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Install from [https://git-scm.com/](https://git-scm.com/)
4. **Node.js**: Version 18 or higher

## Deployment Steps

### 1. Install Prerequisites

#### Heroku CLI Installation
```bash
# macOS (using Homebrew)
brew tap heroku/brew && brew install heroku

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli

# Ubuntu/Debian
curl https://cli-assets.heroku.com/install.sh | sh
```

#### Verify Installation
```bash
heroku --version
git --version
node --version
```

### 2. Prepare Your Application

#### Clone or Navigate to Your Repository
```bash
cd mietrecht-webinterface
```

#### Initialize Git Repository (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### 3. Login to Heroku

```bash
heroku login
```

This will open a browser window where you can log in to your Heroku account.

### 4. Create Heroku App

#### Create a New App
```bash
# Create app with auto-generated name
heroku create

# Or create app with specific name
heroku create your-app-name
```

#### Add Git Remote
If you created an app with a specific name:
```bash
heroku git:remote -a your-app-name
```

### 5. Add Heroku Postgres

```bash
# Add free tier PostgreSQL database
heroku addons:create heroku-postgresql:hobby-dev
```

### 6. Configure Environment Variables

#### Set Required Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set EMAIL_SERVICE=sendgrid
heroku config:set APP_NAME="Mietrecht Webinterface"
```

#### Set Secret Keys (replace with your actual values)
```bash
heroku config:set SESSION_SECRET=your-random-session-secret
heroku config:set JWT_SECRET=your-random-jwt-secret
```

#### Set API Keys (replace with your actual values)
```bash
heroku config:set BGH_API_KEY=your-bgh-api-key
heroku config:set LANDGERICHTE_API_KEY=your-landgerichte-api-key
```

### 7. Deploy Application

```bash
# Deploy to Heroku
git push heroku main
```

### 8. Run Database Initialization

```bash
# Run the database initialization script
heroku run npm run init-db
```

### 9. Open Application

```bash
# Open your deployed application in a browser
heroku open
```

## Configuration Details

### Database Configuration

Heroku automatically provides a `DATABASE_URL` environment variable when you add the Heroku Postgres addon. The application is configured to use this URL automatically.

### Email Configuration

For email delivery, you can use SendGrid:

1. Add SendGrid addon:
   ```bash
   heroku addons:create sendgrid:starter
   ```

2. Get your API key:
   ```bash
   heroku config:get SENDGRID_API_KEY
   ```

3. Set email configuration:
   ```bash
   heroku config:set EMAIL_SERVICE=sendgrid
   heroku config:set EMAIL_USER=apikey
   heroku config:set EMAIL_PASS=your-sendgrid-api-key
   ```

### Custom Domain (Optional)

#### Add Custom Domain
```bash
heroku domains:add your-domain.com
```

#### Configure DNS
Add a CNAME record pointing to your Heroku app URL.

## Monitoring and Maintenance

### View Logs
```bash
# View real-time logs
heroku logs --tail
```

### Scale Dynos
```bash
# Scale web dynos
heroku ps:scale web=1
```

### Restart Application
```bash
# Restart all dynos
heroku restart
```

### Run One-off Tasks
```bash
# Run a one-off dyno
heroku run bash
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
- Check build logs: `heroku logs --tail`
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

#### 2. Database Connection Issues
- Verify Heroku Postgres addon is installed
- Check DATABASE_URL environment variable
- Ensure SSL is enabled for database connections

#### 3. Application Crashes
- Check application logs: `heroku logs --tail`
- Verify environment variables are set correctly
- Ensure port binding is correct (use process.env.PORT)

### Debugging Steps

1. **Check Application Status**
   ```bash
   heroku ps
   ```

2. **View Configuration**
   ```bash
   heroku config
   ```

3. **Check Addon Status**
   ```bash
   heroku addons
   ```

4. **Run Diagnostics**
   ```bash
   heroku run node scripts/test-api.js
   ```

## Scaling Options

### Dyno Scaling
```bash
# Scale up to performance dynos
heroku ps:scale web=1:performance-m

# Scale horizontally
heroku ps:scale web=2
```

### Database Upgrade
```bash
# Upgrade to a larger database plan
heroku addons:upgrade heroku-postgresql:standard-0
```

## Backup and Restore

### Database Backups
```bash
# Create a backup
heroku pg:backups:capture

# List backups
heroku pg:backups

# Restore from backup
heroku pg:backups:restore
```

## Rollback

### Deploy Previous Release
```bash
# View release history
heroku releases

# Rollback to previous release
heroku rollback
```

## Conclusion

Your Mietrecht Webinterface should now be successfully deployed to Heroku. The application is configured to work with Heroku's environment, including automatic database URL configuration and proper environment variable handling.

For ongoing maintenance, monitor your application logs, scale resources as needed, and keep your dependencies up to date.