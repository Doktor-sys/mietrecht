/**
 * CORS Security Tests
 * These tests verify the CORS configuration in the Mietrecht Agent.
 */

const request = require('supertest');
const { app } = require('../../web_config_server.js');

// Test suite for CORS configuration
describe('CORS Security Tests', () => {
  // Test for CORS headers
  test('should set CORS headers', async () => {
    const response = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:3000');
    
    // Check for CORS headers
    expect(response.headers['access-control-allow-origin']).toBeDefined();
    expect(response.headers['access-control-allow-methods']).toBeDefined();
    expect(response.headers['access-control-allow-headers']).toBeDefined();
  });
  
  // Test for allowed methods
  test('should allow specified HTTP methods', async () => {
    const response = await request(app)
      .options('/')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');
    
    // Check that the requested method is allowed
    expect(response.status).toBe(204); // No content for OPTIONS request
  });
  
  // Test for allowed headers
  test('should allow specified headers', async () => {
    const response = await request(app)
      .options('/')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization');
    
    // Check that the requested headers are allowed
    expect(response.status).toBe(204); // No content for OPTIONS request
  });
});