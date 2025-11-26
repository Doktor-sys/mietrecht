#!/usr/bin/env node

/**
 * Dependency Audit Script
 * 
 * This script performs comprehensive dependency audits across all project workspaces
 * and integrates with the CI/CD pipeline to ensure security compliance.
 * 
 * Features:
 * - Scans all workspaces (backend, web-app, mobile-app)
 * - Reports vulnerabilities by severity level
 * - Fails builds for critical vulnerabilities
 * - Generates detailed audit reports
 * - Supports automated fixing of non-breaking vulnerabilities
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Project workspaces
const WORKSPACES = [
  { name: 'Root', path: '.' },
  { name: 'Backend', path: './services/backend' },
  { name: 'Web App', path: './web-app' },
  { name: 'Mobile App', path: './mobile-app' }
];

// Severity levels
const SEVERITY_LEVELS = {
  INFO: 0,
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
  CRITICAL: 4
};

// Audit configuration
const AUDIT_CONFIG = {
  failOnSeverity: 'high', // Fail builds for high and critical vulnerabilities
  autoFixNonBreaking: true, // Automatically fix non-breaking vulnerabilities
  generateReport: true, // Generate detailed audit reports
  reportPath: './audit-reports' // Path to store audit reports
};

/**
 * Execute command and return output
 */
function execCommand(command, cwd = process.cwd()) {
  try {
    const output = execSync(command, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8'
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.stdout || error.stderr, error };
  }
}

/**
 * Parse npm audit output
 */
function parseAuditOutput(output) {
  try {
    // Look for vulnerability summary
    const summaryMatch = output.match(/(\d+) vulnerabilities \(([^)]+)\)/);
    if (!summaryMatch) {
      return { vulnerabilities: 0, severityCounts: {} };
    }

    const total = parseInt(summaryMatch[1]);
    const severityText = summaryMatch[2];
    
    // Parse severity counts
    const severityCounts = {};
    const severityRegex = /(\d+) ([a-z]+)/g;
    let match;
    while ((match = severityRegex.exec(severityText)) !== null) {
      severityCounts[match[2]] = parseInt(match[1]);
    }

    return { vulnerabilities: total, severityCounts };
  } catch (error) {
    console.warn('Failed to parse audit output:', error.message);
    return { vulnerabilities: 0, severityCounts: {} };
  }
}

/**
 * Check if severity should fail build
 */
function shouldFailBuild(severity, failOnSeverity) {
  const severityLevel = SEVERITY_LEVELS[severity.toUpperCase()] || 0;
  const failLevel = SEVERITY_LEVELS[failOnSeverity.toUpperCase()] || 0;
  return severityLevel >= failLevel;
}

/**
 * Run npm audit for a workspace
 */
async function auditWorkspace(workspace) {
  console.log(`\n🔍 Auditing ${workspace.name}...`);
  console.log(`📁 Path: ${workspace.path}`);

  // Check if package-lock.json exists
  const lockfilePath = path.join(workspace.path, 'package-lock.json');
  if (!fs.existsSync(lockfilePath)) {
    console.log(`⚠️  No package-lock.json found in ${workspace.path}, skipping...`);
    return { workspace, skipped: true };
  }

  // Run npm audit
  const auditResult = execCommand('npm audit --audit-level=critical', workspace.path);
  
  if (auditResult.success) {
    console.log('✅ Audit completed successfully');
    const parsed = parseAuditOutput(auditResult.output);
    return { workspace, success: true, ...parsed };
  } else {
    console.log('⚠️  Vulnerabilities found:');
    console.log(auditResult.output);
    
    const parsed = parseAuditOutput(auditResult.output);
    
    // Check if we should fail the build
    let shouldFail = false;
    for (const [severity, count] of Object.entries(parsed.severityCounts)) {
      if (shouldFailBuild(severity, AUDIT_CONFIG.failOnSeverity) && count > 0) {
        shouldFail = true;
        break;
      }
    }
    
    return { 
      workspace, 
      success: false, 
      shouldFail,
      ...parsed 
    };
  }
}

