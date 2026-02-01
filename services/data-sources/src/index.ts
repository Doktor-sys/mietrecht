/**
 * Data Sources Service Main Entry Point
 * 
 * This is the main entry point for the Data Sources Service in the SmartLaw Mietrecht application.
 * It initializes the service and starts the HTTP server.
 */

import express from 'express';
import dotenv from 'dotenv';
import { BGHApiClient } from './clients/bghApiClient';
import { LandgerichteApiClient } from './clients/landgerichteApiClient';
import { BeckOnlineApiClient } from './clients/beckOnlineApiClient';
import { JurisApiClient } from './clients/jurisApiClient';
import { BVerfGApiClient } from './clients/bverfgApiClient';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());

// Initialize API clients
const bghClient = new BGHApiClient();
const landgerichteClient = new LandgerichteApiClient();
const beckOnlineClient = new BeckOnlineApiClient();
const jurisClient = new JurisApiClient();
const bverfgClient = new BVerfGApiClient();

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Data Sources Service'
  });
});

/**
 * Fetch BGH decisions
 */
app.get('/api/bgh/decisions', async (req, res) => {
  try {
    const decisions = await bghClient.getDecisions();
    res.status(200).json(decisions);
  } catch (error) {
    console.error('Error fetching BGH decisions:', error);
    res.status(500).json({ error: 'Failed to fetch BGH decisions' });
  }
});

/**
 * Fetch Landgerichte decisions
 */
app.get('/api/landgerichte/decisions', async (req, res) => {
  try {
    const decisions = await landgerichteClient.getDecisions();
    res.status(200).json(decisions);
  } catch (error) {
    console.error('Error fetching Landgerichte decisions:', error);
    res.status(500).json({ error: 'Failed to fetch Landgerichte decisions' });
  }
});

/**
 * Fetch Beck Online articles
 */
app.get('/api/beck-online/articles', async (req, res) => {
  try {
    const articles = await beckOnlineClient.getArticles();
    res.status(200).json(articles);
  } catch (error) {
    console.error('Error fetching Beck Online articles:', error);
    res.status(500).json({ error: 'Failed to fetch Beck Online articles' });
  }
});

/**
 * Fetch juris documents
 */
app.get('/api/juris/documents', async (req, res) => {
  try {
    const documents = await jurisClient.getDocuments();
    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching juris documents:', error);
    res.status(500).json({ error: 'Failed to fetch juris documents' });
  }
});

/**
 * Fetch BVerfG decisions
 */
app.get('/api/bverfg/decisions', async (req, res) => {
  try {
    const decisions = await bverfgClient.getDecisions();
    res.status(200).json(decisions);
  } catch (error) {
    console.error('Error fetching BVerfG decisions:', error);
    res.status(500).json({ error: 'Failed to fetch BVerfG decisions' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Data Sources Service listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Data Sources Service...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down Data Sources Service...');
  process.exit(0);
});

export default app;