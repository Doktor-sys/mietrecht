/**
 * Performance Benchmarking Script
 * This script measures the performance of various components of the Mietrecht Agent.
 */

// Import required modules
const https = require('https');

// Import modules to benchmark
const { fetchBGHDecisions } = require('../mietrecht_data_sources.js');
const { initializeDatabase, closeDatabase } = require('../database/connection.js');
const { getAllCourtDecisions, createCourtDecision } = require('../database/dao/courtDecisionDao.js');
const { getAllLawyers } = require('../database/dao/lawyerDao.js');

/**
 * Measure execution time of a function
 * @param {Function} fn - Function to measure
 * @param {...any} args - Arguments to pass to the function
 * @returns {Promise<Object>} Object containing result and execution time
 */
async function measureExecutionTime(fn, ...args) {
  const startTime = process.hrtime.bigint();
  try {
    const result = await fn(...args);
    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    return {
      result,
      executionTime,
      success: true
    };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    return {
      result: null,
      executionTime,
      success: false,
      error: error.message
    };
  }
}

/**
 * Benchmark BGH API client
 */
async function benchmarkBGHApi() {
  console.log('Benchmarking BGH API client...');
  
  // Test with different date ranges
  const benchmarks = [
    { name: 'Last 7 days', options: { dateFrom: getDateNDaysAgo(7), dateTo: getToday() } },
    { name: 'Last 30 days', options: { dateFrom: getDateNDaysAgo(30), dateTo: getToday() } },
    { name: 'Last 90 days', options: { dateFrom: getDateNDaysAgo(90), dateTo: getToday() } }
  ];
  
  for (const benchmark of benchmarks) {
    console.log(`  Testing: ${benchmark.name}`);
    const result = await measureExecutionTime(fetchBGHDecisions, benchmark.options);
    
    if (result.success) {
      console.log(`    Execution time: ${result.executionTime.toFixed(2)} ms`);
      console.log(`    Decisions found: ${result.result.length}`);
    } else {
      console.log(`    Execution time: ${result.executionTime.toFixed(2)} ms`);
      console.log(`    Error: ${result.error}`);
    }
  }
}

/**
 * Benchmark database operations
 */
async function benchmarkDatabase() {
  console.log('Benchmarking database operations...');
  
  try {
    await initializeDatabase();
    
    // Benchmark retrieving all court decisions
    console.log('  Benchmarking getAllCourtDecisions...');
    const getAllResult = await measureExecutionTime(getAllCourtDecisions, { limit: 100 });
    console.log(`    Execution time: ${getAllResult.executionTime.toFixed(2)} ms`);
    console.log(`    Decisions retrieved: ${getAllResult.result.length}`);
    
    // Benchmark retrieving all lawyers
    console.log('  Benchmarking getAllLawyers...');
    const getLawyersResult = await measureExecutionTime(getAllLawyers);
    console.log(`    Execution time: ${getLawyersResult.executionTime.toFixed(2)} ms`);
    console.log(`    Lawyers retrieved: ${getLawyersResult.result.length}`);
    
    // Benchmark creating a court decision
    console.log('  Benchmarking createCourtDecision...');
    const testDecision = {
      decision_id: `benchmark-${Date.now()}`,
      court: 'Bundesgerichtshof',
      location: 'Karlsruhe',
      decision_date: new Date().toISOString().split('T')[0],
      case_number: 'Benchmark Case',
      topics: ['Benchmark', 'Performance'],
      summary: 'This is a benchmark decision',
      full_text: 'Full text of the benchmark decision',
      url: 'https://example.com/benchmark',
      judges: ['Benchmark Judge'],
      practice_implications: 'None',
      importance: 'medium',
      source: 'benchmark',
      processed: false
    };
    
    const createResult = await measureExecutionTime(createCourtDecision, testDecision);
    console.log(`    Execution time: ${createResult.executionTime.toFixed(2)} ms`);
    console.log(`    Decision created with ID: ${createResult.result}`);
    
    await closeDatabase();
  } catch (error) {
    console.error('Error benchmarking database:', error);
  }
}

/**
 * Benchmark HTTP requests
 */
async function benchmarkHttpRequests() {
  console.log('Benchmarking HTTP requests...');
  
  // Test HTTPS request to a reliable endpoint
  const testUrls = [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'BGH', url: 'https://juris.bundesgerichtshof.de' }
  ];
  
  for (const test of testUrls) {
    console.log(`  Testing: ${test.name}`);
    const result = await measureExecutionTime(makeHttpsRequest, test.url);
    
    if (result.success) {
      console.log(`    Execution time: ${result.executionTime.toFixed(2)} ms`);
      console.log(`    Response status: ${result.result.statusCode}`);
    } else {
      console.log(`    Execution time: ${result.executionTime.toFixed(2)} ms`);
      console.log(`    Error: ${result.error}`);
    }
  }
}

/**
 * Make an HTTPS request and return the response
 * @param {string} url - URL to request
 * @returns {Promise<Object>} Response object
 */
function makeHttpsRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      res.on('data', () => {}); // Consume response data
      res.on('end', () => {
        resolve({ statusCode: res.statusCode });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

/**
 * Get date N days ago formatted as YYYY-MM-DD
 * @param {number} days - Number of days ago
 * @returns {string} Formatted date
 */
function getDateNDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date formatted as YYYY-MM-DD
 * @returns {string} Formatted date
 */
function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Run all benchmarks
 */
async function runAllBenchmarks() {
  console.log('Running performance benchmarks...');
  console.log('');
  
  // Run BGH API benchmark
  await benchmarkBGHApi();
  console.log('');
  
  // Run database benchmark
  await benchmarkDatabase();
  console.log('');
  
  // Run HTTP requests benchmark
  await benchmarkHttpRequests();
  console.log('');
  
  console.log('All benchmarks completed.');
}

// Run benchmarks if script is executed directly
if (require.main === module) {
  runAllBenchmarks()
    .then(() => {
      console.log('Benchmarking script finished.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error running benchmarking script:', error);
      process.exit(1);
    });
}

// Export functions for use in other modules
module.exports = {
  measureExecutionTime,
  benchmarkBGHApi,
  benchmarkDatabase,
  benchmarkHttpRequests,
  runAllBenchmarks
};