interface Message {
    id: string;
    threadId: string;
    senderId: string;
    recipientIds: string[];
    subject: string;
    content: string;
    sentAt: Date;
    readAt?: Date;
    attachments?: Attachment[];
    priority: 'low' | 'normal' | 'high';
    status: 'sent' | 'delivered' | 'read';
}
interface Attachment {
    id: string;
    name: string;
    size: number;
    url: string;
    type: string;
}
interface Thread {
    id: string;
    subject: string;
    participants: Participant[];
    lastMessageAt: Date;
    unreadCount: number;
}
interface Participant {
    id: string;
    name: string;
    email: string;
}
interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    createdAt: Date;
    readAt?: Date;
    actionUrl?: string;
}
export declare class MessagingIntegration {
    private apiClient;
    private baseUrl;
    private accessToken;
    constructor(baseUrl: string, accessToken: string);
    /**
     * Sendet eine neue Nachricht
     */
    sendMessage(messageData: Omit<Message, 'id' | 'sentAt' | 'status'>): Promise<Message>;
    /**
     * Holt alle Nachrichtenthreads für einen Benutzer
     */
    getMessageThreads(userId: string): Promise<Thread[]>;
    /**
     * Holt alle Nachrichten in einem Thread
     */
    getMessagesInThread(threadId: string): Promise<Message[]>;
    /**
     * Markiert eine Nachricht als gelesen
     */
    markMessageAsRead(messageId: string): Promise<Message>;
    /**
     * Löscht eine Nachricht
     */
    deleteMessage(messageId: string): Promise<void>;
    /**
     * Erstellt eine Benachrichtigung
     */
    createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
    /**
     * Holt alle Benachrichtigungen für einen Benutzer
     */
    getUserNotifications(userId: string): Promise<Notification[]>;
    /**
     * Markiert eine Benachrichtigung als gelesen
     */
    markNotificationAsRead(notificationId: string): Promise<Notification>;
    /**
     * Löscht eine Benachrichtigung
     */
    deleteNotification(notificationId: string): Promise<void>;
    /**
     * Sendet eine E-Mail über das Nachrichtensystem
     */
    sendEmail(emailData: {
        to: string | string[];
        subject: string;
        body: string;
        attachments?: Attachment[];
    }): Promise<any>;
    /**
     * Sendet eine SMS über das Nachrichtensystem
     */
    sendSMS(smsData: {
        to: string;
        message: string;
    }): Promise<any>;
}
export {};
