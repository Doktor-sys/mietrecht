# Manual Heroku Deployment Guide for GitHub-Asana Integration

## Overview

This guide provides step-by-step instructions for manually deploying the GitHub-Asana integration to Heroku. This approach is necessary when automated deployment tools cannot be used.

## Prerequisites

1. Heroku account (sign up at https://signup.heroku.com/)
2. Heroku CLI installed (download from https://devcenter.heroku.com/articles/heroku-cli)
3. Git installed (download from https://git-scm.com/)
4. Asana personal access token
5. GitHub webhook secret

## Deployment Steps

### Step 1: Install Required Tools

1. Download and install Git from https://git-scm.com/
2. Download and install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli
3. Verify installations:
   ```bash
   git --version
   heroku --version
   ```

### Step 2: Prepare the Application

1. Open a terminal/command prompt
2. Navigate to the project root directory:
   ```bash
   cd "d:\ - 2025 - 22.06- copy C\_AA_Postfach 01.01.2025\03.07.2025 Arbeit 02.11.2025\JurisMind - Mietrecht 01"
   ```

3. Initialize Git repository (if not already done):
   ```bash
   git init
   ```

4. Add all files to Git:
   ```bash
   git add .
   ```

5. Commit the files:
   ```bash
   git commit -m "Initial commit for GitHub-Asana integration"
   ```

### Step 3: Create Heroku App

1. Log in to Heroku:
   ```bash
   heroku login
   ```
   This will open a browser window for authentication.

2. Create a new Heroku app:
   ```bash
   heroku create github-asana-integration-smartlaw
   ```

### Step 4: Configure Environment Variables

1. Set the Asana access token:
   ```bash
   heroku config:set ASANA_ACCESS_TOKEN=your_actual_asana_token_here
   ```

2. Set the GitHub webhook secret:
   ```bash
   heroku config:set GITHUB_WEBHOOK_SECRET=your_actual_github_secret_here
   ```

3. Set the Asana workspace ID (optional):
   ```bash
   heroku config:set ASANA_WORKSPACE_ID=your_actual_workspace_id_here
   ```

### Step 5: Deploy to Heroku

1. Deploy the application:
   ```bash
   git push heroku main
   ```

   If you're using a different branch (e.g., master), use:
   ```bash
   git push heroku master
   ```

### Step 6: Verify Deployment

1. Check the application logs:
   ```bash
   heroku logs --tail
   ```

2. Test the health endpoint:
   ```bash
   curl https://github-asana-integration-smartlaw.herokuapp.com/health
   ```

   Or open in a browser:
   `https://github-asana-integration-smartlaw.herokuapp.com/health`

### Step 7: Configure GitHub Webhook

1. Go to your GitHub repository settings
2. Navigate to "Webhooks & Services"
3. Click "Add webhook"
4. Configure the webhook:
   - Payload URL: `https://github-asana-integration-smartlaw.herokuapp.com/webhook/github`
   - Content type: `application/json`
   - Secret: Your GitHub webhook secret
   - Events: Select "Let me select individual events" and choose:
     - Pushes
     - Pull requests
5. Click "Add webhook"

### Step 8: Test the Integration

1. Make a test commit with a task ID:
   ```bash
   git commit -m "task-123: Test commit for integration" --allow-empty
   git push origin main
   ```

2. Check Asana to see if the task was updated

## Troubleshooting

### Common Issues

1. **Git command not found**
   - Ensure Git is installed and added to PATH
   - Restart terminal/command prompt after installation

2. **Heroku login fails**
   - Ensure you have a Heroku account
   - Check internet connection
   - Try `heroku login -i` for interactive login

3. **Deployment fails**
   - Check application logs: `heroku logs --tail`
   - Ensure all required files are committed
   - Check Procfile format

4. **Webhook delivery fails**
   - Verify the webhook URL is correct
   - Check that the application is running: `heroku ps`
   - Check application logs for errors

### Checking Application Status

1. View running processes:
   ```bash
   heroku ps
   ```

2. View application logs:
   ```bash
   heroku logs --tail
   ```

3. Restart the application:
   ```bash
   heroku restart
   ```

4. Open the application in a browser:
   ```bash
   heroku open
   ```

## Updating the Application

To update the application after making changes:

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

2. Deploy the updates:
   ```bash
   git push heroku main
   ```

## Environment Variables

The application requires the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| ASANA_ACCESS_TOKEN | Personal access token for Asana API | Yes |
| GITHUB_WEBHOOK_SECRET | Secret for GitHub webhook validation | Yes |
| ASANA_WORKSPACE_ID | ID of the Asana workspace | No |
| PORT | Port for the webhook handler | No (defaults to $PORT or 3000) |

## Security Considerations

1. Never commit sensitive tokens to version control
2. Rotate tokens regularly
3. Use strong, random secrets for webhooks
4. Monitor application logs for suspicious activity

## Support

For issues with the deployment, contact:
- DevOps Team: devops@jurismind.de
- Heroku Support: https://help.heroku.com/
- GitHub Support: https://support.github.com/