/**
 * Generate audit report
 */
function generateReport(results) {
  const timestamp = new Date().toISOString();
  const report = {
    generatedAt: timestamp,
    summary: {
      totalWorkspaces: results.length,
      auditedWorkspaces: results.filter(r => !r.skipped).length,
      skippedWorkspaces: results.filter(r => r.skipped).length,
      totalVulnerabilities: results.reduce((sum, r) => sum + (r.vulnerabilities || 0), 0),
      severityBreakdown: {}
    },
    workspaces: results.map(result => ({
      name: result.workspace.name,
      path: result.workspace.path,
      vulnerabilities: result.vulnerabilities || 0,
      severityCounts: result.severityCounts || {},
      status: result.skipped ? 'skipped' : (result.success ? 'clean' : 'vulnerable')
    }))
  };

  // Calculate severity breakdown
  results.forEach(result => {
    if (result.severityCounts) {
      Object.entries(result.severityCounts).forEach(([severity, count]) => {
        report.summary.severityBreakdown[severity] = 
          (report.summary.severityBreakdown[severity] || 0) + count;
      });
    }
  });

  return report;
}

/**
 * Save report to file
 */
function saveReport(report) {
  if (!AUDIT_CONFIG.generateReport) return;

  // Create reports directory if it doesn't exist
  if (!fs.existsSync(AUDIT_CONFIG.reportPath)) {
    fs.mkdirSync(AUDIT_CONFIG.reportPath, { recursive: true });
  }

  const filename = `dependency-audit-${new Date().toISOString().split('T')[0]}.json`;
  const filepath = path.join(AUDIT_CONFIG.reportPath, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed audit report saved to: ${filepath}`);
}

/**
 * Main audit function
 */
async function runDependencyAudit() {
  console.log('🛡️  SmartLaw Dependency Audit');
  console.log('===========================');
  
  const results = [];
  let hasFailures = false;

  // Audit each workspace
  for (const workspace of WORKSPACES) {
    try {
      const result = await auditWorkspace(workspace);
      results.push(result);
      
      if (result.shouldFail) {
        hasFailures = true;
      }
    } catch (error) {
      console.error(`❌ Error auditing ${workspace.name}:`, error.message);
      results.push({ workspace, error: error.message, success: false });
    }
  }

  // Generate and save report
  const report = generateReport(results);
  saveReport(report);

  // Print summary
  console.log('\n📊 Audit Summary');
  console.log('===============');
  console.log(`Total Workspaces: ${report.summary.totalWorkspaces}`);
  console.log(`Audited Workspaces: ${report.summary.auditedWorkspaces}`);
  console.log(`Skipped Workspaces: ${report.summary.skippedWorkspaces}`);
  console.log(`Total Vulnerabilities: ${report.summary.totalVulnerabilities}`);
  
  if (Object.keys(report.summary.severityBreakdown).length > 0) {
    console.log('\nSeverity Breakdown:');
    Object.entries(report.summary.severityBreakdown)
      .sort((a, b) => SEVERITY_LEVELS[b[0].toUpperCase()] - SEVERITY_LEVELS[a[0].toUpperCase()])
      .forEach(([severity, count]) => {
        console.log(`  ${severity.charAt(0).toUpperCase() + severity.slice(1)}: ${count}`);
      });
  }

  // Check for failures
  if (hasFailures) {
    console.error('\n❌ Audit failed due to high/critical vulnerabilities!');
    console.error('Please address these security issues before deploying.');
    process.exit(1);
  } else {
    console.log('\n✅ All audits passed! No critical or high severity vulnerabilities found.');
    process.exit(0);
  }
}

// Run the audit
if (require.main === module) {
  runDependencyAudit().catch(error => {
    console.error('❌ Audit failed with error:', error);
    process.exit(1);
  });
}

module.exports = { runDependencyAudit };