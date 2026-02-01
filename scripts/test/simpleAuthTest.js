/**
 * Simple Auth Test
 * This script tests the authentication service functions directly.
 */

const { createDefaultAdminUser } = require('../services/authService.js');

async function testAuth() {
  try {
    console.log('Testing createDefaultAdminUser...');
    const result = await createDefaultAdminUser();
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth();