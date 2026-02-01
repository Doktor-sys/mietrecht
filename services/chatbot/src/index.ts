/**
 * Chatbot Service Main Entry Point
 * 
 * This service provides real-time chat functionality for the SmartLaw Mietrecht application.
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ChatbotService } from './services/ChatbotService';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CHATBOT_CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3006;

// Middleware
app.use(express.json());

// Initialize chatbot service
const chatbotService = new ChatbotService();

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Chatbot Service'
  });
});

/**
 * Process chat message
 */
app.post('/process-message', async (req: Request, res: Response) => {
  try {
    const { message, userId, context } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({ error: 'Missing required fields: message, userId' });
    }
    
    const response = await chatbotService.processMessage(message, userId, context);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error processing chat message:', error);
    return res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * Get conversation history
 */
app.get('/conversation-history/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const history = chatbotService.getConversationHistory(userId);
    return res.status(200).json(history);
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return res.status(500).json({ error: 'Failed to get conversation history' });
  }
});

/**
 * Clear conversation history
 */
app.post('/clear-history/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    chatbotService.clearConversationHistory(userId);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error clearing conversation history:', error);
    return res.status(500).json({ error: 'Failed to clear conversation history' });
  }
});

/**
 * Handle Socket.IO connections
 */
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Handle chat messages
  socket.on('chat-message', async (data) => {
    try {
      const { message, userId, context } = data;
      
      // Process message with chatbot
      const response = await chatbotService.processMessage(message, userId, context);
      
      // Send response back to client
      socket.emit('bot-response', {
        message: response.text,
        timestamp: new Date().toISOString(),
        userId: 'bot'
      });
    } catch (error) {
      console.error('Error processing chat message:', error);
      socket.emit('bot-error', {
        message: 'Sorry, I encountered an error processing your message.',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Chatbot Service listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Chatbot Service...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down Chatbot Service...');
  process.exit(0);
});

export default app;