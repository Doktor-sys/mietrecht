# Manual Heroku Deployment Guide

## Overview

This guide provides step-by-step instructions for manually deploying the Mietrecht Webinterface to Heroku when automated deployment is not possible.

## Prerequisites

Before deploying to Heroku, ensure you have:

1. **Heroku Account**: Sign up at [https://signup.heroku.com/](https://signup.heroku.com/)
2. **Heroku CLI**: Install from [https://devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Install from [https://git-scm.com/](https://git-scm.com/)
4. **Node.js**: Version 18 or higher

## Manual Deployment Steps

### 1. Log in to Heroku

Open a terminal and log in to your Heroku account:

```bash
heroku login
```

This will open a browser window where you can log in to your Heroku account.

### 2. Create Heroku App

Create a new Heroku app with a unique name:

```bash
heroku create your-mietrecht-app-name
```

Replace `your-mietrecht-app-name` with a unique name for your app.

### 3. Add Heroku Postgres Database

Add the Heroku Postgres add-on to your app:

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### 4. Set Configuration Variables

Set the required environment variables:

```bash
heroku config:set NODE_ENV=production
heroku config:set APP_NAME="Mietrecht Webinterface"
heroku config:set EMAIL_SERVICE=sendgrid
```

### 5. Deploy the Application

Deploy your application to Heroku:

```bash
git push heroku main
```

If your branch is named `master` instead of `main`, use:

```bash
git push heroku master
```

### 6. Run Database Migrations

After deployment, run the database initialization script:

```bash
heroku run npm run init-db
```

### 7. Scale the Application

Scale your application to run one dyno:

```bash
heroku ps:scale web=1
```

### 8. View the Application

Open your deployed application in a browser:

```bash
heroku open
```

## Troubleshooting

### Common Issues

1. **Build Failures**: Check the build logs with:
   ```bash
   heroku logs --tail
   ```

2. **Database Connection Issues**: Verify the database URL:
   ```bash
   heroku config:get DATABASE_URL
   ```

3. **Application Crashes**: Check application logs:
   ```bash
   heroku logs --app your-app-name
   ```

### Support

If you encounter issues during deployment, refer to the [Heroku Dev Center](https://devcenter.heroku.com/) for documentation and support.