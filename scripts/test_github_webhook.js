/**
 * Test script for GitHub webhook handler
 * This script simulates GitHub webhook events to test the integration
 */

const axios = require('axios');
const crypto = require('crypto');

// GitHub webhook secret (should match the one in your configuration)
const GITHUB_WEBHOOK_SECRET = 'test-secret-123';

// Webhook URL (update this to match your deployment)
const WEBHOOK_URL = 'http://localhost:3000/webhook/github';

// Sample push event payload
const pushEventPayload = {
  ref: 'refs/heads/main',
  before: 'a1b2c3d4e5f6',
  after: 'f6e5d4c3b2a1',
  repository: {
    id: 123456,
    name: 'smartlaw-mietrecht',
    full_name: 'jurismind/smartlaw-mietrecht',
    html_url: 'https://github.com/jurismind/smartlaw-mietrecht'
  },
  pusher: {
    name: 'maxmustermann',
    email: 'max@jurismind.de'
  },
  commits: [
    {
      id: 'f6e5d4c3b2a1',
      tree_id: '1a2b3c4d5e6f',
      distinct: true,
      message: 'task-123: Add user authentication feature',
      timestamp: '2025-11-26T10:00:00Z',
      url: 'https://github.com/jurismind/smartlaw-mietrecht/commit/f6e5d4c3b2a1',
      author: {
        name: 'Max Mustermann',
        email: 'max@jurismind.de'
      },
      committer: {
        name: 'Max Mustermann',
        email: 'max@jurismind.de'
      },
      added: [],
      removed: [],
      modified: ['services/backend/src/auth.js']
    },
    {
      id: 'e5d4c3b2a1f6',
      tree_id: '2b3c4d5e6f1a',
      distinct: true,
      message: 'Fix bug in payment processing',
      timestamp: '2025-11-26T10:05:00Z',
      url: 'https://github.com/jurismind/smartlaw-mietrecht/commit/e5d4c3b2a1f6',
      author: {
        name: 'Sarah Schmidt',
        email: 'sarah@jurismind.de'
      },
      committer: {
        name: 'Sarah Schmidt',
        email: 'sarah@jurismind.de'
      },
      added: [],
      removed: [],
      modified: ['services/backend/src/payment.js']
    }
  ]
};

// Sample pull request event payload
const pullRequestEventPayload = {
  action: 'opened',
  number: 42,
  pull_request: {
    id: 123456789,
    html_url: 'https://github.com/jurismind/smartlaw-mietrecht/pull/42',
    title: 'task-456: Implement document search functionality',
    state: 'open',
    user: {
      login: 'lisa-weber',
      id: 987654321
    },
    body: 'This PR implements the document search feature as requested.',
    created_at: '2025-11-26T11:00:00Z',
    updated_at: '2025-11-26T11:00:00Z',
    closed_at: null,
    merged_at: null,
    merge_commit_sha: null,
    head: {
      label: 'jurismind:feature/document-search',
      ref: 'feature/document-search',
      sha: 'a1b2c3d4e5f6',
      repo: {
        id: 123456,
        name: 'smartlaw-mietrecht',
        full_name: 'jurismind/smartlaw-mietrecht'
      }
    },
    base: {
      label: 'jurismind:main',
      ref: 'main',
      sha: 'f6e5d4c3b2a1',
      repo: {
        id: 123456,
        name: 'smartlaw-mietrecht',
        full_name: 'jurismind/smartlaw-mietrecht'
      }
    }
  },
  repository: {
    id: 123456,
    name: 'smartlaw-mietrecht',
    full_name: 'jurismind/smartlaw-mietrecht',
    html_url: 'https://github.com/jurismind/smartlaw-mietrecht'
  },
  sender: {
    login: 'lisa-weber',
    id: 112233445
  }
};

// Function to create GitHub webhook signature
function createSignature(payload, secret) {
  const payloadString = JSON.stringify(payload);
  const signature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
  return signature;
}

// Function to send test event
async function sendTestEvent(eventType, payload) {
  try {
    const signature = createSignature(payload, GITHUB_WEBHOOK_SECRET);
    
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'X-GitHub-Event': eventType,
        'X-Hub-Signature-256': signature,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ ${eventType} event sent successfully`);
    console.log(`Status: ${response.status}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending ${eventType} event:`, error.message);
    if (error.response) {
      console.error(`Response: ${error.response.status} - ${error.response.statusText}`);
    }
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Testing GitHub-Asana Webhook Integration');
  console.log('=============================================');
  
  // Test push event
  console.log('\n1. Testing push event...');
  await sendTestEvent('push', pushEventPayload);
  
  // Test pull request event
  console.log('\n2. Testing pull request event...');
  await sendTestEvent('pull_request', pullRequestEventPayload);
  
  console.log('\n✅ Test completed!');
  console.log('\n📝 Note: Make sure the webhook handler is running at', WEBHOOK_URL);
  console.log('   Update WEBHOOK_URL in this script if your handler is deployed elsewhere.');
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { 
  pushEventPayload, 
  pullRequestEventPayload, 
  sendTestEvent, 
  runTests 
};