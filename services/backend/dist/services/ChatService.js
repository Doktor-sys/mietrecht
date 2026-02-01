"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const logger_1 = require("../utils/logger");
const LegalCaseClassifier_1 = require("./LegalCaseClassifier");
const AIResponseGenerator_1 = require("./AIResponseGenerator");
class ChatService {
    constructor(prisma) {
        this.prisma = prisma;
        this.classifier = new LegalCaseClassifier_1.LegalCaseClassifier();
        this.responseGenerator = new AIResponseGenerator_1.AIResponseGenerator(prisma);
    }
    /**
     * Refine AI response based on user feedback
     */
    async refineResponse(originalResponse, feedback, userQuery) {
        return this.responseGenerator.refineResponse(originalResponse, feedback, userQuery);
    }
    /**
     * Start a new conversation
     */
    async startConversation(userId, initialQuery) {
        try {
            logger_1.logger.info('Starting new conversation', { userId, queryLength: initialQuery.length });
            // Get user profile
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { profile: true }
            });
            // Classify the case
            const classification = await this.classifier.classifyCase(initialQuery);
            // Create a new case
            const caseTitle = this.generateCaseTitle(classification);
            const newCase = await this.prisma.case.create({
                data: {
                    userId,
                    title: caseTitle,
                    description: initialQuery,
                    category: classification.classification.category.toUpperCase(),
                    priority: this.mapRiskToPriority(classification.classification.riskLevel),
                    status: classification.classification.escalationRecommended ? 'ESCALATED' : 'OPEN'
                }
            });
            // Save user message
            await this.prisma.message.create({
                data: {
                    caseId: newCase.id,
                    sender: 'USER',
                    content: initialQuery
                }
            });
            // Generate AI response with legal references
            const aiResponse = await this.responseGenerator.generateResponse(classification, initialQuery, undefined, // conversation context
            user // user profile
            );
            // Save AI message
            await this.prisma.message.create({
                data: {
                    caseId: newCase.id,
                    sender: 'AI',
                    content: aiResponse.message,
                    metadata: {
                        category: classification.classification.category,
                        confidence: aiResponse.confidence,
                        riskLevel: classification.classification.riskLevel,
                        escalationRecommended: aiResponse.escalationRecommended,
                        legalReferences: JSON.parse(JSON.stringify(aiResponse.legalReferences)),
                        actionRecommendations: JSON.parse(JSON.stringify(aiResponse.actionRecommendations)),
                        templateReferences: JSON.parse(JSON.stringify(aiResponse.templateReferences))
                    }
                }
            });
            logger_1.logger.info('Conversation started', { caseId: newCase.id, category: classification.classification.category });
            return {
                conversationId: newCase.id,
                message: aiResponse.message,
                classification,
                suggestions: classification.recommendations,
                escalationRecommended: aiResponse.escalationRecommended,
                legalReferences: aiResponse.legalReferences,
                actionRecommendations: aiResponse.actionRecommendations,
                templateReferences: aiResponse.templateReferences
            };
        }
        catch (error) {
            logger_1.logger.error('Error starting conversation', { error, userId });
            throw error;
        }
    }
    /**
     * Send a message in an existing conversation
     */
    async sendMessage(conversationId, userId, message) {
        try {
            logger_1.logger.info('Sending message', { conversationId, userId, messageLength: message.length });
            // Verify case belongs to user and get user profile
            const [existingCase, user] = await Promise.all([
                this.prisma.case.findFirst({
                    where: {
                        id: conversationId,
                        userId
                    },
                    include: {
                        messages: {
                            orderBy: { timestamp: 'desc' },
                            take: 10
                        }
                    }
                }),
                this.prisma.user.findUnique({
                    where: { id: userId },
                    include: { profile: true }
                })
            ]);
            if (!existingCase) {
                throw new Error('Conversation not found or access denied');
            }
            // Save user message
            await this.prisma.message.create({
                data: {
                    caseId: conversationId,
                    sender: 'USER',
                    content: message
                }
            });
            // Get conversation context
            const context = this.buildConversationContext(existingCase.messages);
            // Classify the new message
            const classification = await this.classifier.classifyCase(`${context}\n\nNeue Nachricht: ${message}`);
            // Generate AI response with legal references
            const aiResponse = await this.responseGenerator.generateResponse(classification, message, context, user);
            // Save AI message
            await this.prisma.message.create({
                data: {
                    caseId: conversationId,
                    sender: 'AI',
                    content: aiResponse.message,
                    metadata: {
                        category: classification.classification.category,
                        confidence: aiResponse.confidence,
                        riskLevel: classification.classification.riskLevel,
                        escalationRecommended: aiResponse.escalationRecommended,
                        legalReferences: JSON.parse(JSON.stringify(aiResponse.legalReferences)),
                        actionRecommendations: JSON.parse(JSON.stringify(aiResponse.actionRecommendations)),
                        templateReferences: JSON.parse(JSON.stringify(aiResponse.templateReferences))
                    }
                }
            });
            // Update case if escalation is recommended
            if (classification.classification.escalationRecommended && existingCase.status !== 'ESCALATED') {
                await this.prisma.case.update({
                    where: { id: conversationId },
                    data: { status: 'ESCALATED' }
                });
            }
            logger_1.logger.info('Message sent', { conversationId, escalationRecommended: classification.classification.escalationRecommended });
            return {
                conversationId,
                message: aiResponse.message,
                classification,
                suggestions: classification.recommendations,
                escalationRecommended: aiResponse.escalationRecommended,
                legalReferences: aiResponse.legalReferences,
                actionRecommendations: aiResponse.actionRecommendations,
                templateReferences: aiResponse.templateReferences
            };
        }
        catch (error) {
            logger_1.logger.error('Error sending message', { error, conversationId });
            throw error;
        }
    }
    /**
     * Get conversation history for a user
     */
    async getConversationHistory(userId) {
        try {
            logger_1.logger.info('Getting conversation history', { userId });
            const cases = await this.prisma.case.findMany({
                where: { userId },
                include: {
                    messages: {
                        orderBy: { timestamp: 'desc' },
                        take: 1
                    },
                    _count: {
                        select: { messages: true }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });
            return cases.map(c => ({
                id: c.id,
                title: c.title,
                category: c.category,
                status: c.status,
                createdAt: c.createdAt,
                messageCount: c._count.messages,
                lastMessage: c.messages[0]?.content
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting conversation history', { error, userId });
            throw error;
        }
    }
    /**
     * Get messages for a specific conversation
     */
    async getConversationMessages(conversationId, userId) {
        try {
            // Verify access
            const caseExists = await this.prisma.case.findFirst({
                where: {
                    id: conversationId,
                    userId
                }
            });
            if (!caseExists) {
                throw new Error('Conversation not found or access denied');
            }
            const messages = await this.prisma.message.findMany({
                where: { caseId: conversationId },
                orderBy: { timestamp: 'asc' }
            });
            return messages;
        }
        catch (error) {
            logger_1.logger.error('Error getting conversation messages', { error, conversationId });
            throw error;
        }
    }
    /**
     * Escalate conversation to a lawyer
     */
    async escalateToLawyer(conversationId, userId) {
        try {
            logger_1.logger.info('Escalating conversation to lawyer', { conversationId, userId });
            // Verify access
            const caseExists = await this.prisma.case.findFirst({
                where: {
                    id: conversationId,
                    userId
                }
            });
            if (!caseExists) {
                throw new Error('Conversation not found or access denied');
            }
            // Update case status
            await this.prisma.case.update({
                where: { id: conversationId },
                data: { status: 'ESCALATED' }
            });
            // Add system message
            await this.prisma.message.create({
                data: {
                    caseId: conversationId,
                    sender: 'AI',
                    content: 'Ihr Fall wurde an einen Fachanwalt weitergeleitet. Sie werden in Kürze kontaktiert.',
                    metadata: {
                        type: 'escalation_notice'
                    }
                }
            });
            logger_1.logger.info('Conversation escalated', { conversationId });
        }
        catch (error) {
            logger_1.logger.error('Error escalating conversation', { error, conversationId });
            throw error;
        }
    }
    /**
     * Generate case title from classification
     */
    generateCaseTitle(classification) {
        const categoryMap = {
            rent_reduction: 'Mietminderung',
            termination: 'Kündigung',
            utility_costs: 'Nebenkosten',
            rent_increase: 'Mieterhöhung',
            defects: 'Mängel',
            deposit: 'Kaution',
            modernization: 'Modernisierung',
            other: 'Allgemeine Anfrage'
        };
        const category = categoryMap[classification.classification.category] || 'Mietrechtsfall';
        const date = new Date().toLocaleDateString('de-DE');
        return `${category} - ${date}`;
    }
    /**
     * Map risk level to priority
     */
    mapRiskToPriority(riskLevel) {
        const map = {
            low: 'LOW',
            medium: 'MEDIUM',
            high: 'HIGH'
        };
        return map[riskLevel];
    }
    /**
     * Build conversation context from messages
     */
    buildConversationContext(messages) {
        return messages
            .slice(0, 5) // Last 5 messages
            .reverse()
            .map(m => `${m.sender}: ${m.content}`)
            .join('\n');
    }
    /**
     * Get category name in German
     */
    getCategoryName(category) {
        const map = {
            rent_reduction: 'Mietminderung',
            termination: 'Kündigung',
            utility_costs: 'Nebenkosten',
            rent_increase: 'Mieterhöhung',
            defects: 'Mängel',
            deposit: 'Kaution',
            modernization: 'Modernisierung',
            other: 'Allgemeine Anfrage'
        };
        return map[category] || category;
    }
}
exports.ChatService = ChatService;
