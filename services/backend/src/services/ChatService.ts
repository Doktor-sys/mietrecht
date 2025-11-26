import { PrismaClient, Priority, Message } from '@prisma/client';
import { logger } from '../utils/logger';
import { LegalCaseClassifier, ClassificationResult } from './LegalCaseClassifier';
import { NLPService } from './NLPService';
import { AIResponseGenerator, AIResponse } from './AIResponseGenerator';

export interface ConversationResponse {
  conversationId: string;
  message: string;
  classification?: ClassificationResult;
  suggestions?: string[];
  escalationRecommended: boolean;
  legalReferences?: any[];
  actionRecommendations?: any[];
  templateReferences?: any[];
}

export interface ConversationHistory {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: Date;
  messageCount: number;
  lastMessage?: string;
}

export class ChatService {
  private prisma: PrismaClient;
  private classifier: LegalCaseClassifier;
  private responseGenerator: AIResponseGenerator;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.classifier = new LegalCaseClassifier();
    this.responseGenerator = new AIResponseGenerator(prisma);
  }

  /**
   * Start a new conversation
   */
  async startConversation(userId: string, initialQuery: string): Promise<ConversationResponse> {
    try {
      logger.info('Starting new conversation', { userId, queryLength: initialQuery.length });

      // Classify the case
      const classification = await this.classifier.classifyCase(initialQuery);

      // Create a new case
      const caseTitle = this.generateCaseTitle(classification);
      const newCase = await this.prisma.case.create({
        data: {
          userId,
          title: caseTitle,
          description: initialQuery,
          category: classification.classification.category.toUpperCase() as any,
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
      const aiResponse = await this.responseGenerator.generateResponse(
        classification,
        initialQuery
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
          } as any
        }
      });

      logger.info('Conversation started', { caseId: newCase.id, category: classification.classification.category });

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
    } catch (error) {
      logger.error('Error starting conversation', { error, userId });
      throw error;
    }
  }

  /**
   * Send a message in an existing conversation
   */
  async sendMessage(conversationId: string, userId: string, message: string): Promise<ConversationResponse> {
    try {
      logger.info('Sending message', { conversationId, userId, messageLength: message.length });

      // Verify case belongs to user
      const existingCase = await this.prisma.case.findFirst({
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
      });

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
      const aiResponse = await this.responseGenerator.generateResponse(
        classification,
        message,
        context
      );

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
          } as any
        }
      });

      // Update case if escalation is recommended
      if (classification.classification.escalationRecommended && existingCase.status !== 'ESCALATED') {
        await this.prisma.case.update({
          where: { id: conversationId },
          data: { status: 'ESCALATED' }
        });
      }

      logger.info('Message sent', { conversationId, escalationRecommended: classification.classification.escalationRecommended });

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
    } catch (error) {
      logger.error('Error sending message', { error, conversationId });
      throw error;
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(userId: string): Promise<ConversationHistory[]> {
    try {
      logger.info('Getting conversation history', { userId });

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
    } catch (error) {
      logger.error('Error getting conversation history', { error, userId });
      throw error;
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(conversationId: string, userId: string): Promise<Message[]> {
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
    } catch (error) {
      logger.error('Error getting conversation messages', { error, conversationId });
      throw error;
    }
  }

  /**
   * Escalate conversation to a lawyer
   */
  async escalateToLawyer(conversationId: string, userId: string): Promise<void> {
    try {
      logger.info('Escalating conversation to lawyer', { conversationId, userId });

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

      logger.info('Conversation escalated', { conversationId });
    } catch (error) {
      logger.error('Error escalating conversation', { error, conversationId });
      throw error;
    }
  }

  /**
   * Generate case title from classification
   */
  private generateCaseTitle(classification: ClassificationResult): string {
    const categoryMap: Record<string, string> = {
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
  private mapRiskToPriority(riskLevel: 'low' | 'medium' | 'high'): Priority {
    const map: Record<string, Priority> = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH'
    };
    return map[riskLevel];
  }

  /**
   * Build conversation context from messages
   */
  private buildConversationContext(messages: Message[]): string {
    return messages
      .slice(0, 5) // Last 5 messages
      .reverse()
      .map(m => `${m.sender}: ${m.content}`)
      .join('\n');
  }



  /**
   * Get category name in German
   */
  private getCategoryName(category: string): string {
    const map: Record<string, string> = {
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
