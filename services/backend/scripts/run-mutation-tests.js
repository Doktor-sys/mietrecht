#!/usr/bin/env node

/**
 * Script to run mutation tests with proper reporting and CI integration
 * This script enhances the basic Stryker mutation testing with better reporting
 * and integration with the CI pipeline.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to run Stryker mutation testing
async function runMutationTests() {
  console.log('🔬 Running Mutation Tests with Stryker');
  console.log('=====================================');
  
  // Ensure reports directory exists
  const reportsDir = path.join(__dirname, '..', 'reports', 'mutation');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Run Stryker with enhanced options
  const stryker = spawn('npx', ['stryker', 'run'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      STRYKER_DISABLE_SEARCH: 'true'
    }
  });
  
  stryker.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Mutation testing completed successfully');
      generateMutationReport();
    } else {
      console.log('❌ Mutation testing failed with exit code:', code);
      process.exit(code);
    }
  });
  
  stryker.on('error', (error) => {
    console.error('Failed to start Stryker:', error);
    process.exit(1);
  });
}

// Function to generate enhanced mutation test report
function generateMutationReport() {
  const reportPath = path.join(__dirname, '..', 'reports', 'mutation', 'mutation-report.json');
  const htmlReportPath = path.join(__dirname, '..', 'reports', 'mutation', 'index.html');
  
  // Check if JSON report exists
  if (fs.existsSync(reportPath)) {
    try {
      const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const mutationScore = calculateMutationScore(reportData);
      
      console.log(`\n📊 Mutation Test Results:`);
      console.log(`   Mutation Score: ${mutationScore.toFixed(2)}%`);
      console.log(`   Threshold: 85% (minimum acceptable)`);
      console.log(`   Status: ${mutationScore >= 85 ? '✅ PASS' : '❌ FAIL'}`);
      
      // Check if mutation score meets threshold
      if (mutationScore < 80) {
        console.log(`\n🚨 CRITICAL: Mutation score ${mutationScore.toFixed(2)}% is below the minimum threshold of 80%!`);
        console.log(`   Build will be failed to prevent deployment of inadequately tested code.`);
        process.exit(1);
      } else if (mutationScore < 85) {
        console.log(`\n⚠️  WARNING: Mutation score ${mutationScore.toFixed(2)}% is below target of 85%`);
        console.log(`   Consider improving test coverage before merging.`);
      } else {
        console.log(`\n✅ SUCCESS: Mutation score ${mutationScore.toFixed(2)}% meets or exceeds target of 85%`);
      }
      
      // Generate summary report
      generateSummaryReport(reportData, mutationScore);
    } catch (error) {
      console.error('Error processing mutation test report:', error);
    }
  } else {
    console.log('No mutation test report found');
  }
}

// Function to calculate mutation score
function calculateMutationScore(reportData) {
  if (!reportData || !reportData.metrics) {
    return 0;
  }
  
  const metrics = reportData.metrics;
  if (metrics.totalMutants === 0) {
    return 100; // No mutants to test, perfect score
  }
  
  // Mutation score = (Survived + TimedOut) / Total * 100
  // But we want the inverse: how many mutants were killed
  const killedMutants = metrics.killed + metrics.timeout;
  return (killedMutants / metrics.totalMutants) * 100;
}

// Function to generate summary report
function generateSummaryReport(reportData, mutationScore) {
  const summaryPath = path.join(__dirname, '..', 'reports', 'mutation', 'summary.md');
  
  const summary = `# Mutation Test Summary

## Overall Results
- **Mutation Score**: ${mutationScore.toFixed(2)}%
- **Total Mutants**: ${reportData.metrics.totalMutants}
- **Killed Mutants**: ${reportData.metrics.killed}
- **Survived Mutants**: ${reportData.metrics.survived}
- **Timeout Mutants**: ${reportData.metrics.timeout}
- **No Coverage Mutants**: ${reportData.metrics.noCoverage}

## Status
${mutationScore >= 85 ? '✅ PASS - Meets target score of 85%' : 
  mutationScore >= 80 ? '⚠️ WARNING - Below target score of 85%' : 
  '❌ FAIL - Below minimum threshold of 80%'}

## Detailed Report
For detailed results, see the [HTML report](${path.relative(path.join(__dirname, '..'), htmlReportPath)})`;

  fs.writeFileSync(summaryPath, summary);
  console.log(`\n📝 Summary report generated at: ${summaryPath}`);
}

// Run the mutation tests
runMutationTests().catch(error => {
  console.error('Error running mutation tests:', error);
  process.exit(1);
});