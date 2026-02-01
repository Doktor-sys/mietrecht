/**
 * AI Service Main Entry Point
 * 
 * This is the main entry point for the AI Service in the SmartLaw Mietrecht application.
 * It initializes the service and starts the HTTP server.
 */

import express from 'express';
import path from 'path';

// Simple logger implementation
const logger = {
  info: (message: string) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
  },
  error: (message: string) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
  },
  warn: (message: string) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
  }
};

// Simple config implementation
const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost'
};

const app = express();

// Middleware
app.use(express.json());

// Serve static files from the dashboard
app.use(express.static(path.join(__dirname)));

// Serve the dashboard HTML file
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'ai-service'
  });
});

// Simple analysis endpoint
app.post('/api/analyze', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({
      error: 'Text is required for analysis'
    });
  }
  
  // Simulate AI analysis
  const analysisResult = {
    sentiment: 'neutral',
    keywords: text.split(' ').slice(0, 5),
    confidence: 0.85,
    recommendations: ['Consider reviewing the contract terms', 'Check for compliance issues']
  };
  
  res.json(analysisResult);
});

// Start server
app.listen(config.port, config.host, () => {
  logger.info(`AI Service listening on ${config.host}:${config.port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down AI Service...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down AI Service...');
  process.exit(0);
});

export default app;