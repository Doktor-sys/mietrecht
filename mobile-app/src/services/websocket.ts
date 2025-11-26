// @ts-ignore
import { io, Socket } from 'socket.io-client';
// @ts-ignore
import { store } from '../store';
// @ts-ignore
import { addMessage, setTyping } from '../store/slices/chatSlice';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    // @ts-ignore
    const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

    this.socket = io(backendUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Chat events
    this.socket.on('message', (data: any) => {
      store.dispatch(addMessage({
        id: data.id,
        role: data.role,
        content: data.content,
        timestamp: new Date(data.timestamp),
        legalReferences: data.legalReferences,
      }));
    });

    this.socket.on('typing', (data: { isTyping: boolean }) => {
      store.dispatch(setTyping(data.isTyping));
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  }

  sendMessage(conversationId: string, content: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('sendMessage', {
      conversationId,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('joinConversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('leaveConversation', { conversationId });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new WebSocketService();
