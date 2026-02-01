/**
 * Authentication Verification Script
 * This script verifies the authentication implementation in the Mietrecht Agent.
 */

// Import required modules
const { registerUser, loginUser, createDefaultAdminUser } = require('../services/authService.js');

/**
 * Verify authentication implementation
 */
async function verifyAuthentication() {
  console.log('=== Mietrecht Agent Authentication Verification ===\n');
  
  try {
    // Test 1: Check if authentication modules are available
    console.log('1. Checking authentication modules...');
    if (typeof registerUser === 'function' && typeof loginUser === 'function') {
      console.log('✓ Authentication service functions are available');
    } else {
      console.log('✗ Authentication service functions are missing');
      return;
    }
    
    // Test 2: Create default admin user
    console.log('\n2. Creating default admin user...');
    const adminResult = await createDefaultAdminUser();
    if (adminResult.success) {
      console.log('✓ Default admin user created successfully');
      // For existing users, we don't get the username/password back
      if (adminResult.username) {
        console.log(`  Username: ${adminResult.username}`);
        console.log(`  Password: ${adminResult.password}`);
      } else {
        console.log('  Username: admin');
        console.log('  Password: admin123');
        console.log('  (Default credentials for development)');
      }
    } else {
      console.log('✗ Failed to create default admin user');
      console.log(`  Error: ${adminResult.error}`);
      return;
    }
    
    // Test 3: Test user login
    console.log('\n3. Testing user login...');
    const loginResult = await loginUser({
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResult.success) {
      console.log('✓ User login successful');
      console.log(`  Token: ${loginResult.token.substring(0, 20)}...`);
      console.log(`  User ID: ${loginResult.user.id}`);
      console.log(`  Username: ${loginResult.user.username}`);
      console.log(`  Role: ${loginResult.user.role}`);
    } else {
      console.log('✗ User login failed');
      console.log(`  Error: ${loginResult.error}`);
      return;
    }
    
    // Test 4: Test invalid login
    console.log('\n4. Testing invalid login...');
    const invalidLoginResult = await loginUser({
      username: 'admin',
      password: 'wrongpassword'
    });
    
    if (!invalidLoginResult.success) {
      console.log('✓ Invalid login correctly rejected');
      console.log(`  Error: ${invalidLoginResult.error}`);
    } else {
      console.log('✗ Invalid login was accepted (security issue!)');
      return;
    }
    
    // Test 5: Test duplicate user creation
    console.log('\n5. Testing duplicate user creation...');
    const duplicateResult = await createDefaultAdminUser();
    if (duplicateResult.success && duplicateResult.message.includes('already exists')) {
      console.log('✓ Duplicate user creation correctly prevented');
    } else {
      console.log('✗ Duplicate user creation not handled correctly');
      return;
    }
    
    console.log('\n=== Authentication Verification Complete ===');
    console.log('✓ All authentication tests passed');
    console.log('\nNext steps:');
    console.log('1. Start the web server: npm run dev');
    console.log('2. Visit http://localhost:3000/login');
    console.log('3. Log in with username "admin" and password "admin123"');
    
  } catch (error) {
    console.error('Error during authentication verification:', error);
  }
}

// Run the verification
verifyAuthentication();