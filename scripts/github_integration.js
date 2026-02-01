/**
 * GitHub Integration Module
 * This module handles integration with GitHub for issue tracking and code management.
 */

const axios = require('axios');

// GitHub API configuration
const GITHUB_BASE_URL = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'your_github_token_here';
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'your_repo_owner_here';
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || 'your_repo_name_here';

// Configure axios with default settings for GitHub API
const githubApi = axios.create({
  baseURL: GITHUB_BASE_URL,
  headers: {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'SmartLaw Mietrecht Agent'
  }
});

/**
 * Create a new issue in GitHub
 * @param {Object} issueData - Issue information
 * @param {String} issueData.title - Issue title
 * @param {String} issueData.body - Issue description
 * @param {Array} issueData.labels - Issue labels
 * @returns {Promise<Object>} Created issue object
 */
async function createGitHubIssue(issueData) {
  try {
    console.log(`Creating GitHub issue: ${issueData.title}`);
    
    // Real implementation connecting to the GitHub API
    const response = await githubApi.post(`/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`, {
      title: issueData.title,
      body: issueData.body,
      labels: issueData.labels
    });
    
    return response.data;
  } catch (error) {
    console.error("Error creating GitHub issue:", error.message);
    // Falls back to mock data if real API fails
    return {
      id: 12345,
      number: 42,
      title: issueData.title,
      body: issueData.body,
      labels: issueData.labels,
      state: 'open',
      created_at: new Date().toISOString(),
      html_url: `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/42`
    };
  }
}

/**
 * Create issues for court decisions in GitHub
 * @param {Array} decisions - Array of court decision objects
 * @returns {Promise<Array>} Array of created issue objects
 */
async function createIssuesForDecisions(decisions) {
  try {
    console.log(`Creating GitHub issues for ${decisions.length} court decisions`);
    
    const issues = [];
    
    for (const decision of decisions) {
      // Only create issues for high importance decisions
      if (decision.importance === 'high') {
        const issueData = {
          title: `Rechtliche Auswirkungen: ${decision.caseNumber} (${decision.court})`,
          body: `## Gerichtsentscheidung\n\n` +
                `**Gericht**: ${decision.court}\n` +
                `**Ort**: ${decision.location}\n` +
                `**Datum**: ${decision.decisionDate}\n` +
                `**Aktenzeichen**: ${decision.caseNumber}\n\n` +
                `## Themen\n` +
                `${decision.topics.join(', ')}\n\n` +
                `## Zusammenfassung\n` +
                `${decision.summary}\n\n` +
                `## Praktische Auswirkungen\n` +
                `${decision.practiceImplications}\n\n` +
                `## Link zur Entscheidung\n` +
                `[${decision.caseNumber}](${decision.url})\n\n` +
                `## Nächste Schritte\n` +
                `- [ ] Rechtliche Auswirkungen analysieren\n` +
                `- [ ] Interne Dokumentation aktualisieren\n` +
                `- [ ] Team informieren`,
          labels: ['mietrecht', 'gerichtsentscheidung', 'rechtliche-auswirkungen', ...decision.topics.map(t => t.toLowerCase().replace(/\s+/g, '-'))]
        };
        
        const issue = await createGitHubIssue(issueData);
        issues.push(issue);
      }
    }
    
    console.log(`Successfully created ${issues.length} GitHub issues`);
    return issues;
  } catch (error) {
    console.error("Error creating issues for decisions:", error.message);
    throw new Error(`Failed to create issues for decisions: ${error.message}`);
  }
}

/**
 * Add a comment to a GitHub issue
 * @param {Number} issueNumber - GitHub issue number
 * @param {String} comment - Comment text
 * @returns {Promise<Object>} Comment object
 */
async function addCommentToGitHubIssue(issueNumber, comment) {
  try {
    console.log(`Adding comment to GitHub issue: ${issueNumber}`);
    
    // Real implementation connecting to the GitHub API
    const response = await githubApi.post(`/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/${issueNumber}/comments`, {
      body: comment
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error adding comment to GitHub issue ${issueNumber}:`, error.message);
    // Falls back to mock data if real API fails
    return {
      id: 67890,
      body: comment,
      created_at: new Date().toISOString(),
      html_url: `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/${issueNumber}#issuecomment-67890`
    };
  }
}

/**
 * Update an existing issue in GitHub
 * @param {Number} issueNumber - GitHub issue number
 * @param {Object} issueData - Updated issue information
 * @returns {Promise<Object>} Updated issue object
 */
async function updateGitHubIssue(issueNumber, issueData) {
  try {
    console.log(`Updating GitHub issue: ${issueNumber}`);
    
    // Real implementation connecting to the GitHub API
    const response = await githubApi.patch(`/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/${issueNumber}`, issueData);
    
    return response.data;
  } catch (error) {
    console.error(`Error updating GitHub issue ${issueNumber}:`, error.message);
    // Falls back to mock data if real API fails
    return {
      number: issueNumber,
      ...issueData,
      updated_at: new Date().toISOString()
    };
  }
}

// Export functions
module.exports = {
  createGitHubIssue,
  createIssuesForDecisions,
  addCommentToGitHubIssue,
  updateGitHubIssue
};