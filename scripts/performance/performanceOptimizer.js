/**
 * Performance Optimization Script
 * This script implements various performance optimizations for the Mietrecht Agent.
 */

// Import required modules
const fs = require('fs');
const path = require('path');

// Import database modules
const { initializeDatabase, closeDatabase } = require('../database/connection.js');
const { createIndex } = require('../database/init/initDb.js');

// Import data source modules
const { getCacheSize, clearCache } = require('../mietrecht_data_sources.js');

// Import DAO modules
const { getCourtDecisionsCount, getUnprocessedCourtDecisionsCount } = require('../database/dao/courtDecisionDao.js');
const { getLawyersCount } = require('../database/dao/lawyerDao.js');

/**
 * Optimize database performance
 */
async function optimizeDatabase() {
  console.log('Optimizing database performance...');
  
  try {
    await initializeDatabase();
    
    // Create indexes for frequently queried columns
    console.log('Creating database indexes...');
    await createIndex('idx_court_decisions_decision_id', 'court_decisions', 'decision_id');
    await createIndex('idx_court_decisions_decision_date', 'court_decisions', 'decision_date');
    await createIndex('idx_court_decisions_processed', 'court_decisions', 'processed');
    await createIndex('idx_lawyers_email', 'lawyers', 'email');
    
    // Get database statistics
    const decisionsCount = await getCourtDecisionsCount();
    const unprocessedCount = await getUnprocessedCourtDecisionsCount();
    const lawyersCount = await getLawyersCount();
    
    console.log(`Database statistics:`);
    console.log(`  - Total decisions: ${decisionsCount}`);
    console.log(`  - Unprocessed decisions: ${unprocessedCount}`);
    console.log(`  - Total lawyers: ${lawyersCount}`);
    
    await closeDatabase();
    console.log('Database optimization completed.');
  } catch (error) {
    console.error('Error optimizing database:', error);
  }
}

/**
 * Clear application cache
 */
function clearApplicationCache() {
  console.log('Clearing application cache...');
  
  try {
    const cacheSize = getCacheSize();
    console.log(`Current cache size: ${cacheSize} items`);
    
    clearCache();
    console.log('Cache cleared successfully.');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Optimize memory usage
 */
function optimizeMemoryUsage() {
  console.log('Optimizing memory usage...');
  
  try {
    // Force garbage collection if available
    if (global.gc) {
      console.log('Forcing garbage collection...');
      global.gc();
    }
    
    // Log memory usage
    const memoryUsage = process.memoryUsage();
    console.log('Memory usage:');
    console.log(`  - RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('Memory optimization completed.');
  } catch (error) {
    console.error('Error optimizing memory:', error);
  }
}

/**
 * Main function to run all optimizations
 */
async function runPerformanceOptimizations() {
  console.log('Running performance optimizations...');
  
  // Optimize database
  await optimizeDatabase();
  
  // Clear cache
  clearApplicationCache();
  
  // Optimize memory usage
  optimizeMemoryUsage();
  
  console.log('All performance optimizations completed.');
}

// Run optimizations if script is executed directly
if (require.main === module) {
  runPerformanceOptimizations()
    .then(() => {
      console.log('Performance optimization script finished.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error running performance optimization script:', error);
      process.exit(1);
    });
}

// Export functions for use in other modules
module.exports = {
  optimizeDatabase,
  clearApplicationCache,
  optimizeMemoryUsage,
  runPerformanceOptimizations
};