/**
 * Authentication Test
 * This script tests the authentication functionality.
 */

const { registerUser, loginUser, createDefaultAdminUser } = require('../services/authService.js');

async function testAuth() {
  try {
    console.log('Testing authentication...');
    
    // Test creating default admin user
    console.log('Creating default admin user...');
    const adminResult = await createDefaultAdminUser();
    console.log('Admin creation result:', adminResult);
    
    // Test user registration
    console.log('Registering test user...');
    const registerResult = await registerUser({
      username: 'testuser',
      password: 'testpassword',
      role: 'user'
    });
    console.log('Registration result:', registerResult);
    
    // Test user login
    console.log('Logging in test user...');
    const loginResult = await loginUser({
      username: 'testuser',
      password: 'testpassword'
    });
    console.log('Login result:', loginResult);
    
    // Test invalid login
    console.log('Testing invalid login...');
    const invalidLoginResult = await loginUser({
      username: 'testuser',
      password: 'wrongpassword'
    });
    console.log('Invalid login result:', invalidLoginResult);
  } catch (error) {
    console.error('Error in authentication test:', error);
  }
}

// Run the test
testAuth();