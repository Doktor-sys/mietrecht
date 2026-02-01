"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentWorkflowService = void 0;
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
class DocumentWorkflowService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Ändert den Status eines Dokuments basierend auf einer Workflow-Aktion
     */
    async transitionDocumentStatus(documentId, userId, action, comment) {
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
                throw new errorHandler_1.ValidationError('Document not found');
            }
            // Bestimme den neuen Status basierend auf der Aktion
            const newStatus = this.determineNewStatus(document.status, action);
            if (!newStatus) {
                throw new errorHandler_1.ValidationError(`Invalid action '${action}' for current status '${document.status}'`);
            }
            // Aktualisiere den Dokumentstatus
            const updatedDocument = await this.prisma.document.update({
                where: { id: documentId },
                data: {
                    // @ts-ignore: Prisma client not recognizing status field
                    status: newStatus
                }
            });
            // Erstelle einen Workflow-Eintrag
            // @ts-ignore: Prisma client not recognizing documentWorkflow property
            await this.prisma.documentWorkflow.create({
                data: {
                    documentId,
                    userId,
                    action: action,
                    fromStatus: document.status,
                    toStatus: newStatus,
                    comment
                }
            });
            logger_1.logger.info(`Document ${documentId} status changed from ${document.status} to ${newStatus}`);
            return updatedDocument;
        }
        catch (error) {
            logger_1.logger.error('Failed to transition document status:', error);
            throw error;
        }
    }
    /**
     * Bestimmt den neuen Status basierend auf der aktuellen Status und Aktion
     */
    determineNewStatus(currentStatus, action) {
        const transitions = {
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
    async getDocumentWorkflowHistory(documentId) {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get document workflow history:', error);
            throw error;
        }
    }
    /**
     * Erstellt eine neue Workflow-Regel
     */
    async createWorkflowRule(name, triggerEvent, action, condition, actionParams, description) {
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
            logger_1.logger.info(`Created workflow rule: ${name}`);
            return rule;
        }
        catch (error) {
            logger_1.logger.error('Failed to create workflow rule:', error);
            throw error;
        }
    }
    /**
     * Führt automatisierte Workflow-Regeln aus
     */
    async executeWorkflowRules(event, data) {
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
                    logger_1.logger.info(`Executed workflow rule: ${rule.name}`);
                }
                catch (error) {
                    logger_1.logger.error(`Failed to execute workflow rule ${rule.name}:`, error);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to execute workflow rules:', error);
            throw error;
        }
    }
    /**
     * Bewertet eine Bedingung
     */
    evaluateCondition(conditionStr, data) {
        try {
            // In einer echten Implementierung würden wir eine sichere Auswertung verwenden
            // Für dieses Beispiel geben wir einfach true zurück
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to evaluate condition:', error);
            return false;
        }
    }
    /**
     * Führt eine Regelaktion aus
     */
    async executeRuleAction(action, params, data) {
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
                    logger_1.logger.info(`Would send notification: ${JSON.stringify(params)}`);
                    break;
                default:
                    logger_1.logger.warn(`Unknown workflow action: ${action}`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Failed to execute rule action ${action}:`, error);
            throw error;
        }
    }
    /**
     * Holt alle Workflow-Regeln
     */
    async getAllWorkflowRules() {
        try {
            // @ts-ignore: Prisma client not recognizing workflowRule property
            const rules = await this.prisma.workflowRule.findMany({
                orderBy: {
                    priority: 'asc'
                }
            });
            return rules;
        }
        catch (error) {
            logger_1.logger.error('Failed to get workflow rules:', error);
            throw error;
        }
    }
    /**
     * Aktualisiert eine Workflow-Regel
     */
    async updateWorkflowRule(ruleId, updates) {
        try {
            // @ts-ignore: Prisma client not recognizing workflowRule property
            const rule = await this.prisma.workflowRule.update({
                where: { id: ruleId },
                data: updates
            });
            logger_1.logger.info(`Updated workflow rule: ${rule.name}`);
            return rule;
        }
        catch (error) {
            logger_1.logger.error('Failed to update workflow rule:', error);
            throw error;
        }
    }
    /**
     * Löscht eine Workflow-Regel
     */
    async deleteWorkflowRule(ruleId) {
        try {
            // @ts-ignore: Prisma client not recognizing workflowRule property
            await this.prisma.workflowRule.delete({
                where: { id: ruleId }
            });
            logger_1.logger.info(`Deleted workflow rule: ${ruleId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to delete workflow rule:', error);
            throw error;
        }
    }
}
exports.DocumentWorkflowService = DocumentWorkflowService;
