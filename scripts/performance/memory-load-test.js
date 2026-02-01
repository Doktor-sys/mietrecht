#!/usr/bin/env node

/**
 * Memory Load Testing Script
 * Tests the Memory Optimization Service under various load conditions
 */

const { MemoryOptimizationService } = require('../../services/backend/dist/services/MemoryOptimizationService.js');

// Simulate memory-intensive operations
async function simulateMemoryLoad() {
  console.log('Starting memory load test...');
  
  const memoryService = MemoryOptimizationService.getInstance();
  
  // Start memory monitoring
  memoryService.startMonitoring();
  
  // Create memory pressure
  console.log('Creating memory pressure...');
  const largeArray = [];
  
  // Allocate large amounts of memory
  for (let i = 0; i < 100000; i++) {
    largeArray.push({
      id: i,
      data: 'This is a test string to consume memory '.repeat(100),
      timestamp: Date.now(),
      nested: {
        value: Math.random(),
        array: Array.from({length: 100}, () => Math.random())
      }
    });
    
    // Periodically check memory
    if (i % 10000 === 0) {
      const stats = await memoryService.getMemoryStats();
      console.log(`Iteration ${i}: Heap used: ${stats.heapUsedMB.toFixed(2)} MB`);
    }
  }
  
  console.log('Memory pressure created. Forcing optimization...');
  
  // Force memory optimization
  await memoryService.forceOptimization();
  
  // Check memory after optimization
  const stats = await memoryService.getMemoryStats();
  console.log(`After optimization: Heap used: ${stats.heapUsedMB.toFixed(2)} MB`);
  
  // Clean up
  largeArray.length = 0;
  
  // Check memory after cleanup
  const finalStats = await memoryService.getMemoryStats();
  console.log(`After cleanup: Heap used: ${finalStats.heapUsedMB.toFixed(2)} MB`);
  
  console.log('Memory load test completed.');
  
  // Stop monitoring
  memoryService.stopMonitoring();
}

// Run the test
if (require.main === module) {
  simulateMemoryLoad()
    .then(() => {
      console.log('Test completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { simulateMemoryLoad };