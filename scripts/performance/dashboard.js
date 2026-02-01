/**
 * Performance Dashboard Module
 * This module provides a web-based dashboard for monitoring the performance of the Mietrecht Agent.
 */

// Import required modules
const express = require('express');
const path = require('path');
const { PerformanceMonitor } = require('./advancedMonitor.js');

// Create Express app
const app = express();
const performanceMonitor = new PerformanceMonitor();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve static files for the dashboard
app.use('/dashboard', express.static(path.join(__dirname, '..', 'public', 'dashboard')));

/**
 * Get current performance metrics
 */
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = await performanceMonitor.getMetricsCollector().collectAllMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get performance alerts
 */
app.get('/api/alerts', (req, res) => {
  try {
    const alerts = performanceMonitor.getAlerts();
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Clear performance alerts
 */
app.post('/api/alerts/clear', (req, res) => {
  try {
    performanceMonitor.clearAlerts();
    res.json({
      success: true,
      message: 'Alerts cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Start performance monitoring
 */
app.post('/api/monitoring/start', (req, res) => {
  try {
    const { interval } = req.body;
    performanceMonitor.startMonitoring(interval);
    res.json({
      success: true,
      message: 'Monitoring started successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Stop performance monitoring
 */
app.post('/api/monitoring/stop', (req, res) => {
  try {
    performanceMonitor.stopMonitoring();
    res.json({
      success: true,
      message: 'Monitoring stopped successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get system information
 */
app.get('/api/system', (req, res) => {
  try {
    const metrics = performanceMonitor.getMetricsCollector().getMetrics();
    res.json({
      success: true,
      data: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        uptime: process.uptime(),
        memory: metrics.system.memory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Main dashboard route
 */
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard', 'index.html'));
});

/**
 * Start the dashboard server
 * @param {number} port - Port to listen on (default: 3001)
 */
function startDashboard(port = 3001) {
  const server = app.listen(port, () => {
    console.log(`Performance Dashboard server running on http://localhost:${port}`);
    console.log(`Dashboard available at http://localhost:${port}/dashboard`);
  });
  
  // Handle server errors
  server.on('error', (error) => {
    console.error('Dashboard server error:', error);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down Performance Dashboard server...');
    server.close(() => {
      console.log('Performance Dashboard server closed.');
      process.exit(0);
    });
  });
  
  return server;
}

// Export functions
module.exports = {
  app,
  startDashboard
};