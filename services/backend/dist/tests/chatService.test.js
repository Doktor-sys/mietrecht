"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ChatService_1 = require("../services/ChatService");
const database_1 = require("../config/database");
const WebSocketService_1 = require("../services/WebSocketService");
const AIResponseGenerator_1 = require("../services/AIResponseGenerator");
const LegalCaseClassifier_1 = require("../services/LegalCaseClassifier");
jest.mock('../config/database');
jest.mock('../services/WebSocketService');
jest.mock('../services/AIResponseGenerator');
jest.mock('../services/LegalCaseClassifier');
describe('ChatService', () => {
    let chatService;
    let mockWebSocketService;
    let mockAIResponseGenerator;
    let mockClassifier;
    beforeEach(() => {
        mockWebSocketService = new WebSocketService_1.WebSocketService();
        mockAIResponseGenerator = new AIResponseGenerator_1.AIResponseGenerator();
        mockClassifier = new LegalCaseClassifier_1.LegalCaseClassifier();
        chatService = new ChatService_1.ChatService(mockWebSocketService, mockAIResponseGenerator, mockClassifier);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('startConversation', () => {
        it('sollte eine neue Konversation erstellen', async () => {
            const userId = 'user-123';
            const initialQuery = 'Meine Heizung ist kaputt';
            const mockConversation = {
                id: 'conv-123',
                userId,
                title: 'Heizungsausfall',
                category: 'rent_reduction',
                status: 'open',
                priority: 'high',
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            database_1.prisma.conversation.create.mockResolvedValue(mockConversation);
            mockClassifier.classifyCase.mockResolvedValue({
                category: 'rent_reduction',
                confidence: 0.9,
                legalReferences: ['§ 536 BGB'],
            });
            const result = await chatService.startConversation(userId, initialQuery);
            expect(result).toEqual(mockConversation);
            expect(database_1.prisma.conversation.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId,
                    category: 'rent_reduction',
                }),
            });
        });
        it('sollte Fehler bei ungültigem userId werfen', async () => {
            await expect(chatService.startConversation('', 'Test query')).rejects.toThrow('User ID ist erforderlich');
        });
    });
    describe('sendMessage', () => {
        it('sollte eine Nachricht senden und KI-Antwort generieren', async () => {
            const conversationId = 'conv-123';
            const message = 'Wie lange kann ich die Miete mindern?';
            const mockAIResponse = {
                message: 'Sie können die Miete mindern, solange der Mangel besteht.',
                confidence: 0.85,
                legalReferences: [
                    {
                        type: 'law',
                        reference: '§ 536 BGB',
                        title: 'Mietminderung bei Sachmängeln',
                    },
                ],
                suggestedActions: [
                    {
                        type: 'document',
                        description: 'Mängelanzeige erstellen',
                    },
                ],
                escalationRecommended: false,
            };
            mockAIResponseGenerator.generateResponse.mockResolvedValue(mockAIResponse);
            database_1.prisma.message.create.mockResolvedValue({
                id: 'msg-123',
                conversationId,
                content: message,
                role: 'user',
                createdAt: new Date(),
            });
            const result = await chatService.sendMessage(conversationId, message);
            expect(result).toEqual(mockAIResponse);
            expect(mockAIResponseGenerator.generateResponse).toHaveBeenCalledWith(message, expect.any(Object));
            expect(mockWebSocketService.sendToUser).toHaveBeenCalled();
        });
        it('sollte Eskalation empfehlen bei niedriger Konfidenz', async () => {
            const conversationId = 'conv-123';
            const message = 'Komplexe rechtliche Frage';
            const mockAIResponse = {
                message: 'Für diese komplexe Situation empfehle ich eine Anwaltsberatung.',
                confidence: 0.3,
                legalReferences: [],
                suggestedActions: [],
                escalationRecommended: true,
            };
            mockAIResponseGenerator.generateResponse.mockResolvedValue(mockAIResponse);
            const result = await chatService.sendMessage(conversationId, message);
            expect(result.escalationRecommended).toBe(true);
            expect(result.confidence).toBeLessThan(0.5);
        });
    });
    describe('getConversationHistory', () => {
        it('sollte alle Konversationen eines Nutzers abrufen', async () => {
            const userId = 'user-123';
            const mockConversations = [
                {
                    id: 'conv-1',
                    userId,
                    title: 'Heizungsausfall',
                    status: 'open',
                    createdAt: new Date(),
                },
                {
                    id: 'conv-2',
                    userId,
                    title: 'Mieterhöhung',
                    status: 'resolved',
                    createdAt: new Date(),
                },
            ];
            database_1.prisma.conversation.findMany.mockResolvedValue(mockConversations);
            const result = await chatService.getConversationHistory(userId);
            expect(result).toEqual(mockConversations);
            expect(database_1.prisma.conversation.findMany).toHaveBeenCalledWith({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
        });
    });
    describe('escalateToLawyer', () => {
        it('sollte Konversation zu Anwalt eskalieren', async () => {
            const conversationId = 'conv-123';
            database_1.prisma.conversation.update.mockResolvedValue({
                id: conversationId,
                status: 'escalated',
                updatedAt: new Date(),
            });
            const result = await chatService.escalateToLawyer(conversationId);
            expect(result.success).toBe(true);
            expect(database_1.prisma.conversation.update).toHaveBeenCalledWith({
                where: { id: conversationId },
                data: { status: 'escalated' },
            });
        });
    });
});
