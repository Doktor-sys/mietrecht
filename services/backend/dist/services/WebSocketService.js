"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const ws_1 = require("ws");
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class WebSocketService {
    constructor(server) {
        this.clients = new Map();
        this.wss = new ws_1.WebSocketServer({ server });
        this.setupWebSocketServer();
        this.setupHeartbeat();
    }
    setupWebSocketServer() {
        this.wss.on('connection', (ws, req) => {
            logger_1.logger.info('New WebSocket connection attempt');
            // Authentifizierung über Token in Query-Parameter
            const url = new URL(req.url || '', `http://${req.headers.host}`);
            const token = url.searchParams.get('token');
            if (!token) {
                logger_1.logger.warn('WebSocket connection rejected: No token provided');
                ws.close(1008, 'Authentication required');
                return;
            }
            try {
                const decoded = (0, jsonwebtoken_1.verify)(token, config_1.config.jwt.secret);
                ws.userId = decoded.userId;
                ws.isAlive = true;
                // Speichere Client-Verbindung
                if (!this.clients.has(ws.userId)) {
                    this.clients.set(ws.userId, []);
                }
                this.clients.get(ws.userId).push(ws);
                logger_1.logger.info('WebSocket authenticated', { userId: ws.userId });
                // Sende Bestätigung
                this.sendToClient(ws, {
                    type: 'connected',
                    message: 'WebSocket verbunden',
                });
                // Heartbeat
                ws.on('pong', () => {
                    ws.isAlive = true;
                });
                // Nachrichtenhandler
                ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        this.handleClientMessage(ws, message);
                    }
                    catch (error) {
                        logger_1.logger.error('Error parsing WebSocket message', { error });
                    }
                });
                // Verbindung geschlossen
                ws.on('close', () => {
                    this.removeClient(ws);
                    logger_1.logger.info('WebSocket disconnected', { userId: ws.userId });
                });
                // Fehlerbehandlung
                ws.on('error', (error) => {
                    logger_1.logger.error('WebSocket error', { error, userId: ws.userId });
                    this.removeClient(ws);
                });
            }
            catch (error) {
                logger_1.logger.error('WebSocket authentication failed', { error });
                ws.close(1008, 'Invalid token');
            }
        });
    }
    setupHeartbeat() {
        const interval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                const client = ws;
                if (client.isAlive === false) {
                    logger_1.logger.info('Terminating inactive WebSocket', { userId: client.userId });
                    this.removeClient(client);
                    return client.terminate();
                }
                client.isAlive = false;
                client.ping();
            });
        }, 30000); // Alle 30 Sekunden
        this.wss.on('close', () => {
            clearInterval(interval);
        });
    }
    handleClientMessage(ws, message) {
        logger_1.logger.debug('Received WebSocket message', { userId: ws.userId, type: message.type });
        // Hier können verschiedene Message-Typen behandelt werden
        switch (message.type) {
            case 'ping':
                this.sendToClient(ws, { type: 'pong' });
                break;
            default:
                logger_1.logger.warn('Unknown message type', { type: message.type });
        }
    }
    removeClient(ws) {
        if (ws.userId) {
            const userClients = this.clients.get(ws.userId);
            if (userClients) {
                const index = userClients.indexOf(ws);
                if (index > -1) {
                    userClients.splice(index, 1);
                }
                if (userClients.length === 0) {
                    this.clients.delete(ws.userId);
                }
            }
        }
    }
    sendToClient(ws, data) {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }
    /**
     * Sende Typing-Indikator an User
     */
    sendTypingIndicator(userId, isTyping) {
        const userClients = this.clients.get(userId);
        if (userClients) {
            userClients.forEach((client) => {
                this.sendToClient(client, {
                    type: 'typing',
                    isTyping,
                });
            });
        }
    }
    /**
     * Sende Nachricht an User
     */
    sendMessageToUser(userId, message) {
        const userClients = this.clients.get(userId);
        if (userClients) {
            userClients.forEach((client) => {
                this.sendToClient(client, {
                    type: 'message',
                    ...message,
                });
            });
        }
    }
    /**
     * Sende Konversations-ID an User
     */
    sendConversationId(userId, conversationId) {
        const userClients = this.clients.get(userId);
        if (userClients) {
            userClients.forEach((client) => {
                this.sendToClient(client, {
                    type: 'conversationId',
                    conversationId,
                });
            });
        }
    }
    /**
     * Broadcast an alle verbundenen Clients
     */
    broadcast(data) {
        this.wss.clients.forEach((client) => {
            this.sendToClient(client, data);
        });
    }
    /**
     * Schließe alle Verbindungen
     */
    close() {
        this.wss.clients.forEach((client) => {
            client.close();
        });
        this.wss.close();
    }
}
exports.WebSocketService = WebSocketService;
