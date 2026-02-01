/**
 * List Users Script
 * This script lists all users in the database.
 */

const { getAllUsers } = require('../database/dao/userDao.js');
const { initializeDatabase, closeDatabase } = require('../database/connection.js');

async function listUsers() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    console.log('Getting all users...');
    const users = await getAllUsers();
    
    console.log('Users in database:');
    if (users.length === 0) {
      console.log('No users found');
    } else {
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Created: ${user.created_at}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await closeDatabase();
  }
}

listUsers();