import { PrismaClient } from '@prisma/client';
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
export declare class DocumentWorkflowService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Ändert den Status eines Dokuments basierend auf einer Workflow-Aktion
     */
    transitionDocumentStatus(documentId: string, userId: string, action: string, comment?: string): Promise<any>;
    /**
     * Bestimmt den neuen Status basierend auf der aktuellen Status und Aktion
     */
    private determineNewStatus;
    /**
     * Holt die Workflow-Historie eines Dokuments
     */
    getDocumentWorkflowHistory(documentId: string): Promise<any[]>;
    /**
     * Erstellt eine neue Workflow-Regel
     */
    createWorkflowRule(name: string, triggerEvent: string, action: string, condition?: string, actionParams?: any, description?: string): Promise<any>;
    /**
     * Führt automatisierte Workflow-Regeln aus
     */
    executeWorkflowRules(event: string, data: any): Promise<void>;
    /**
     * Bewertet eine Bedingung
     */
    private evaluateCondition;
    /**
     * Führt eine Regelaktion aus
     */
    private executeRuleAction;
    /**
     * Holt alle Workflow-Regeln
     */
    getAllWorkflowRules(): Promise<any[]>;
    /**
     * Aktualisiert eine Workflow-Regel
     */
    updateWorkflowRule(ruleId: string, updates: Partial<{
        name: string;
        description: string;
        triggerEvent: string;
        condition: string;
        action: string;
        actionParams: any;
        enabled: boolean;
        priority: number;
    }>): Promise<any>;
    /**
     * Löscht eine Workflow-Regel
     */
    deleteWorkflowRule(ruleId: string): Promise<void>;
}
