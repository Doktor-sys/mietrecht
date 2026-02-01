/**
 * Web Server for Mietrecht Agent Configuration Interface
 * This module provides a web-based interface for configuring the Mietrecht Agent.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : false,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Import security middleware
const { applySecurityHeaders, applyRateLimiting } = require('./middleware/securityMiddleware.js');
const { body, validationResult } = require('express-validator');

// Apply security middleware
applySecurityHeaders(app);
applyRateLimiting(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for dashboard data
let dashboardData = {
  agentStatus: 'stopped',
  lastRun: null,
  nextRun: null,
  totalDecisionsProcessed: 0,
  successfulRuns: 0,
  failedRuns: 0,
  dataSources: {
    bgh: { status: 'unknown', lastCheck: null },
    landgerichte: { status: 'unknown', lastCheck: null },
    bverfg: { status: 'unknown', lastCheck: null },
    beckOnline: { status: 'unknown', lastCheck: null }
  },
  performance: {
    avgResponseTime: 0,
    cacheHitRate: 0,
    activeRequests: 0
  }
};

// Import database modules
const { initializeDatabase, closeDatabase } = require('./database/connection.js');
const { getConfigValue, setConfigValue, getAllConfig } = require('./database/dao/configDao.js');
const { getAllLawyers, getLawyerById, createLawyer, updateLawyer, deleteLawyer } = require('./database/dao/lawyerDao.js');
const { getAllCourtDecisions, getCourtDecisionsCount, getUnprocessedCourtDecisionsCount } = require('./database/dao/courtDecisionDao.js');
const { getMetrics, getLatestMetricValue } = require('./database/dao/dashboardMetricsDao.js');
const { getLogEntries, getLogEntriesCount } = require('./database/dao/systemLogDao.js');
const { getAllDataSourceStatuses } = require('./database/dao/dataSourceStatusDao.js');

// Import analytics modules
const { performComprehensiveAnalysis } = require('./analytics/decisionAnalyzer.js');
const { performPerformanceAnalysis } = require('./analytics/performanceAnalyzer.js');
const { generateAllReports } = require('./analytics/reportGenerator.js');
const { 
  generateTrendChart, 
  generateTopicDistribution, 
  generatePerformanceMetrics,
  generateBottleneckAlerts
} = require('./analytics/dashboardVisuals.js');

// Import notification modules
const { NotificationManager } = require('./notifications/notificationManager.js');

// Import authentication modules
const { authenticate, authorizeAdmin } = require('./middleware/authMiddleware.js');
const { registerUser, loginUser, createDefaultAdminUser } = require('./services/authService.js');

// Initialize database when server starts
initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err.message);
});

// Initialize notification manager
const notificationManager = new NotificationManager({
  email: {
    enabled: true,
    service: 'gmail',
    user: 'test@example.com',
    pass: 'test-password'
  },
  sms: { enabled: false },
  push: { enabled: false },
  adminRecipients: ['admin@example.com']
});

// Import the enhanced monitor
const { EnhancedMonitor } = require('./monitoring/enhancedMonitor.js');

// Import comprehensive health check module
const { performComprehensiveHealthCheck } = require('./health/comprehensiveHealthCheck.js');

// Import predictive model module
const { generatePredictiveAnalysis, getTopicTrendPredictions } = require('./analytics/legalPrecedentPredictor.js');

// Create a global monitor instance for dashboard access
const globalMonitor = new EnhancedMonitor();

// Serve the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve the main configuration page (protected)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the dashboard page (protected)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API endpoint for user registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const result = await registerUser({ username, password, role });
    
    if (result.success) {
      res.status(201).json({
        message: 'User registered successfully',
        token: result.token,
        user: result.user
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// API endpoint for user login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const result = await loginUser({ username, password });
    
    if (result.success) {
      res.json({
        message: 'Login successful',
        token: result.token,
        user: result.user
      });
    } else {
      res.status(401).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// API endpoint to create default admin user (for development only)
app.post('/api/auth/create-admin', async (req, res) => {
  try {
    const result = await createDefaultAdminUser();
    
    if (result.success) {
      res.json({
        message: result.message,
        username: result.username,
        password: result.password
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Apply authentication middleware to all routes except login and auth routes
app.use((req, res, next) => {
  // Skip authentication for login page and auth routes
  if (req.path === '/login' || req.path.startsWith('/api/auth/')) {
    return next();
  }
  // Apply authentication middleware
  authenticate(req, res, next);
});

// Apply admin authorization middleware to admin routes
app.use('/api/admin/', authorizeAdmin);

// API endpoint to get all configuration
app.get('/api/config', async (req, res) => {
  try {
    const config = await getAllConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// Import security functions
const { validateLawyerData, validateConfigData } = require('./middleware/securityMiddleware.js');

// API endpoint to update configuration
app.post('/api/config', async (req, res) => {
  try {
    const { key, value } = req.body;
    
    // Validate and sanitize input
    const validatedData = validateConfigData(key, value);
    
    await setConfigValue(validatedData.key, validatedData.value);
    res.json({ message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(400).json({ error: error.message || 'Failed to update configuration' });
  }
});

// API endpoint to get all lawyers
app.get('/api/lawyers', async (req, res) => {
  try {
    const lawyers = await getAllLawyers();
    res.json(lawyers);
  } catch (error) {
    console.error('Error getting lawyers:', error);
    res.status(500).json({ error: 'Failed to get lawyers' });
  }
});

// API endpoint to create a new lawyer
app.post('/api/lawyers', async (req, res) => {
  try {
    // Validate and sanitize lawyer data
    const lawyerData = validateLawyerData(req.body);
    
    const lawyerId = await createLawyer(lawyerData);
    res.json({ id: lawyerId, message: 'Lawyer created successfully' });
  } catch (error) {
    console.error('Error creating lawyer:', error);
    res.status(400).json({ error: error.message || 'Failed to create lawyer' });
  }
});

// API endpoint to update a lawyer
app.put('/api/lawyers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate and sanitize lawyer data
    const lawyerData = validateLawyerData(req.body);
    
    await updateLawyer(parseInt(id), lawyerData);
    res.json({ message: 'Lawyer updated successfully' });
  } catch (error) {
    console.error('Error updating lawyer:', error);
    res.status(400).json({ error: error.message || 'Failed to update lawyer' });
  }
});

// API endpoint to delete a lawyer
app.delete('/api/lawyers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteLawyer(parseInt(id));
    res.json({ message: 'Lawyer deleted successfully' });
  } catch (error) {
    console.error('Error deleting lawyer:', error);
    res.status(500).json({ error: 'Failed to delete lawyer' });
  }
});

// API endpoint to trigger comprehensive analysis
app.post('/api/analyze', async (req, res) => {
  try {
    console.log('Triggering comprehensive analysis...');
    const analysisResult = await performComprehensiveAnalysis();
    res.json({ message: 'Analysis completed successfully', result: analysisResult });
  } catch (error) {
    console.error('Error performing analysis:', error);
    res.status(500).json({ error: 'Failed to perform analysis' });
  }
});

// API endpoint to trigger performance analysis
app.post('/api/analyze/performance', async (req, res) => {
  try {
    console.log('Triggering performance analysis...');
    const performanceResult = await performPerformanceAnalysis();
    res.json({ message: 'Performance analysis completed successfully', result: performanceResult });
  } catch (error) {
    console.error('Error performing performance analysis:', error);
    res.status(500).json({ error: 'Failed to perform performance analysis' });
  }
});

// API endpoint to generate reports
app.post('/api/reports/generate', async (req, res) => {
  try {
    console.log('Generating reports...');
    const reportPaths = await generateAllReports();
    res.json({ message: 'Reports generated successfully', reports: reportPaths });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

// Enhanced API endpoint to get dashboard data with analytics
app.get('/api/dashboard', async (req, res) => {
  try {
    // Get data from database
    const totalDecisions = await getCourtDecisionsCount();
    const unprocessedDecisions = await getUnprocessedCourtDecisionsCount();
    const logEntriesCount = await getLogEntriesCount();
    
    // Get latest metrics
    const avgResponseTime = await getLatestMetricValue('avg_response_time') || 0;
    const cacheHitRate = await getLatestMetricValue('cache_hit_rate') || 0;
    const activeRequests = await getLatestMetricValue('active_requests') || 0;
    
    // Get data source statuses
    const dataSources = await getAllDataSourceStatuses();
    
    // Convert data sources to the expected format
    const dataSourceStatus = {};
    dataSources.forEach(source => {
      dataSourceStatus[source.source_name] = {
        status: source.status,
        lastCheck: source.last_check
      };
    });
    
    // Get recent logs
    const recentLogs = await getLogEntries({ limit: 10 });
    
    // Perform comprehensive analysis for dashboard
    const analysisResult = await performComprehensiveAnalysis();
    
    // Perform performance analysis for dashboard
    const performanceResult = await performPerformanceAnalysis();
    
    // Generate visualization components
    const trendChartHtml = generateTrendChart(analysisResult.trends);
    const topicDistributionHtml = generateTopicDistribution(analysisResult.trends.topTopics);
    const performanceMetricsHtml = generatePerformanceMetrics({
      avgResponseTime,
      avgCacheHitRate: cacheHitRate,
      activeRequests
    });
    const bottleneckAlertsHtml = generateBottleneckAlerts(performanceResult.bottlenecks);
    
    // Get enhanced monitoring data if available
    let enhancedMonitoringData = null;
    try {
      // This would be populated by the actual monitor during agent execution
      // For now, we'll provide a structure that can be updated
      enhancedMonitoringData = {
        apiCalls: globalMonitor.metrics.apiCalls,
        emailSends: globalMonitor.metrics.emailSends,
        executionTimes: globalMonitor.metrics.executionTimes.slice(-10), // Last 10 executions
        memoryUsage: globalMonitor.metrics.memoryUsage.slice(-10), // Last 10 memory readings
        errors: globalMonitor.metrics.errors.length,
        warnings: globalMonitor.metrics.warnings.length
      };
    } catch (monitorError) {
      console.warn('Enhanced monitoring data not available:', monitorError.message);
    }
    
    res.json({
      agentStatus: dashboardData.agentStatus,
      lastRun: dashboardData.lastRun,
      nextRun: dashboardData.nextRun,
      totalDecisionsProcessed: totalDecisions,
      successfulRuns: dashboardData.successfulRuns,
      failedRuns: dashboardData.failedRuns,
      dataSources: dataSourceStatus,
      performance: {
        avgResponseTime,
        cacheHitRate,
        activeRequests
      },
      recentLogs,
      analytics: {
        trends: analysisResult.trends,
        specializations: analysisResult.specializations,
        impact: analysisResult.impact
      },
      performanceAnalysis: {
        performance: performanceResult.performance,
        logs: performanceResult.logs,
        bottlenecks: performanceResult.bottlenecks
      },
      visualizations: {
        trendChart: trendChartHtml,
        topicDistribution: topicDistributionHtml,
        performanceMetrics: performanceMetricsHtml,
        bottleneckAlerts: bottleneckAlertsHtml
      },
      enhancedMonitoring: enhancedMonitoringData
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// API endpoint to update dashboard data (for simulation)
app.post('/api/dashboard/update', (req, res) => {
  const updates = req.body;
  dashboardData = { ...dashboardData, ...updates };
  res.json({ message: "Dashboard data updated successfully" });
});

// API endpoint to get recent decisions
app.get('/api/recent-decisions', (req, res) => {
  // In a real implementation, this would fetch recent decisions from a database
  // For now, we'll return mock data
  const recentDecisions = [
    {
      id: '1',
      court: 'Bundesgerichtshof',
      caseNumber: 'VIII ZR 121/24',
      decisionDate: '2025-11-15',
      topics: ['Mietminderung', 'Schimmelbefall'],
      importance: 'high',
      status: 'processed'
    },
    {
      id: '2',
      court: 'Landgericht Berlin',
      caseNumber: '34 M 12/25',
      decisionDate: '2025-11-10',
      topics: ['Kündigung', 'Modernisierung'],
      importance: 'medium',
      status: 'processed'
    },
    {
      id: '3',
      court: 'Bundesverfassungsgericht',
      caseNumber: '1 BvR 1234/23',
      decisionDate: '2025-10-28',
      topics: ['Verfassungsrecht', 'Mietvertragsrecht'],
      importance: 'high',
      status: 'processed'
    }
  ];
  
  res.json(recentDecisions);
});

// API endpoint to get system logs
app.get('/api/logs', (req, res) => {
  // In a real implementation, this would fetch logs from a file or database
  // For now, we'll return mock data
  const logs = [
    { timestamp: '2025-11-29T10:30:00Z', level: 'info', message: 'Agent started successfully' },
    { timestamp: '2025-11-29T10:31:15Z', level: 'info', message: 'Fetching BGH decisions' },
    { timestamp: '2025-11-29T10:32:30Z', level: 'info', message: 'Processing 5 new decisions' },
    { timestamp: '2025-11-29T10:33:45Z', level: 'warning', message: 'Rate limit approaching for Landgerichte API' },
    { timestamp: '2025-11-29T10:35:00Z', level: 'info', message: 'Successfully created 2 Asana tasks' }
  ];
  
  res.json(logs);
});

// API endpoint to send test notification
app.post('/api/notifications/test', async (req, res) => {
  try {
    const { channel, recipient, subject, message } = req.body;
    
    if (!channel || !recipient || !subject || !message) {
      return res.status(400).json({ 
        error: 'Missing required parameters: channel, recipient, subject, message' 
      });
    }
    
    // Use our validation function to sanitize inputs
    const validatedChannel = validateConfigData('channel', channel).value;
    const validatedRecipient = validateConfigData('recipient', recipient).value;
    const validatedSubject = validateConfigData('subject', subject).value;
    const validatedMessage = validateConfigData('message', message).value;
    
    const results = await notificationManager.sendNotification(
      [validatedChannel],
      validatedRecipient,
      validatedSubject,
      `<p>${validatedMessage}</p>`
    );
    
    res.json({ 
      message: 'Test notification sent', 
      results 
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// API endpoint to check for alerts
app.post('/api/notifications/check-alerts', async (req, res) => {
  try {
    console.log('Checking for system alerts...');
    const alertResults = await notificationManager.checkForAlerts();
    
    res.json({ 
      message: 'Alert check completed', 
      alerts: alertResults 
    });
  } catch (error) {
    console.error('Error checking for alerts:', error);
    res.status(500).json({ error: 'Failed to check for alerts' });
  }
});

// API endpoint to get notification configuration
app.get('/api/notifications/config', (req, res) => {
  try {
    // In a real implementation, this would retrieve the actual configuration
    const config = {
      email: {
        enabled: true,
        service: 'gmail'
      },
      sms: {
        enabled: false
      },
      push: {
        enabled: false
      },
      adminRecipients: ['admin@example.com']
    };
    
    res.json(config);
  } catch (error) {
    console.error('Error getting notification config:', error);
    res.status(500).json({ error: 'Failed to get notification configuration' });
  }
});

// API endpoint to get enhanced monitoring data
app.get('/api/monitoring', async (req, res) => {
  try {
    // Get enhanced monitoring data
    const monitoringData = {
      apiCalls: globalMonitor.metrics.apiCalls,
      emailSends: globalMonitor.metrics.emailSends,
      executionTimes: globalMonitor.metrics.executionTimes.slice(-20), // Last 20 executions
      memoryUsage: globalMonitor.metrics.memoryUsage.slice(-20), // Last 20 memory readings
      errors: globalMonitor.metrics.errors,
      warnings: globalMonitor.metrics.warnings,
      isMonitoring: globalMonitor.isMonitoring
    };
    
    res.json(monitoringData);
  } catch (error) {
    console.error('Error getting monitoring data:', error);
    res.status(500).json({ error: 'Failed to get monitoring data' });
  }
});

// API endpoint to start monitoring
app.post('/api/monitoring/start', async (req, res) => {
  try {
    if (!globalMonitor.isMonitoring) {
      globalMonitor.start();
      res.json({ message: 'Monitoring started successfully' });
    } else {
      res.json({ message: 'Monitoring is already running' });
    }
  } catch (error) {
    console.error('Error starting monitoring:', error);
    res.status(500).json({ error: 'Failed to start monitoring' });
  }
});

// API endpoint to stop monitoring
app.post('/api/monitoring/stop', async (req, res) => {
  try {
    if (globalMonitor.isMonitoring) {
      globalMonitor.stop();
      res.json({ message: 'Monitoring stopped successfully' });
    } else {
      res.json({ message: 'Monitoring is not running' });
    }
  } catch (error) {
    console.error('Error stopping monitoring:', error);
    res.status(500).json({ error: 'Failed to stop monitoring' });
  }
});

// Basic health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Simple health check - just see if the server is responding
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'mietrecht-agent-web-server'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Comprehensive health check endpoint
app.get('/health/comprehensive', async (req, res) => {
  try {
    const healthReport = await performComprehensiveHealthCheck();
    
    // Set appropriate HTTP status based on overall health
    const httpStatus = healthReport.status === 'healthy' ? 200 : 
                      healthReport.status === 'warning' ? 200 : 500;
    
    res.status(httpStatus).json(healthReport);
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API endpoint for predictive analysis of a specific decision
app.post('/api/predict/decision', async (req, res) => {
  try {
    const { decisionId } = req.body;
    
    if (!decisionId) {
      return res.status(400).json({ error: 'decisionId is required' });
    }
    
    // Get the decision from database
    const { getCourtDecisionById } = require('./database/dao/courtDecisionDao.js');
    const decision = await getCourtDecisionById(decisionId);
    
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    
    // Generate predictive analysis
    const analysis = await generatePredictiveAnalysis(decision);
    
    res.json({
      message: 'Predictive analysis completed successfully',
      analysis
    });
  } catch (error) {
    console.error('Error performing predictive analysis:', error);
    res.status(500).json({ error: 'Failed to perform predictive analysis' });
  }
});

// API endpoint for topic trend predictions
app.get('/api/predict/trends', async (req, res) => {
  try {
    const trends = await getTopicTrendPredictions();
    
    res.json({
      message: 'Topic trend predictions retrieved successfully',
      trends
    });
  } catch (error) {
    console.error('Error getting topic trend predictions:', error);
    res.status(500).json({ error: 'Failed to get topic trend predictions' });
  }
});

// Basic configuration validation
function isValidConfig(config) {
  // Check required top-level properties
  const requiredProperties = ['dataSources', 'nlp', 'integrations', 'notifications', 'performance'];
  for (const prop of requiredProperties) {
    if (!config.hasOwnProperty(prop)) {
      return false;
    }
  }
  
  // Check data sources structure
  if (typeof config.dataSources !== 'object') return false;
  
  // Check NLP settings structure
  if (typeof config.nlp !== 'object') return false;
  
  // Check integrations structure
  if (typeof config.integrations !== 'object') return false;
  
  // Check notifications structure
  if (typeof config.notifications !== 'object') return false;
  
  // Check performance settings structure
  if (typeof config.performance !== 'object') return false;
  
  return true;
}

// Start server
app.listen(PORT, () => {
  console.log(`Mietrecht Agent Configuration Server running on http://localhost:${PORT}`);
});

// Export app and dashboard data for testing
module.exports = { app, dashboardData, globalMonitor };
