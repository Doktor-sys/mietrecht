# Mietrecht Agent Deployment Guide

## Overview

This guide provides instructions for deploying the Mietrecht Agent to various platforms including Heroku and Docker environments.

## Prerequisites

Before deploying, ensure you have the following:

1. **Git** installed on your system
2. **Node.js** (version 14 or higher) installed
3. **Heroku CLI** (for Heroku deployment)
4. **Docker** (for Docker deployment)
5. **Email account** credentials for sending newsletters
6. **Heroku account** (for Heroku deployment)

## Heroku Deployment

### Automated Deployment

1. Run the deployment script:
   ```bash
   deploy_mietrecht_agent.bat
   ```

2. Follow the prompts to:
   - Log in to Heroku
   - Set your application name
   - Configure email settings
   - Set data source limits (optional)

### Manual Deployment

1. **Login to Heroku:**
   ```bash
   heroku login
   ```

2. **Create a new Heroku app:**
   ```bash
   heroku create your-app-name
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set EMAIL_USER=your-email@gmail.com
   heroku config:set EMAIL_PASS=your-app-password
   heroku config:set EMAIL_FROM=your-email@gmail.com
   ```

4. **Add PostgreSQL addon:**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

5. **Deploy the application:**
   ```bash
   git push heroku main
   ```

6. **Run database initialization:**
   ```bash
   heroku run "node scripts/database/init.js"
   ```

7. **Scale the worker process (for automatic execution):**
   ```bash
   heroku ps:scale worker=1
   ```

## Docker Deployment

### Using Docker Compose

1. **Create a `.env` file** with your configuration:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   BGH_MAX_RESULTS=10
   LANDGERICHTE_MAX_RESULTS=15
   BECKONLINE_MAX_RESULTS=10
   ```

2. **Start the services:**
   ```bash
   docker-compose -f docker-compose.mietrecht.yml up -d
   ```

### Using Individual Docker Commands

1. **Build the Docker image:**
   ```bash
   docker build -t mietrecht-agent -f Dockerfile.mietrecht .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name mietrecht-agent \
     -p 3000:3000 \
     -e EMAIL_USER=your-email@gmail.com \
     -e EMAIL_PASS=your-app-password \
     -e EMAIL_FROM=your-email@gmail.com \
     -v $(pwd)/scripts/database/data:/app/scripts/database/data \
     mietrecht-agent
   ```

## Environment Variables

The following environment variables can be configured:

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_USER` | Email account username | Required |
| `EMAIL_PASS` | Email account password or app password | Required |
| `EMAIL_FROM` | Sender email address | Required |
| `BGH_MAX_RESULTS` | Maximum BGH results to fetch | 10 |
| `LANDGERICHTE_MAX_RESULTS` | Maximum Landgerichte results to fetch | 15 |
| `BECKONLINE_MAX_RESULTS` | Maximum BeckOnline results to fetch | 10 |
| `PORT` | Port for the web interface | 3000 |
| `NODE_ENV` | Node environment | production |

## Accessing the Application

After deployment, you can access:

1. **Web Interface:** `http://your-app-name.herokuapp.com` or `http://localhost:3000`
2. **API Endpoints:** Various endpoints for configuration and monitoring
3. **Logs:** Use `heroku logs --tail` or Docker logs to monitor application activity

## Running the Agent

The Mietrecht Agent can be run in two ways:

1. **Web Process:** Handles the web interface and API requests
2. **Worker Process:** Runs the agent to fetch court decisions and send newsletters

To manually run the agent:
```bash
heroku run "node scripts/mietrecht_agent_real_data.js"
```

Or with Docker:
```bash
docker exec -it mietrecht-agent node scripts/mietrecht_agent_real_data.js
```

## Monitoring and Maintenance

1. **Check application status:**
   ```bash
   heroku ps
   ```

2. **View logs:**
   ```bash
   heroku logs --tail
   ```

3. **Scale processes:**
   ```bash
   heroku ps:scale web=1 worker=1
   ```

4. **Database backup** (for Heroku):
   ```bash
   heroku pg:backups:capture
   ```

## Troubleshooting

### Common Issues

1. **Email sending fails:**
   - Verify email credentials
   - Check if you're using app passwords for Gmail
   - Ensure less secure app access is enabled (if required)

2. **Database connection issues:**
   - Verify PostgreSQL addon is installed
   - Check database credentials
   - Ensure database initialization has been run

3. **Deployment fails:**
   - Check Heroku build logs: `heroku logs --tail`
   - Verify all environment variables are set
   - Ensure Git repository is properly initialized

### Getting Help

If you encounter issues:
1. Check the application logs
2. Verify all environment variables are correctly set
3. Ensure dependencies are properly installed
4. Contact support if problems persist

## Security Considerations

1. **Environment Variables:** Never commit sensitive information to version control
2. **Email Credentials:** Use app passwords instead of regular passwords when possible
3. **Database:** Use strong passwords and limit database access
4. **API Keys:** Rotate keys regularly and limit their permissions

## Updating the Application

To update the deployed application:

1. **Pull the latest changes:**
   ```bash
   git pull origin main
   ```

2. **Deploy the updates:**
   ```bash
   git push heroku main
   ```

3. **Run any necessary migrations:**
   ```bash
   heroku run "node scripts/database/migrate.js"
   ```