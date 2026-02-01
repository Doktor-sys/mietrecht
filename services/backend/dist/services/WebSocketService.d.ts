import { Server as HTTPServer } from 'http';
export declare class WebSocketService {
    private wss;
    private clients;
    constructor(server: HTTPServer);
    private setupWebSocketServer;
    private setupHeartbeat;
    private handleClientMessage;
    private removeClient;
    private sendToClient;
    /**
     * Sende Typing-Indikator an User
     */
    sendTypingIndicator(userId: string, isTyping: boolean): void;
    /**
     * Sende Nachricht an User
     */
    sendMessageToUser(userId: string, message: any): void;
    /**
     * Sende Konversations-ID an User
     */
    sendConversationId(userId: string, conversationId: string): void;
    /**
     * Broadcast an alle verbundenen Clients
     */
    broadcast(data: any): void;
    /**
     * Schließe alle Verbindungen
     */
    close(): void;
}
