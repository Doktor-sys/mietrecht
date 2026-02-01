/**
 * Simple logging test
 */

const { createLogEntry, getLogEntries, getLogStatistics } = require('./database/dao/systemLogDao.js');
const { initializeDatabase, closeDatabase } = require('./database/connection.js');

async function testLogging() {
  console.log("Testing logging functionality...");
  
  try {
    // Initialize database
    await initializeDatabase();
    console.log("✅ Database initialized");
    
    // Create some test log entries
    await createLogEntry('info', 'Test info message');
    await createLogEntry('warning', 'Test warning message');
    await createLogEntry('error', 'Test error message');
    console.log("✅ Log entries created");
    
    // Retrieve log entries
    const logs = await getLogEntries({ limit: 5 });
    console.log(`✅ Retrieved ${logs.length} log entries:`);
    logs.forEach(log => {
      console.log(`  [${new Date(log.timestamp).toLocaleTimeString()}] ${log.level}: ${log.message}`);
    });
    
    // Get statistics
    const stats = await getLogStatistics();
    console.log("✅ Log statistics:");
    Object.keys(stats).forEach(level => {
      console.log(`  ${level}: ${stats[level]}`);
    });
    
    // Close database
    await closeDatabase();
    console.log("✅ Database closed");
    
    console.log("\n🎉 Logging test completed successfully!");
  } catch (error) {
    console.error("❌ Error during logging test:", error.message);
    
    // Try to close database if it's open
    try {
      await closeDatabase();
    } catch (closeError) {
      console.error("❌ Error closing database:", closeError.message);
    }
  }
}

testLogging();