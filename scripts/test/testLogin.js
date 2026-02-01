/**
 * Test Login Script
 * This script tests user login with existing users.
 */

const { loginUser } = require('../services/authService.js');

async function testLogin() {
  try {
    console.log('Testing login with admin user...');
    const adminLogin = await loginUser({
      username: 'admin',
      password: 'admin123'
    });
    console.log('Admin login result:', adminLogin);
    
    console.log('\nTesting login with test user...');
    const userLogin = await loginUser({
      username: 'testuser',
      password: 'testpassword'
    });
    console.log('User login result:', userLogin);
    
    console.log('\nTesting invalid login...');
    const invalidLogin = await loginUser({
      username: 'admin',
      password: 'wrongpassword'
    });
    console.log('Invalid login result:', invalidLogin);
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();