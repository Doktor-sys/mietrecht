import { PrismaClient } from '@prisma/client';
import { AlertManager } from './kms/AlertManager';
export interface LegalUpdate {
    id: string;
    title: string;
    description: string;
    category: string;
    jurisdiction: string;
    effectiveDate: Date;
    source: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    impactAreas: string[];
    complianceRequirements: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface ComplianceCheck {
    id: string;
    organizationId: string;
    legalUpdateId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'non_compliant';
    findings: string[];
    recommendations: string[];
    deadline?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ComplianceMonitoringReport {
    period: {
        start: Date;
        end: Date;
    };
    organizationId: string;
    legalUpdates: LegalUpdate[];
    complianceChecks: ComplianceCheck[];
    complianceStatus: {
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        nonCompliant: number;
        complianceRate: number;
    };
    criticalIssues: ComplianceCheck[];
    upcomingDeadlines: ComplianceCheck[];
    recommendations: string[];
}
export interface ComplianceQuery {
    organizationId: string;
    startDate?: Date;
    endDate?: Date;
    categories?: string[];
    jurisdictions?: string[];
    severityLevels?: ('low' | 'medium' | 'high' | 'critical')[];
    status?: ('pending' | 'in_progress' | 'completed' | 'non_compliant')[];
}
export declare class ComplianceMonitoringService {
    private prisma;
    private alertManager;
    constructor(prisma: PrismaClient, alertManager: AlertManager);
    /**
     * Überwacht Compliance-Änderungen und führt automatische Prüfungen durch
     */
    monitorCompliance(query: ComplianceQuery): Promise<ComplianceMonitoringReport>;
    /**
     * Holt relevante Rechtsänderungen basierend auf Kriterien
     */
    private getRelevantLegalUpdates;
    /**
     * Liefert Standard-Rechtsänderungen als Fallback
     */
    private getDefaultLegalUpdates;
    /**
     * Führt Compliance-Prüfungen für Rechtsänderungen durch
     */
    private performComplianceChecks;
    /**
     * Generiert einen Compliance-Überwachungsbericht
     */
    private generateComplianceReport;
    /**
     * Generiert Compliance-Empfehlungen
     */
    private generateComplianceRecommendations;
    /**
     * Prüft auf kritische Probleme und sendet Alerts
     */
    private checkForCriticalIssues;
    /**
     * Aktualisiert den Status einer Compliance-Prüfung
     */
    updateComplianceCheck(checkId: string, updates: Partial<Omit<ComplianceCheck, 'id' | 'organizationId' | 'legalUpdateId' | 'createdAt' | 'updatedAt'>>): Promise<ComplianceCheck>;
    /**
     * Erstellt eine neue Rechtsänderung
     */
    createLegalUpdate(updateData: Omit<LegalUpdate, 'id' | 'createdAt' | 'updatedAt'>): Promise<LegalUpdate>;
    /**
     * Löscht eine Rechtsänderung
     */
    deleteLegalUpdate(id: string): Promise<void>;
}
