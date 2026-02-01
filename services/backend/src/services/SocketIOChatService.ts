import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import axios from 'axios';
import { logger } from '../utils/logger';

export class SocketIOChatService {
  private io: SocketIOServer;
  private chatbotServiceUrl: string;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://localhost:3000']
          : ['http://localhost:3000', 'http://localhost:19006'],
        credentials: true
      }
    });
    
    this.chatbotServiceUrl = process.env.CHATBOT_SERVICE_URL || 'http://localhost:3006';
    this.setupSocketIO();
  }

  private setupSocketIO(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info('New Socket.IO connection', { socketId: socket.id });
      
      // Handle user joining chat
      socket.on('join', (data) => {
        const { userId } = data;
        socket.join(`user_${userId}`);
        logger.info('User joined chat', { userId, socketId: socket.id });
      });

      // Handle chat messages
      socket.on('message', async (data) => {
        const { userId, message, context } = data;
        
        try {
          // Send typing indicator
          socket.emit('typing', { isTyping: true });
          
          // Forward message to chatbot service
          const response = await axios.post(`${this.chatbotServiceUrl}/process-message`, {
            message,
            userId,
            context
          });
          
          // Send typing indicator off
          socket.emit('typing', { isTyping: false });
          
          // Send response back to client
          socket.emit('message', {
            id: Date.now().toString(),
            content: response.data.text,
            confidence: response.data.confidence,
            timestamp: new Date().toISOString()
          });
          
          logger.info('Chat message processed', { userId, message });
        } catch (error) {
          logger.error('Error processing chat message', { error, userId, message });
          socket.emit('typing', { isTyping: false });
          socket.emit('error', { message: 'Error processing your message' });
        }
      });

      // Handle conversation history request
      socket.on('getHistory', async (data) => {
        const { userId } = data;
        
        try {
          const response = await axios.get(`${this.chatbotServiceUrl}/conversation-history/${userId}`);
          socket.emit('history', response.data);
        } catch (error) {
          logger.error('Error fetching conversation history', { error, userId });
          socket.emit('error', { message: 'Error fetching conversation history' });
        }
      });

      // Handle clear history request
      socket.on('clearHistory', async (data) => {
        const { userId } = data;
        
        try {
          await axios.post(`${this.chatbotServiceUrl}/clear-history/${userId}`);
          socket.emit('historyCleared', { success: true });
        } catch (error) {
          logger.error('Error clearing conversation history', { error, userId });
          socket.emit('error', { message: 'Error clearing conversation history' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('Socket.IO client disconnected', { socketId: socket.id });
      });
    });
  }

  /**
   * Broadcast a message to all connected clients
   */
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  /**
   * Send a message to a specific user
   */
  public sendMessageToUser(userId: string, event: string, data: any): void {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  /**
   * Close the Socket.IO server
   */
  public close(): void {
    this.io.close();
  }
}