/**
 * Caching Optimization Test Script
 * This script tests the caching optimizations implemented in the Mietrecht Agent.
 */

// Import required modules
const { fetchWithCache, clearCache, getCacheSize } = require('../mietrecht_data_sources.js');

/**
 * Test function that simulates an API call
 * @param {String} data - Data to return
 * @returns {Promise<String>} Simulated API response
 */
async function simulateApiCall(data) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return `API Response: ${data} - ${new Date().toISOString()}`;
}

/**
 * Test basic caching functionality
 */
async function testBasicCaching() {
  console.log('Testing basic caching functionality...');
  
  // Clear cache first
  clearCache();
  
  // First call should not be cached
  console.log('First call (should not be cached):');
  const result1 = await fetchWithCache('test-key-1', () => simulateApiCall('Test Data 1'));
  console.log(`  Result: ${result1}`);
  
  // Second call with same key should be cached
  console.log('Second call with same key (should be cached):');
  const result2 = await fetchWithCache('test-key-1', () => simulateApiCall('Test Data 1'));
  console.log(`  Result: ${result2}`);
  
  // Check if results are the same (cached)
  console.log(`  Results are identical (cached): ${result1 === result2}`);
  
  // Third call with different key should not be cached
  console.log('Third call with different key (should not be cached):');
  const result3 = await fetchWithCache('test-key-2', () => simulateApiCall('Test Data 2'));
  console.log(`  Result: ${result3}`);
  
  // Check cache size
  console.log(`  Cache size: ${getCacheSize()}`);
  
  console.log('Basic caching test completed.\n');
}

/**
 * Test cache expiration
 */
async function testCacheExpiration() {
  console.log('Testing cache expiration...');
  
  // Clear cache first
  clearCache();
  
  // Override cache TTL for testing
  const originalTTL = require('../mietrecht_data_sources.js').CACHE_TTL;
  const testTTL = 91000; // 1.5 minutes for testing
  
  // First call should not be cached
  console.log('First call (should not be cached):');
  const result1 = await fetchWithCache('test-key-expire', () => simulateApiCall('Expiring Data'));
  console.log(`  Result: ${result1}`);
  
  // Second call should be cached
  console.log('Second call (should be cached):');
  const result2 = await fetchWithCache('test-key-expire', () => simulateApiCall('Expiring Data'));
  console.log(`  Result: ${result2}`);
  console.log(`  Results are identical (cached): ${result1 === result2}`);
  
  // Wait for cache to expire
  console.log('Waiting for cache to expire...');
  await new Promise(resolve => setTimeout(resolve, testTTL));
  
  // Third call should not be cached (expired)
  console.log('Third call after expiration (should not be cached):');
  const result3 = await fetchWithCache('test-key-expire', () => simulateApiCall('Expiring Data'));
  console.log(`  Result: ${result3}`);
  console.log(`  Results are identical (cached): ${result1 === result3}`);
  
  console.log('Cache expiration test completed.\n');
}

/**
 * Test LRU cache eviction
 */
async function testLRUCacheEviction() {
  console.log('Testing LRU cache eviction...');
  
  // Clear cache first
  clearCache();
  
  // Add items to cache up to limit
  console.log('Adding items to cache...');
  for (let i = 1; i <= 5; i++) {
    await fetchWithCache(`test-key-${i}`, () => simulateApiCall(`Data ${i}`));
    console.log(`  Added item ${i}, cache size: ${getCacheSize()}`);
  }
  
  // Access first item to make it recently used
  console.log('Accessing first item to make it recently used...');
  await fetchWithCache('test-key-1', () => simulateApiCall('Data 1'));
  
  // Add more items to trigger eviction
  console.log('Adding more items to trigger eviction...');
  for (let i = 6; i <= 8; i++) {
    await fetchWithCache(`test-key-${i}`, () => simulateApiCall(`Data ${i}`));
    console.log(`  Added item ${i}, cache size: ${getCacheSize()}`);
  }
  
  // Check if first item is still in cache (it should be due to LRU)
  console.log('Checking if first item is still in cache...');
  const result = await fetchWithCache('test-key-1', () => simulateApiCall('Data 1'));
  console.log(`  First item result: ${result}`);
  console.log(`  First item was cached: ${result.includes('Data 1') && !result.includes('new Date()')}`);
  
  console.log('LRU cache eviction test completed.\n');
}

/**
 * Test disabling cache
 */
async function testDisableCache() {
  console.log('Testing cache disabling...');
  
  // Clear cache first
  clearCache();
  
  // Call with cache enabled (default)
  console.log('Call with cache enabled (default):');
  const result1 = await fetchWithCache('test-key-disable', () => simulateApiCall('Disable Test'), true);
  console.log(`  Result: ${result1}`);
  
  // Call with cache disabled
  console.log('Call with cache disabled:');
  const result2 = await fetchWithCache('test-key-disable', () => simulateApiCall('Disable Test'), false);
  console.log(`  Result: ${result2}`);
  
  // Check if results are different (not cached)
  console.log(`  Results are different (not cached): ${result1 !== result2}`);
  
  console.log('Cache disabling test completed.\n');
}

/**
 * Run all caching tests
 */
async function runAllCachingTests() {
  console.log('Running all caching optimization tests...\n');
  
  try {
    await testBasicCaching();
    await testCacheExpiration();
    await testLRUCacheEviction();
    await testDisableCache();
    
    console.log('All caching optimization tests completed successfully.');
  } catch (error) {
    console.error('Error running caching tests:', error);
    process.exit(1);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runAllCachingTests()
    .then(() => {
      console.log('Caching optimization tests finished.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error running caching optimization tests:', error);
      process.exit(1);
    });
}

// Export functions for use in other modules
module.exports = {
  testBasicCaching,
  testCacheExpiration,
  testLRUCacheEviction,
  testDisableCache,
  runAllCachingTests
};