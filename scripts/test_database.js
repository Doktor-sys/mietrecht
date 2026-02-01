/**
 * Simple database test script
 */

const { initializeDatabase, closeDatabase } = require('./database/connection.js');

async function testDatabase() {
  console.log("Testing database initialization...");
  
  try {
    await initializeDatabase();
    console.log("✅ Database initialized successfully");
    
    await closeDatabase();
    console.log("✅ Database closed successfully");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testDatabase();