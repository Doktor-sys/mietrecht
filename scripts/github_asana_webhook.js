/**
 * GitHub-Asana Webhook Handler
 * This script demonstrates how GitHub webhooks can be integrated with Asana
 * to automatically update tasks based on repository events.
 */

// Import required modules
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.github-asana file
const envPath = path.join(__dirname, '..', '.env.github-asana');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Environment variables
const ASANA_ACCESS_TOKEN = process.env.ASANA_ACCESS_TOKEN;
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const ASANA_WORKSPACE_ID = process.env.ASANA_WORKSPACE_ID;

// Asana API configuration
const ASANA_API_BASE = 'https://app.asana.com/api/1.0';
const asanaHeaders = {
  'Authorization': `Bearer ${ASANA_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};

/**
 * Verify GitHub webhook signature
 */
function verifySignature(payload, signature) {
  if (!GITHUB_WEBHOOK_SECRET) {
    console.warn('GitHub webhook secret not configured');
    return true; // In production, this should be false
  }
  
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', GITHUB_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Extract Asana task ID from commit message
 */
function extractTaskIdFromCommit(message) {
  // Look for patterns like "task-123" or "TASK-123" or "#123"
  const patterns = [
    /(?:task|TASK|Task)[-_\s]?(\d+)/i,
    /#(\d+)/,
    /\[(\d+)\]/
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Update Asana task with commit information
 */
async function updateTaskWithCommit(taskId, commitInfo) {
  try {
    // Get existing task details
    const taskResponse = await axios.get(
      `${ASANA_API_BASE}/tasks/${taskId}`, 
      { headers: asanaHeaders }
    );
    
    const task = taskResponse.data.data;
    
    // Create a comment with commit information
    const commentData = {
      data: {
        text: `GitHub commit: ${commitInfo.message}\n` +
              `Author: ${commitInfo.author}\n` +
              `Commit: ${commitInfo.url}\n` +
              `Branch: ${commitInfo.branch}`
      }
    };
    
    await axios.post(
      `${ASANA_API_BASE}/tasks/${taskId}/stories`,
      commentData,
      { headers: asanaHeaders }
    );
    
    // Update task status to "In Progress" if it's not already
    if (task.completed === false && 
        (!task.custom_fields || !task.custom_fields.find(f => f.name === 'Status') || 
         task.custom_fields.find(f => f.name === 'Status').enum_value.name !== 'In Progress')) {
      
      // Find the Status custom field
      const statusField = task.custom_fields.find(f => f.name === 'Status');
      if (statusField && statusField.enum_options) {
        const inProgressOption = statusField.enum_options.find(o => o.name === 'In Progress');
        if (inProgressOption) {
          const updateData = {
            data: {
              custom_fields: {
                [statusField.gid]: inProgressOption.gid
              }
            }
          };
          
          await axios.put(
            `${ASANA_API_BASE}/tasks/${taskId}`,
            updateData,
            { headers: asanaHeaders }
          );
        }
      }
    }
    
    console.log(`Successfully updated task ${taskId} with commit info`);
    return true;
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error.message);
    return false;
  }
}

/**
 * Handle GitHub push event
 */
async function handlePushEvent(payload) {
  const commits = payload.commits;
  const branch = payload.ref.replace('refs/heads/', '');
  const repoUrl = payload.repository.html_url;
  
  console.log(`Processing ${commits.length} commits on branch ${branch}`);
  
  for (const commit of commits) {
    const taskId = extractTaskIdFromCommit(commit.message);
    
    if (taskId) {
      console.log(`Found task ID ${taskId} in commit: ${commit.message}`);
      
      const commitInfo = {
        message: commit.message,
        author: commit.author.name,
        url: `${repoUrl}/commit/${commit.id}`,
        branch: branch
      };
      
      await updateTaskWithCommit(taskId, commitInfo);
    } else {
      console.log(`No task ID found in commit: ${commit.message}`);
    }
  }
}

/**
 * Handle GitHub pull request event
 */
async function handlePullRequestEvent(payload) {
  const pr = payload.pull_request;
  const action = payload.action;
  const taskId = extractTaskIdFromCommit(pr.title + ' ' + pr.body);
  
  if (!taskId) {
    console.log('No task ID found in pull request');
    return;
  }
  
  console.log(`Processing pull request #${pr.number} for task ${taskId}`);
  
  try {
    // Create a comment with PR information
    const commentData = {
      data: {
        text: `GitHub Pull Request #${pr.number}: ${pr.title}\n` +
              `Author: ${pr.user.login}\n` +
              `URL: ${pr.html_url}\n` +
              `Action: ${action}`
      }
    };
    
    await axios.post(
      `${ASANA_API_BASE}/tasks/${taskId}/stories`,
      commentData,
      { headers: asanaHeaders }
    );
    
    // Update task status based on PR action
    let statusToUpdate = null;
    
    switch (action) {
      case 'opened':
      case 'reopened':
        statusToUpdate = 'In Review';
        break;
      case 'closed':
        if (pr.merged) {
          statusToUpdate = 'Completed';
        } else {
          statusToUpdate = 'Blocked';
        }
        break;
    }
    
    if (statusToUpdate) {
      // Get task details to find the Status field
      const taskResponse = await axios.get(
        `${ASANA_API_BASE}/tasks/${taskId}`, 
        { headers: asanaHeaders }
      );
      
      const task = taskResponse.data.data;
      const statusField = task.custom_fields.find(f => f.name === 'Status');
      
      if (statusField && statusField.enum_options) {
        const statusOption = statusField.enum_options.find(o => o.name === statusToUpdate);
        if (statusOption) {
          const updateData = {
            data: {
              custom_fields: {
                [statusField.gid]: statusOption.gid
              }
            }
          };
          
          await axios.put(
            `${ASANA_API_BASE}/tasks/${taskId}`,
            updateData,
            { headers: asanaHeaders }
          );
          
          console.log(`Updated task ${taskId} status to ${statusToUpdate}`);
        }
      }
    }
    
  } catch (error) {
    console.error(`Error processing pull request for task ${taskId}:`, error.message);
  }
}

// Webhook endpoint
app.post('/webhook/github', (req, res) => {
  const signature = req.get('X-Hub-Signature-256');
  const event = req.get('X-GitHub-Event');
  
  // Verify webhook signature
  if (signature && !verifySignature(JSON.stringify(req.body), signature)) {
    console.warn('Invalid webhook signature');
    return res.status(401).send('Unauthorized');
  }
  
  console.log(`Received GitHub event: ${event}`);
  
  // Handle different event types
  switch (event) {
    case 'push':
      handlePushEvent(req.body);
      break;
    case 'pull_request':
      handlePullRequestEvent(req.body);
      break;
    default:
      console.log(`Unhandled event type: ${event}`);
  }
  
  // Always respond quickly to GitHub
  res.status(200).send('OK');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'GitHub-Asana Integration'
  });
});

// Start server
app.listen(port, () => {
  console.log(`GitHub-Asana webhook handler listening at http://localhost:${port}`);
  console.log('Environment variables required:');
  console.log('- ASANA_ACCESS_TOKEN: Personal access token for Asana API');
  console.log('- GITHUB_WEBHOOK_SECRET: Secret for GitHub webhook validation');
  console.log('- ASANA_WORKSPACE_ID: ID of the Asana workspace');
});

module.exports = app;