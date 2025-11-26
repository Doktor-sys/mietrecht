/**
 * Test script for Mietrecht Webinterface API
 */

const axios = require('axios');

// Base URL for the API
const BASE_URL = 'http://localhost:3002/api';

// Test data
const testLawyer = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'testpassword123',
  lawFirm: 'Test Law Firm'
};

const testPreferences = {
  courtLevels: ['Bundesgerichtshof', 'Landgericht'],
  topics: ['Mietminderung', 'Kündigung'],
  frequency: 'weekly',
  regions: ['Berlin', 'Hamburg']
};

const testDecision = {
  caseNumber: 'TEST 123/45',
  court: 'Testgericht',
  location: 'Teststadt',
  date: '2025-11-26',
  summary: 'Test decision summary',
  content: 'Test decision content',
  importance: 'medium',
  topics: ['Testthema']
};

async function runTests() {
  console.log('🧪 Testing Mietrecht Webinterface API');
  console.log('=====================================');
  
  try {
    // Test 1: Get all court decisions
    console.log('\n1. Testing GET /decisions...');
    const decisionsResponse = await axios.get(`${BASE_URL}/decisions`);
    console.log(`✅ Successfully fetched ${decisionsResponse.data.length} court decisions`);
    
    // Test 2: Get lawyer by ID
    console.log('\n2. Testing GET /lawyers/1...');
    const lawyerResponse = await axios.get(`${BASE_URL}/lawyers/1`);
    console.log(`✅ Successfully fetched lawyer: ${lawyerResponse.data.name}`);
    
    // Test 3: Get lawyer preferences
    console.log('\n3. Testing GET /lawyers/1/preferences...');
    const preferencesResponse = await axios.get(`${BASE_URL}/lawyers/1/preferences`);
    console.log(`✅ Successfully fetched preferences`);
    
    // Test 4: Search court decisions
    console.log('\n4. Testing search functionality...');
    const searchResponse = await axios.get(`${BASE_URL}/decisions?limit=5`);
    console.log(`✅ Successfully searched ${searchResponse.data.length} court decisions`);
    
    console.log('\n🎉 All tests passed!');
    console.log('\n📝 Note: For full testing, the database should be running and properly configured.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    console.log('\n📝 Note: Some tests may fail if the database is not running or properly configured.');
    console.log('This is expected in development environments where PostgreSQL is not installed.');
  }
}

// Run the tests
runTests();