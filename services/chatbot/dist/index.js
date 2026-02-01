"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const ChatbotService_1 = require("./services/ChatbotService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CHATBOT_CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3006;
app.use(express_1.default.json());
const chatbotService = new ChatbotService_1.ChatbotService();
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Chatbot Service'
    });
});
app.post('/process-message', async (req, res) => {
    try {
        const { message, userId, context } = req.body;
        if (!message || !userId) {
            return res.status(400).json({ error: 'Missing required fields: message, userId' });
        }
        const response = await chatbotService.processMessage(message, userId, context);
        return res.status(200).json(response);
    }
    catch (error) {
        console.error('Error processing chat message:', error);
        return res.status(500).json({ error: 'Failed to process message' });
    }
});
app.get('/conversation-history/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const history = chatbotService.getConversationHistory(userId);
        return res.status(200).json(history);
    }
    catch (error) {
        console.error('Error getting conversation history:', error);
        return res.status(500).json({ error: 'Failed to get conversation history' });
    }
});
app.post('/clear-history/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        chatbotService.clearConversationHistory(userId);
        return res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Error clearing conversation history:', error);
        return res.status(500).json({ error: 'Failed to clear conversation history' });
    }
});
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on('chat-message', async (data) => {
        try {
            const { message, userId, context } = data;
            const response = await chatbotService.processMessage(message, userId, context);
            socket.emit('bot-response', {
                message: response.text,
                timestamp: new Date().toISOString(),
                userId: 'bot'
            });
        }
        catch (error) {
            console.error('Error processing chat message:', error);
            socket.emit('bot-error', {
                message: 'Sorry, I encountered an error processing your message.',
                timestamp: new Date().toISOString()
            });
        }
    });
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});
httpServer.listen(PORT, () => {
    console.log(`Chatbot Service listening on port ${PORT}`);
});
process.on('SIGINT', async () => {
    console.log('Shutting down Chatbot Service...');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Shutting down Chatbot Service...');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map