# GitHub-Asana Integration Deployment Guide

## Overview

This guide explains how to deploy the GitHub-Asana integration webhook handler to make it accessible from GitHub and start automatically synchronizing development activities with Asana tasks.

## Deployment Options

### Option 1: Local Development with ngrok (Testing)

For testing purposes, you can use ngrok to expose your local server to the internet:

1. Install ngrok:
   ```bash
   npm install -g ngrok
   ```

2. Start the webhook handler:
   ```bash
   cd scripts
   npm run dev
   ```

3. In a separate terminal, start ngrok:
   ```bash
   ngrok http 3000
   ```

4. Copy the HTTPS URL provided by ngrok (e.g., `https://abcd1234.ngrok.io`)

5. Configure the GitHub webhook with this URL:
   - Payload URL: `https://abcd1234.ngrok.io/webhook/github`
   - Content type: `application/json`
   - Secret: Your webhook secret
   - Events: `push` and `pull_request`

### Option 2: Cloud Deployment (Production)

For production use, deploy the webhook handler to a cloud platform:

#### Heroku

1. Create a Heroku account and install the Heroku CLI
2. Login to Heroku:
   ```bash
   heroku login
   ```

3. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```

4. Set environment variables:
   ```bash
   heroku config:set ASANA_ACCESS_TOKEN=your_token_here
   heroku config:set GITHUB_WEBHOOK_SECRET=your_secret_here
   heroku config:set ASANA_WORKSPACE_ID=your_workspace_id_here
   ```

5. Deploy the application:
   ```bash
   git add .
   git commit -m "Deploy GitHub-Asana integration"
   git push heroku main
   ```

#### AWS Lambda

1. Install the Serverless Framework:
   ```bash
   npm install -g serverless
   ```

2. Create a `serverless.yml` file in the scripts directory:
   ```yaml
   service: github-asana-integration
   
   provider:
     name: aws
     runtime: nodejs18.x
     environment:
       ASANA_ACCESS_TOKEN: ${env:ASANA_ACCESS_TOKEN}
       GITHUB_WEBHOOK_SECRET: ${env:GITHUB_WEBHOOK_SECRET}
       ASANA_WORKSPACE_ID: ${env:ASANA_WORKSPACE_ID}
   
   functions:
     webhook:
       handler: github_asana_webhook.handler
       events:
         - http:
             path: webhook/github
             method: post
         - http:
             path: health
             method: get
   
   plugins:
     - serverless-offline
   ```

3. Modify the webhook handler to work with AWS Lambda:
   ```javascript
   // Add this export for Lambda
   exports.handler = async (event, context) => {
     // Convert API Gateway event to Express request
     // Implementation details...
   };
   ```

4. Deploy to AWS:
   ```bash
   serverless deploy
   ```

#### Google Cloud Functions

1. Install the Google Cloud SDK
2. Create an `index.js` file that exports the Express app:
   ```javascript
   const app = require('./github_asana_webhook.js');
   exports.githubAsanaWebhook = app;
   ```

3. Create a `package.json` for Cloud Functions:
   ```json
   {
     "name": "github-asana-integration",
     "version": "1.0.0",
     "dependencies": {
       "express": "^4.18.2",
       "axios": "^1.6.0"
     }
   }
   ```

4. Deploy to Google Cloud:
   ```bash
   gcloud functions deploy github-asana-webhook \
     --runtime nodejs18 \
     --trigger-http \
     --allow-unauthenticated \
     --set-env-vars ASANA_ACCESS_TOKEN=your_token_here,GITHUB_WEBHOOK_SECRET=your_secret_here,ASANA_WORKSPACE_ID=your_workspace_id_here
   ```

## Environment Variables

The webhook handler requires the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `ASANA_ACCESS_TOKEN` | Personal access token for Asana API | Yes |
| `GITHUB_WEBHOOK_SECRET` | Secret for GitHub webhook validation | Yes |
| `ASANA_WORKSPACE_ID` | ID of the Asana workspace | No |
| `PORT` | Port for the webhook handler | No (defaults to 3000) |

## Asana Setup

### Creating a Personal Access Token

1. Log in to Asana
2. Go to your profile settings (click your avatar)
3. Select "Manage Developer Apps"
4. Click "Create new personal access token"
5. Give it a name (e.g., "GitHub Integration")
6. Copy the token and save it securely

### Finding Your Workspace ID

1. Go to Asana
2. Navigate to your workspace
3. Copy the workspace ID from the URL:
   `https://app.asana.com/0/{WORKSPACE_ID}/{PROJECT_ID}`

## GitHub Setup

### Creating a Webhook

1. Go to your GitHub repository
2. Click "Settings"
3. Click "Webhooks & Services"
4. Click "Add webhook"
5. Configure the webhook:
   - Payload URL: Your webhook handler URL + `/webhook/github`
   - Content type: `application/json`
   - Secret: Your webhook secret
   - Events: Select "Let me select individual events" and choose:
     - Pushes
     - Pull requests
6. Click "Add webhook"

## Testing the Integration

### Testing Locally

1. Start the webhook handler:
   ```bash
   npm run dev
   ```

2. Use curl to test the health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```

3. Use a tool like Postman to simulate GitHub webhook events

### Testing with GitHub

1. Make a commit with a task ID in the message:
   ```bash
   git commit -m "task-123: Add new feature"
   ```

2. Push the commit:
   ```bash
   git push origin main
   ```

3. Check Asana to see if the task was updated

## Monitoring and Maintenance

### Logs

The webhook handler logs all activities to stdout/stderr. Check your hosting platform's logging system for detailed information.

### Health Checks

The `/health` endpoint returns a JSON response with the service status:
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "service": "GitHub-Asana Integration"
}
```

### Updates

To update the integration:

1. Pull the latest code:
   ```bash
   git pull origin main
   ```

2. Install any new dependencies:
   ```bash
   npm install
   ```

3. Restart the service

## Troubleshooting

### Common Issues

1. **Webhook deliveries failing**
   - Check that the webhook URL is accessible from the internet
   - Verify the webhook secret matches
   - Check the service logs for error messages

2. **Tasks not updating**
   - Verify the Asana access token has proper permissions
   - Check that task IDs in commit messages are correct
   - Ensure the webhook is configured for the correct events

3. **Authentication errors**
   - Verify the Asana access token is valid
   - Check that the token has not expired
   - Ensure the token has access to the specified workspace

### GitHub Webhook Delivery Status

1. Go to your GitHub repository settings
2. Click "Webhooks & Services"
3. Click on your webhook
4. Check the "Recent Deliveries" section for any failed deliveries
5. Click on failed deliveries to see the request and response details

## Security Considerations

### Token Management

- Store tokens securely using environment variables
- Rotate tokens regularly
- Use tokens with minimal required permissions
- Never commit tokens to version control

### Webhook Security

- Always use webhook secrets to verify request authenticity
- Use HTTPS for all webhook endpoints
- Implement rate limiting to prevent abuse
- Monitor webhook delivery logs for suspicious activity

## Scaling Considerations

For high-traffic repositories, consider:

1. **Rate Limiting**: Implement request rate limiting
2. **Queueing**: Use a message queue for processing webhook events
3. **Caching**: Cache Asana API responses where appropriate
4. **Load Balancing**: Deploy multiple instances behind a load balancer

## Support

For issues with the integration, contact the development team or check the service logs for error details.