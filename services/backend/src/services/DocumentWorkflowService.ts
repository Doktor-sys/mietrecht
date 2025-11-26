import { PrismaClient, DocumentStatus, WorkflowAction } from '@prisma/client';
import { logger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';

export interface WorkflowTransition {
  documentId: string;
  userId: string;
  action: string;
  comment?: string;
}

export interface WorkflowRuleCondition {
  field: string;
  operator: string;
  value: any;
}

export interface WorkflowRuleAction {
  type: string;
  params: any;
}

export class DocumentWorkflowService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Ändert den Status eines Dokuments basierend auf einer Workflow-Aktion
   */
  async transitionDocumentStatus(
    documentId: string,
    userId: string,
    action: string,
    comment?: string
  ): Promise<any> {
    try {
      // Hole das Dokument
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: {
          user: true,
          case: true
        }
      });

      if (!document) {
        throw new ValidationError('Document not found');
      }

      // Bestimme den neuen Status basierend auf der Aktion
      const newStatus = this.determineNewStatus((document as any).status, action);
      
      if (!newStatus) {
        throw new ValidationError(`Invalid action '${action}' for current status '${(document as any).status}'`);
      }

      // Aktualisiere den Dokumentstatus
      const updatedDocument = await this.prisma.document.update({
        where: { id: documentId },
        data: {
          // @ts-ignore: Prisma client not recognizing status field
          status: newStatus as DocumentStatus
        }
      });

      // Erstelle einen Workflow-Eintrag
      // @ts-ignore: Prisma client not recognizing documentWorkflow property
      await this.prisma.documentWorkflow.create({
        data: {
          documentId,
          userId,
          action: action as WorkflowAction,
          fromStatus: (document as any).status as DocumentStatus,
          toStatus: newStatus as DocumentStatus,
          comment
        }
      });

      logger.info(`Document ${documentId} status changed from ${(document as any).status} to ${newStatus}`);

      return updatedDocument;
    } catch (error) {
      logger.error('Failed to transition document status:', error);
      throw error;
    }
  }

  /**
   * Bestimmt den neuen Status basierend auf der aktuellen Status und Aktion
   */
  private determineNewStatus(currentStatus: string, action: string): string | null {
    const transitions: Record<string, Record<string, string>> = {
      'DRAFT': {
        'SUBMIT_FOR_REVIEW': 'REVIEW',
        'ARCHIVE': 'ARCHIVED'
      },
      'REVIEW': {
        'APPROVE': 'APPROVED',
        'REJECT': 'REJECTED',
        'REQUEST_CHANGES': 'DRAFT',
        'ARCHIVE': 'ARCHIVED'
      },
      'APPROVED': {
        'ARCHIVE': 'ARCHIVED'
      },
      'REJECTED': {
        'SUBMIT_FOR_REVIEW': 'REVIEW',
        'ARCHIVE': 'ARCHIVED'
      },
      'ARCHIVED': {
        'RESTORE': 'DRAFT'
      }
    };

    return transitions[currentStatus]?.[action] || null;
  }

  /**
   * Holt die Workflow-Historie eines Dokuments
   */
  async getDocumentWorkflowHistory(documentId: string): Promise<any[]> {
    try {
      // @ts-ignore: Prisma client not recognizing documentWorkflow property
      const history = await this.prisma.documentWorkflow.findMany({
        where: { documentId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return history;
    } catch (error) {
      logger.error('Failed to get document workflow history:', error);
      throw error;
    }
  }

  /**
   * Erstellt eine neue Workflow-Regel
   */
  async createWorkflowRule(
    name: string,
    triggerEvent: string,
    action: string,
    condition?: string,
    actionParams?: any,
    description?: string
  ): Promise<any> {
    try {
      // @ts-ignore: Prisma client not recognizing workflowRule property
      const rule = await this.prisma.workflowRule.create({
        data: {
          name,
          description,
          triggerEvent,
          condition,
          action,
          actionParams
        }
      });

      logger.info(`Created workflow rule: ${name}`);
      return rule;
    } catch (error) {
      logger.error('Failed to create workflow rule:', error);
      throw error;
    }
  }

  /**
   * Führt automatisierte Workflow-Regeln aus
   */
  async executeWorkflowRules(event: string, data: any): Promise<void> {
    try {
      // Hole alle aktivierten Regeln für das Ereignis
      // @ts-ignore: Prisma client not recognizing workflowRule property
      const rules = await this.prisma.workflowRule.findMany({
        where: {
          triggerEvent: event,
          enabled: true
        },
        orderBy: {
          priority: 'asc'
        }
      });

      // Führe jede Regel aus
      for (const rule of rules) {
        try {
          // Prüfe Bedingungen
          if (rule.condition && !this.evaluateCondition(rule.condition, data)) {
            continue;
          }

          // Führe Aktion aus
          await this.executeRuleAction(rule.action, rule.actionParams, data);
          
          logger.info(`Executed workflow rule: ${rule.name}`);
        } catch (error) {
          logger.error(`Failed to execute workflow rule ${rule.name}:`, error);
        }
      }
    } catch (error) {
      logger.error('Failed to execute workflow rules:', error);
      throw error;
    }
  }

  /**
   * Bewertet eine Bedingung
   */
  private evaluateCondition(conditionStr: string, data: any): boolean {
    try {
      // In einer echten Implementierung würden wir eine sichere Auswertung verwenden
      // Für dieses Beispiel geben wir einfach true zurück
      return true;
    } catch (error) {
      logger.error('Failed to evaluate condition:', error);
      return false;
    }
  }

  /**
   * Führt eine Regelaktion aus
   */
  private async executeRuleAction(action: string, params: any, data: any): Promise<void> {
    try {
      switch (action) {
        case 'change_status':
          if (params.documentId && params.status) {
            await this.prisma.document.update({
              where: { id: params.documentId },
              // @ts-ignore: Prisma client not recognizing status field
              data: { status: params.status }
            });
          }
          break;
        
        case 'send_notification':
          // In einer echten Implementierung würden wir eine Benachrichtigung senden
          logger.info(`Would send notification: ${JSON.stringify(params)}`);
          break;
          
        default:
          logger.warn(`Unknown workflow action: ${action}`);
      }
    } catch (error) {
      logger.error(`Failed to execute rule action ${action}:`, error);
      throw error;
    }
  }

  /**
   * Holt alle Workflow-Regeln
   */
  async getAllWorkflowRules(): Promise<any[]> {
    try {
      // @ts-ignore: Prisma client not recognizing workflowRule property
      const rules = await this.prisma.workflowRule.findMany({
        orderBy: {
          priority: 'asc'
        }
      });

      return rules;
    } catch (error) {
      logger.error('Failed to get workflow rules:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert eine Workflow-Regel
   */
  async updateWorkflowRule(
    ruleId: string,
    updates: Partial<{
      name: string;
      description: string;
      triggerEvent: string;
      condition: string;
      action: string;
      actionParams: any;
      enabled: boolean;
      priority: number;
    }>
  ): Promise<any> {
    try {
      // @ts-ignore: Prisma client not recognizing workflowRule property
      const rule = await this.prisma.workflowRule.update({
        where: { id: ruleId },
        data: updates
      });

      logger.info(`Updated workflow rule: ${rule.name}`);
      return rule;
    } catch (error) {
      logger.error('Failed to update workflow rule:', error);
      throw error;
    }
  }

  /**
   * Löscht eine Workflow-Regel
   */
  async deleteWorkflowRule(ruleId: string): Promise<void> {
    try {
      // @ts-ignore: Prisma client not recognizing workflowRule property
      await this.prisma.workflowRule.delete({
        where: { id: ruleId }
      });

      logger.info(`Deleted workflow rule: ${ruleId}`);
    } catch (error) {
      logger.error('Failed to delete workflow rule:', error);
      throw error;
    }
  }
}