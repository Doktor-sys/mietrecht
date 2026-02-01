/**
 * Rate Limiting Security Tests
 * These tests verify the rate limiting configuration in the Mietrecht Agent.
 */

const request = require('supertest');
const { applyRateLimiting } = require('../../middleware/securityMiddleware.js');
const express = require('express');

// Test suite for rate limiting
describe('Rate Limiting Security Tests', () => {
  let app;
  
  // Set up a test app with rate limiting
  beforeEach(() => {
    app = express();
    applyRateLimiting(app);
    
    // Add a simple route for testing
    app.get('/test', (req, res) => {
      res.status(200).json({ message: 'Success' });
    });
  });
  
  // Test for general rate limiting
  test('should apply general rate limiting', async () => {
    // Make multiple requests to trigger rate limiting
    const requests = [];
    for (let i = 0; i < 105; i++) {
      requests.push(request(app).get('/test'));
    }
    
    // Wait for all requests to complete
    const responses = await Promise.all(requests.map(req => req.catch(err => err)));
    
    // Check that at least one request was rate limited (429 status)
    const rateLimitedResponses = responses.filter(res => 
      res.status === 429 || (res.response && res.response.status === 429)
    );
    
    // We should have some rate limited responses
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  }, 10000); // Increase timeout for this test
  
  // Test for API rate limiting
  test('should apply stricter rate limiting to API endpoints', async () => {
    // Make multiple requests to API endpoints
    const requests = [];
    for (let i = 0; i < 55; i++) {
      requests.push(request(app).get('/api/test'));
    }
    
    // Wait for all requests to complete
    const responses = await Promise.all(requests.map(req => req.catch(err => err)));
    
    // Check that at least one request was rate limited (429 status)
    const rateLimitedResponses = responses.filter(res => 
      res.status === 429 || (res.response && res.response.status === 429)
    );
    
    // We should have some rate limited responses
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  }, 10000); // Increase timeout for this test
  
  // Test for authentication rate limiting
  test('should apply strictest rate limiting to auth endpoints', async () => {
    // Make multiple requests to auth endpoints
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(request(app).get('/api/auth/test'));
    }
    
    // Wait for all requests to complete
    const responses = await Promise.all(requests.map(req => req.catch(err => err)));
    
    // Check that at least one request was rate limited (429 status)
    const rateLimitedResponses = responses.filter(res => 
      res.status === 429 || (res.response && res.response.status === 429)
    );
    
    // We should have some rate limited responses
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  }, 10000); // Increase timeout for this test
});