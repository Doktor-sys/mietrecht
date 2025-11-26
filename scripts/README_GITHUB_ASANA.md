# GitHub-Asana Integration

This directory contains the webhook handler for integrating GitHub with Asana to automatically update tasks based on repository events.

## Overview

The integration enables automatic synchronization between GitHub activities and Asana tasks, providing real-time updates on development progress without manual intervention.

## Features

1. **Commit Integration**
   - Automatically links commits to Asana tasks using task IDs in commit messages
   - Updates task status to "In Progress" when commits are pushed
   - Adds commit information as comments on tasks

2. **Pull Request Integration**
   - Links pull requests to Asana tasks
   - Updates task status based on pull request actions (opened, merged, closed)
   - Adds pull request information as comments on tasks

3. **Branch Tracking**
   - Tracks feature branch activity
   - Provides visibility into ongoing development work

## Setup Instructions

### Prerequisites

1. Node.js >= 18.0.0
2. Asana account with API access
3. GitHub repository with admin access
4. Server or cloud function to host the webhook handler

### Installation

1. Clone the repository
2. Navigate to the scripts directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

Set the following environment variables:

```bash
# Asana API access token
ASANA_ACCESS_TOKEN=your_asana_personal_access_token

# GitHub webhook secret (for verification)
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret

# Asana workspace ID
ASANA_WORKSPACE_ID=your_asana_workspace_id
```

### Running the Service

1. Start the webhook handler:
   ```bash
   npm start
   ```

2. For development with auto-reload:
   ```bash
   npm run dev
   ```

## GitHub Webhook Configuration

1. Go to your GitHub repository settings
2. Navigate to "Webhooks & Services"
3. Click "Add webhook"
4. Set the following configuration:
   - Payload URL: `https://your-server.com/webhook/github`
   - Content type: `application/json`
   - Secret: Your webhook secret
   - Events: Select "Just the push events" or customize to include push and pull request events

## Commit Message Format

To link commits to Asana tasks, include the task ID in your commit messages using one of these formats:

```
# Task ID formats
task-123: Add new feature
TASK-123: Fix bug
Task-123: Update documentation
#123: Refactor code
[123] Improve performance
```

## Pull Request Integration

Pull requests are automatically linked to tasks when the task ID is included in the PR title or description using the same formats as commit messages.

Task status is automatically updated based on PR actions:
- **Opened/Reopened**: Task status changes to "In Review"
- **Merged**: Task status changes to "Completed"
- **Closed (without merge)**: Task status changes to "Blocked"

## Custom Fields

The integration can update custom fields in Asana tasks:
- GitHub PR Number
- GitHub PR Status
- Last Commit Hash
- Branch Name
- GitHub URL

## Security

- All webhook requests are verified using the GitHub webhook secret
- Asana API tokens should have minimal required permissions
- Environment variables should be stored securely
- HTTPS should be used for all webhook endpoints

## Testing

Run the test suite:
```bash
npm test
```

## Deployment

The webhook handler can be deployed to any Node.js hosting platform:
- Heroku
- AWS Lambda
- Google Cloud Functions
- Azure Functions
- Traditional server with Node.js

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Verify the payload URL is correct and accessible
   - Check that the webhook secret matches
   - Ensure the correct events are selected

2. **Tasks not updating**
   - Verify the Asana access token has proper permissions
   - Check that task IDs in commit messages are correct
   - Review the service logs for error messages

3. **Authentication errors**
   - Verify the Asana access token is valid
   - Check that the token has not expired
   - Ensure the token has access to the specified workspace

### Logs

The service logs all activities to stdout/stderr. Check your hosting platform's logging system for detailed information.

## Support

For issues with the integration, contact the development team or check the service logs for error details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.