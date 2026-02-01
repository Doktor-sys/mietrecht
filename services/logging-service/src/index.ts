import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { connectToMessageQueue } from './utils/messageQueue';
import { initializeElasticsearch } from './utils/elasticsearch';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'logging-service', 
    timestamp: new Date().toISOString() 
  });
});

// Initialize services
async function initializeServices() {
  try {
    // Connect to message queue
    await connectToMessageQueue();
    
    // Initialize Elasticsearch
    await initializeElasticsearch();
    
    logger.info('Logging service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize logging service', { error });
    process.exit(1);
  }
}

// Start server
app.listen(PORT, async () => {
  await initializeServices();
  logger.info(`Logging service running on port ${PORT}`);
});

export default app;