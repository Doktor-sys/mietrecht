#!/usr/bin/env node

/**
 * Test Runner Script für SmartLaw Backend
 * 
 * Verwendung:
 *   node scripts/run-tests.js [options]
 * 
 * Optionen:
 *   --unit          Nur Unit Tests
 *   --integration   Nur Integration Tests
 *   --e2e           Nur E2E Tests
 *   --coverage      Mit Coverage Report
 *   --watch         Watch Mode
 *   --parallel      Parallel Test Execution
 *   --max-workers   Max Workers (default: 50%)
 */

const { spawn } = require('child_process');
const path = require('path');

// Parse Command Line Arguments
const args = process.argv.slice(2);
const options = {
  unit: args.includes('--unit'),
  integration: args.includes('--integration'),
  e2e: args.includes('--e2e'),
  coverage: args.includes('--coverage'),
  watch: args.includes('--watch'),
  parallel: args.includes('--parallel'),
  maxWorkers: args.includes('--max-workers') ? args[args.indexOf('--max-workers') + 1] : undefined
};

// Build Jest Command
let jestArgs = [];

// Test Pattern
if (options.unit) {
  jestArgs.push('--testPathIgnorePatterns=integration|e2e');
  console.log('🧪 Running Unit Tests...\n');
} else if (options.integration) {
  jestArgs.push('--testPathPattern=integration');
  console.log('🔗 Running Integration Tests...\n');
} else if (options.e2e) {
  jestArgs.push('--testPathPattern=e2e');
  console.log('🎭 Running E2E Tests...\n');
} else {
  console.log('🧪 Running All Tests...\n');
}

// Coverage
if (options.coverage) {
  jestArgs.push('--coverage');
  jestArgs.push('--coverageReporters=text');
  jestArgs.push('--coverageReporters=lcov');
  jestArgs.push('--coverageReporters=html');
  jestArgs.push('--coverageReporters=json-summary');
  console.log('📊 Coverage Report will be generated\n');
}

// Watch Mode
if (options.watch) {
  jestArgs.push('--watch');
  console.log('👀 Watch Mode enabled\n');
}

// Parallel Execution
if (options.parallel) {
  jestArgs.push('--maxWorkers=75%');
  console.log('🏃 Parallel Execution enabled\n');
}

// Max Workers
if (options.maxWorkers) {
  jestArgs.push(`--maxWorkers=${options.maxWorkers}`);
  console.log(`⚙️  Max Workers set to ${options.maxWorkers}\n`);
}

// Run Jest
const jest = spawn('npx', ['jest', ...jestArgs], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
});

jest.on('error', (error) => {
  console.error('❌ Error running tests:', error);
  process.exit(1);
});

jest.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All tests passed!');
    
    if (options.coverage) {
      console.log('\n📊 Coverage report generated:');
      console.log('   HTML: coverage/index.html');
      console.log('   LCOV: coverage/lcov.info');
      console.log('   JSON: coverage/coverage-summary.json');
    }
  } else {
    console.log(`\n❌ Tests failed with exit code ${code}`);
  }
  
  process.exit(code);
});