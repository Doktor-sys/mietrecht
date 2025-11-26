import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verify } from 'jsonwebtoken';
import { config } from '../config/config';
import { logger } from '../utils/logger';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket[]> = new Map();

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
    this.setupHeartbeat();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      logger.info('New WebSocket connection attempt');

      // Authentifizierung über Token in Query-Parameter
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        logger.warn('WebSocket connection rejected: No token provided');
        ws.close(1008, 'Authentication required');
        return;
      }

      try {
        const decoded = verify(token, config.jwt.secret) as { userId: string };
        ws.userId = decoded.userId;
        ws.isAlive = true;

        // Speichere Client-Verbindung
        if (!this.clients.has(ws.userId)) {
          this.clients.set(ws.userId, []);
        }
        this.clients.get(ws.userId)!.push(ws);

        logger.info('WebSocket authenticated', { userId: ws.userId });

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
        ws.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleClientMessage(ws, message);
          } catch (error) {
            logger.error('Error parsing WebSocket message', { error });
          }
        });

        // Verbindung geschlossen
        ws.on('close', () => {
          this.removeClient(ws);
          logger.info('WebSocket disconnected', { userId: ws.userId });
        });

        // Fehlerbehandlung
        ws.on('error', (error) => {
          logger.error('WebSocket error', { error, userId: ws.userId });
          this.removeClient(ws);
        });
      } catch (error) {
        logger.error('WebSocket authentication failed', { error });
        ws.close(1008, 'Invalid token');
      }
    });
  }

  private setupHeartbeat(): void {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const client = ws as AuthenticatedWebSocket;
        
        if (client.isAlive === false) {
          logger.info('Terminating inactive WebSocket', { userId: client.userId });
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

  private handleClientMessage(ws: AuthenticatedWebSocket, message: any): void {
    logger.debug('Received WebSocket message', { userId: ws.userId, type: message.type });

    // Hier können verschiedene Message-Typen behandelt werden
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong' });
        break;
      default:
        logger.warn('Unknown message type', { type: message.type });
    }
  }

  private removeClient(ws: AuthenticatedWebSocket): void {
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

  private sendToClient(ws: WebSocket, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Sende Typing-Indikator an User
   */
  public sendTypingIndicator(userId: string, isTyping: boolean): void {
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
  public sendMessageToUser(userId: string, message: any): void {
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
  public sendConversationId(userId: string, conversationId: string): void {
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
  public broadcast(data: any): void {
    this.wss.clients.forEach((client) => {
      this.sendToClient(client, data);
    });
  }

  /**
   * Schließe alle Verbindungen
   */
  public close(): void {
    this.wss.clients.forEach((client) => {
      client.close();
    });
    this.wss.close();
  }
}
