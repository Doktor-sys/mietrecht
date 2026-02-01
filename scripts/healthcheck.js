/**
 * Health Check Script for Mietrecht Agent
 * This script checks if the application is running correctly.
 */

const http = require('http');

// Check if the web server is responding
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const request = http.request(options, (res) => {
  let data = '';
  
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const healthData = JSON.parse(data);
      
      if (res.statusCode === 200 && healthData.status === 'healthy') {
        console.log('Health check passed');
        console.log(`Service: ${healthData.service}`);
        console.log(`Timestamp: ${healthData.timestamp}`);
        process.exit(0);
      } else {
        console.log('Health check failed: Unexpected status code', res.statusCode);
        console.log('Response:', data);
        process.exit(1);
      }
    } catch (parseError) {
      console.log('Health check failed: Could not parse response');
      console.log('Response:', data);
      process.exit(1);
    }
  });
});

request.on('error', (err) => {
  console.log('Health check failed:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.log('Health check failed: Request timeout');
  process.exit(1);
});

request.end();