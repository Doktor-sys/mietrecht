"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIOChatService = void 0;
const socket_io_1 = require("socket.io");
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class SocketIOChatService {
    constructor(server) {
        this.io = new socket_io_1.Server(server, {
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
    setupSocketIO() {
        this.io.on('connection', (socket) => {
            logger_1.logger.info('New Socket.IO connection', { socketId: socket.id });
            // Handle user joining chat
            socket.on('join', (data) => {
                const { userId } = data;
                socket.join(`user_${userId}`);
                logger_1.logger.info('User joined chat', { userId, socketId: socket.id });
            });
            // Handle chat messages
            socket.on('message', async (data) => {
                const { userId, message, context } = data;
                try {
                    // Send typing indicator
                    socket.emit('typing', { isTyping: true });
                    // Forward message to chatbot service
                    const response = await axios_1.default.post(`${this.chatbotServiceUrl}/process-message`, {
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
                    logger_1.logger.info('Chat message processed', { userId, message });
                }
                catch (error) {
                    logger_1.logger.error('Error processing chat message', { error, userId, message });
                    socket.emit('typing', { isTyping: false });
                    socket.emit('error', { message: 'Error processing your message' });
                }
            });
            // Handle conversation history request
            socket.on('getHistory', async (data) => {
                const { userId } = data;
                try {
                    const response = await axios_1.default.get(`${this.chatbotServiceUrl}/conversation-history/${userId}`);
                    socket.emit('history', response.data);
                }
                catch (error) {
                    logger_1.logger.error('Error fetching conversation history', { error, userId });
                    socket.emit('error', { message: 'Error fetching conversation history' });
                }
            });
            // Handle clear history request
            socket.on('clearHistory', async (data) => {
                const { userId } = data;
                try {
                    await axios_1.default.post(`${this.chatbotServiceUrl}/clear-history/${userId}`);
                    socket.emit('historyCleared', { success: true });
                }
                catch (error) {
                    logger_1.logger.error('Error clearing conversation history', { error, userId });
                    socket.emit('error', { message: 'Error clearing conversation history' });
                }
            });
            // Handle disconnection
            socket.on('disconnect', () => {
                logger_1.logger.info('Socket.IO client disconnected', { socketId: socket.id });
            });
        });
    }
    /**
     * Broadcast a message to all connected clients
     */
    broadcast(event, data) {
        this.io.emit(event, data);
    }
    /**
     * Send a message to a specific user
     */
    sendMessageToUser(userId, event, data) {
        this.io.to(`user_${userId}`).emit(event, data);
    }
    /**
     * Close the Socket.IO server
     */
    close() {
        this.io.close();
    }
}
exports.SocketIOChatService = SocketIOChatService;
