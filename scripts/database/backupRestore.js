/**
 * Database Backup and Restore Script
 * This script provides functionality to backup and restore the database.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { initializeDatabase, closeDatabase, db } = require('./connection.js');

const execAsync = promisify(exec);

/**
 * Backup the database to a file
 * @param {string} backupPath - Path to the backup file
 */
async function backupDatabase(backupPath) {
  try {
    // Ensure the backup directory exists
    const backupDir = path.dirname(backupPath);
    await fs.mkdir(backupDir, { recursive: true });
    
    // Create backup using SQLite backup command
    const dbPath = path.join(__dirname, 'data', 'mietrecht_agent.db');
    
    // Copy the database file
    await fs.copyFile(dbPath, backupPath);
    
    console.log(`Database backed up successfully to ${backupPath}`);
  } catch (error) {
    console.error('Error backing up database:', error.message);
    throw error;
  }
}

/**
 * Restore the database from a backup file
 * @param {string} backupPath - Path to the backup file
 */
async function restoreDatabase(backupPath) {
  try {
    // Check if backup file exists
    try {
      await fs.access(backupPath);
    } catch (error) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    // Close current database connection
    await closeDatabase();
    
    // Restore database by copying backup file
    const dbPath = path.join(__dirname, 'data', 'mietrecht_agent.db');
    await fs.copyFile(backupPath, dbPath);
    
    // Reopen database connection
    // Note: In a real implementation, you would need to reinitialize the database connection
    
    console.log(`Database restored successfully from ${backupPath}`);
  } catch (error) {
    console.error('Error restoring database:', error.message);
    throw error;
  }
}

/**
 * Schedule automatic backups
 * @param {string} backupDir - Directory to store backups
 * @param {number} intervalHours - Interval between backups in hours
 */
function scheduleBackups(backupDir, intervalHours = 24) {
  // Create backup directory if it doesn't exist
  fs.mkdir(backupDir, { recursive: true }).catch(err => {
    console.error('Error creating backup directory:', err.message);
  });
  
  // Schedule backups
  setInterval(async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `mietrecht_agent_backup_${timestamp}.db`);
      await backupDatabase(backupPath);
    } catch (error) {
      console.error('Error during scheduled backup:', error.message);
    }
  }, intervalHours * 60 * 60 * 1000);
  
  console.log(`Automatic backups scheduled every ${intervalHours} hours`);
}

/**
 * List available backups
 * @param {string} backupDir - Directory containing backups
 * @returns {Promise<Array>} Array of backup file information
 */
async function listBackups(backupDir) {
  try {
    const files = await fs.readdir(backupDir);
    const backups = [];
    
    for (const file of files) {
      if (file.startsWith('mietrecht_agent_backup_') && file.endsWith('.db')) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        backups.push({
          name: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime
        });
      }
    }
    
    // Sort by modification time (newest first)
    backups.sort((a, b) => b.modified - a.modified);
    
    return backups;
  } catch (error) {
    console.error('Error listing backups:', error.message);
    return [];
  }
}

// Export functions
module.exports = {
  backupDatabase,
  restoreDatabase,
  scheduleBackups,
  listBackups
};