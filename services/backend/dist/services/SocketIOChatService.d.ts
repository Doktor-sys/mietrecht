import { Server as HTTPServer } from 'http';
export declare class SocketIOChatService {
    private io;
    private chatbotServiceUrl;
    constructor(server: HTTPServer);
    private setupSocketIO;
    /**
     * Broadcast a message to all connected clients
     */
    broadcast(event: string, data: any): void;
    /**
     * Send a message to a specific user
     */
    sendMessageToUser(userId: string, event: string, data: any): void;
    /**
     * Close the Socket.IO server
     */
    close(): void;
}
