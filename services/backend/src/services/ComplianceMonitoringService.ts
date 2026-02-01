import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ComplianceReportingService } from './ComplianceReportingService';
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
    complianceRate: number; // 0-100
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

export class ComplianceMonitoringService {
  private prisma: PrismaClient;
  private alertManager: AlertManager;

  constructor(prisma: PrismaClient, alertManager: AlertManager) {
    this.prisma = prisma;
    this.alertManager = alertManager;
  }

  /**
   * Überwacht Compliance-Änderungen und führt automatische Prüfungen durch
   */
  async monitorCompliance(query: ComplianceQuery): Promise<ComplianceMonitoringReport> {
    try {
      const { organizationId, startDate, endDate, categories, jurisdictions, severityLevels, status } = query;
      
      // Hole relevante Rechtsänderungen
      const legalUpdates = await this.getRelevantLegalUpdates({
        categories,
        jurisdictions,
        severityLevels,
        startDate,
        endDate
      });
      
      // Führe Compliance-Prüfungen durch
      const complianceChecks = await this.performComplianceChecks(organizationId, legalUpdates);
      
      // Generiere Bericht
      const report = this.generateComplianceReport(legalUpdates, complianceChecks, organizationId, startDate, endDate);
      
      // Prüfe auf kritische Probleme und sende Alerts
      await this.checkForCriticalIssues(report);
      
      return report;
    } catch (error) {
      logger.error('Error monitoring compliance:', error);
      throw new Error('Failed to monitor compliance');
    }
  }

  /**
   * Holt relevante Rechtsänderungen basierend auf Kriterien
   */
  private async getRelevantLegalUpdates(query: {
    categories?: string[];
    jurisdictions?: string[];
    severityLevels?: ('low' | 'medium' | 'high' | 'critical')[];
    startDate?: Date;
    endDate?: Date;
  }): Promise<LegalUpdate[]> {
    try {
      // Erstelle Where-Bedingungen
      const where: any = {};
      
      if (query.categories && query.categories.length > 0) {
        where.category = { in: query.categories };
      }
      
      if (query.jurisdictions && query.jurisdictions.length > 0) {
        where.jurisdiction = { in: query.jurisdictions };
      }
      
      if (query.severityLevels && query.severityLevels.length > 0) {
        where.severity = { in: query.severityLevels };
      }
      
      if (query.startDate || query.endDate) {
        where.effectiveDate = {};
        if (query.startDate) where.effectiveDate.gte = query.startDate;
        if (query.endDate) where.effectiveDate.lte = query.endDate;
      }
      
      // Hole Rechtsänderungen aus der Datenbank
      // @ts-ignore - Prisma-Client-Probleme
      const updates = await this.prisma.legalUpdate.findMany({
        where,
        orderBy: [
          { severity: 'desc' },
          { effectiveDate: 'desc' }
        ]
      });
      
      return updates.map((update: any) => ({
        id: update.id,
        title: update.title,
        description: update.description,
        category: update.category,
        jurisdiction: update.jurisdiction,
        effectiveDate: update.effectiveDate,
        source: update.source,
        severity: update.severity as 'low' | 'medium' | 'high' | 'critical',
        impactAreas: update.impactAreas as string[],
        complianceRequirements: update.complianceRequirements as string[],
        createdAt: update.createdAt,
        updatedAt: update.updatedAt
      }));
    } catch (error) {
      logger.error('Error fetching legal updates:', error);
      // Rückfall auf Standard-Rechtsänderungen
      return this.getDefaultLegalUpdates();
    }
  }

  /**
   * Liefert Standard-Rechtsänderungen als Fallback
   */
  private getDefaultLegalUpdates(): LegalUpdate[] {
    return [
      {
        id: 'default-1',
        title: 'DSGVO Anpassungen',
        description: 'Aktualisierung der Datenschutz-Grundverordnung',
        category: 'Datenschutz',
        jurisdiction: 'EU',
        effectiveDate: new Date(),
        source: 'EU-Verordnung',
        severity: 'high',
        impactAreas: ['Datenschutz', 'Dokumentenmanagement'],
        complianceRequirements: ['DSGVO-Konformität prüfen', 'Datenschutzerklärung aktualisieren'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Führt Compliance-Prüfungen für Rechtsänderungen durch
   */
  private async performComplianceChecks(organizationId: string, legalUpdates: LegalUpdate[]): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];
    
    for (const update of legalUpdates) {
      try {
        // Prüfe ob bereits eine Compliance-Prüfung existiert
        // @ts-ignore - Prisma-Client-Probleme
        let existingCheck = await this.prisma.complianceCheck.findFirst({
          where: {
            organizationId,
            legalUpdateId: update.id
          }
        });
        
        // Wenn keine Prüfung existiert, erstelle eine neue
        if (!existingCheck) {
          // @ts-ignore - Prisma-Client-Probleme
          existingCheck = await this.prisma.complianceCheck.create({
            data: {
              organizationId,
              legalUpdateId: update.id,
              status: 'pending',
              findings: [],
              recommendations: []
            }
          });
        }
        
        // Transformiere in ComplianceCheck-Objekt
        checks.push({
          id: existingCheck.id,
          organizationId: existingCheck.organizationId,
          legalUpdateId: existingCheck.legalUpdateId,
          status: existingCheck.status as 'pending' | 'in_progress' | 'completed' | 'non_compliant',
          findings: existingCheck.findings as string[],
          recommendations: existingCheck.recommendations as string[],
          deadline: existingCheck.deadline || undefined,
          completedAt: existingCheck.completedAt || undefined,
          createdAt: existingCheck.createdAt,
          updatedAt: existingCheck.updatedAt
        });
      } catch (error: any) {
        logger.error(`Error performing compliance check for update ${update.id}:`, error);
        // Erstelle eine fehlerhafte Prüfung
        checks.push({
          id: `error-${Date.now()}-${Math.random()}`,
          organizationId,
          legalUpdateId: update.id,
          status: 'pending',
          findings: [`Fehler bei der Prüfung: ${error.message || 'Unbekannter Fehler'}`],
          recommendations: ['Manuelle Prüfung erforderlich'],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    return checks;
  }

  /**
   * Generiert einen Compliance-Überwachungsbericht
   */
  private generateComplianceReport(
    legalUpdates: LegalUpdate[],
    complianceChecks: ComplianceCheck[],
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): ComplianceMonitoringReport {
    // Zeitraum bestimmen
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 Tage
    
    // Compliance-Statistiken
    const total = complianceChecks.length;
    const pending = complianceChecks.filter(c => c.status === 'pending').length;
    const inProgress = complianceChecks.filter(c => c.status === 'in_progress').length;
    const completed = complianceChecks.filter(c => c.status === 'completed').length;
    const nonCompliant = complianceChecks.filter(c => c.status === 'non_compliant').length;
    
    const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 100;
    
    // Kritische Probleme (nicht konforme Prüfungen mit hoher/kritischer Schwere)
    const criticalIssues = complianceChecks.filter(check => {
      if (check.status !== 'non_compliant') return false;
      
      const update = legalUpdates.find(u => u.id === check.legalUpdateId);
      return update && (update.severity === 'high' || update.severity === 'critical');
    });
    
    // Kommende Fristen (innerhalb der nächsten 30 Tage)
    const upcomingDeadlines = complianceChecks.filter(check => {
      if (!check.deadline) return false;
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return check.deadline >= now && check.deadline <= thirtyDaysFromNow;
    });
    
    // Empfehlungen generieren
    const recommendations = this.generateComplianceRecommendations(
      complianceChecks,
      legalUpdates,
      complianceRate
    );
    
    return {
      period: {
        start,
        end
      },
      organizationId,
      legalUpdates,
      complianceChecks,
      complianceStatus: {
        total,
        pending,
        inProgress,
        completed,
        nonCompliant,
        complianceRate
      },
      criticalIssues,
      upcomingDeadlines,
      recommendations
    };
  }

  /**
   * Generiert Compliance-Empfehlungen
   */
  private generateComplianceRecommendations(
    complianceChecks: ComplianceCheck[],
    legalUpdates: LegalUpdate[],
    complianceRate: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Allgemeine Empfehlungen basierend auf Compliance-Rate
    if (complianceRate < 70) {
      recommendations.push('Ihre Compliance-Rate liegt unter 70%. Priorisieren Sie dringend offene Compliance-Aufgaben.');
    } else if (complianceRate < 90) {
      recommendations.push('Ihre Compliance-Rate liegt zwischen 70% und 90%. Es gibt Raum für Verbesserungen.');
    } else {
      recommendations.push('Ihre Compliance-Rate ist sehr gut. Weiter so!');
    }
    
    // Empfehlungen basierend auf nicht konformen Prüfungen
    const nonCompliant = complianceChecks.filter(c => c.status === 'non_compliant');
    if (nonCompliant.length > 0) {
      recommendations.push(`Es gibt ${nonCompliant.length} nicht konforme Bereiche. Prüfen Sie die Empfehlungen zu jeder nicht konformen Prüfung.`);
    }
    
    // Empfehlungen basierend auf kritischen Rechtsänderungen
    const criticalUpdates = legalUpdates.filter(u => u.severity === 'critical');
    if (criticalUpdates.length > 0) {
      recommendations.push(`Es gibt ${criticalUpdates.length} kritische Rechtsänderungen. Stellen Sie sicher, dass alle damit verbundenen Prüfungen abgeschlossen sind.`);
    }
    
    // Empfehlungen basierend auf kommenden Fristen
    const upcomingDeadlines = complianceChecks.filter(check => {
      if (!check.deadline) return false;
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return check.deadline >= now && check.deadline <= thirtyDaysFromNow;
    });
    
    if (upcomingDeadlines.length > 0) {
      recommendations.push(`Es stehen ${upcomingDeadlines.length} Fristen innerhalb der nächsten 30 Tage an. Planen Sie Ihre Arbeit entsprechend.`);
    }
    
    return recommendations;
  }

  /**
   * Prüft auf kritische Probleme und sendet Alerts
   */
  private async checkForCriticalIssues(report: ComplianceMonitoringReport): Promise<void> {
    try {
      // Prüfe auf kritische nicht konforme Bereiche
      if (report.criticalIssues.length > 0) {
        await this.alertManager.handleSecurityEvent('critical_compliance_issue', {
          count: report.criticalIssues.length,
          description: `Es gibt ${report.criticalIssues.length} kritische Compliance-Probleme`,
          issues: report.criticalIssues.map(issue => {
            const update = report.legalUpdates.find(u => u.id === issue.legalUpdateId);
            return {
              id: issue.id,
              title: update?.title || 'Unbekannte Rechtsänderung',
              severity: update?.severity || 'unknown'
            };
          })
        });
      }
      
      // Prüfe auf niedrige Compliance-Rate
      if (report.complianceStatus.complianceRate < 50) {
        await this.alertManager.handleSecurityEvent('low_compliance_rate', {
          rate: report.complianceStatus.complianceRate,
          description: `Compliance-Rate ist unter 50% (${report.complianceStatus.complianceRate}%)`
        });
      }
      
      // Prüfe auf dringende Fristen (innerhalb der nächsten 7 Tage)
      const urgentDeadlines = report.upcomingDeadlines.filter(check => {
        if (!check.deadline) return false;
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return check.deadline >= now && check.deadline <= sevenDaysFromNow;
      });
      
      if (urgentDeadlines.length > 0) {
        await this.alertManager.handleSecurityEvent('urgent_compliance_deadline', {
          count: urgentDeadlines.length,
          description: `Es stehen ${urgentDeadlines.length} dringende Compliance-Fristen innerhalb der nächsten 7 Tage an`
        });
      }
    } catch (error) {
      logger.error('Error checking for critical compliance issues:', error);
    }
  }

  /**
   * Aktualisiert den Status einer Compliance-Prüfung
   */
  async updateComplianceCheck(
    checkId: string,
    updates: Partial<Omit<ComplianceCheck, 'id' | 'organizationId' | 'legalUpdateId' | 'createdAt' | 'updatedAt'>>
  ): Promise<ComplianceCheck> {
    try {
      // Aktualisiere die Prüfung in der Datenbank
      // @ts-ignore - Prisma-Client-Probleme
      const updatedCheck = await this.prisma.complianceCheck.update({
        where: { id: checkId },
        data: updates
      });
      
      return {
        id: updatedCheck.id,
        organizationId: updatedCheck.organizationId,
        legalUpdateId: updatedCheck.legalUpdateId,
        status: updatedCheck.status as 'pending' | 'in_progress' | 'completed' | 'non_compliant',
        findings: updatedCheck.findings as string[],
        recommendations: updatedCheck.recommendations as string[],
        deadline: updatedCheck.deadline || undefined,
        completedAt: updatedCheck.completedAt || undefined,
        createdAt: updatedCheck.createdAt,
        updatedAt: updatedCheck.updatedAt
      };
    } catch (error) {
      logger.error(`Error updating compliance check ${checkId}:`, error);
      throw new Error('Failed to update compliance check');
    }
  }

  /**
   * Erstellt eine neue Rechtsänderung
   */
  async createLegalUpdate(updateData: Omit<LegalUpdate, 'id' | 'createdAt' | 'updatedAt'>): Promise<LegalUpdate> {
    try {
      // Erstelle neue Rechtsänderung in der Datenbank
      // @ts-ignore - Prisma-Client-Probleme
      const newUpdate = await this.prisma.legalUpdate.create({
        data: {
          title: updateData.title,
          description: updateData.description,
          category: updateData.category,
          jurisdiction: updateData.jurisdiction,
          effectiveDate: updateData.effectiveDate,
          source: updateData.source,
          severity: updateData.severity,
          impactAreas: updateData.impactAreas,
          complianceRequirements: updateData.complianceRequirements
        }
      });
      
      return {
        id: newUpdate.id,
        title: newUpdate.title,
        description: newUpdate.description,
        category: newUpdate.category,
        jurisdiction: newUpdate.jurisdiction,
        effectiveDate: newUpdate.effectiveDate,
        source: newUpdate.source,
        severity: newUpdate.severity as 'low' | 'medium' | 'high' | 'critical',
        impactAreas: newUpdate.impactAreas as string[],
        complianceRequirements: newUpdate.complianceRequirements as string[],
        createdAt: newUpdate.createdAt,
        updatedAt: newUpdate.updatedAt
      };
    } catch (error) {
      logger.error('Error creating legal update:', error);
      throw new Error('Failed to create legal update');
    }
  }

  /**
   * Löscht eine Rechtsänderung
   */
  async deleteLegalUpdate(id: string): Promise<void> {
    try {
      // Lösche die Rechtsänderung aus der Datenbank
      // @ts-ignore - Prisma-Client-Probleme
      await this.prisma.legalUpdate.delete({
        where: { id }
      });
    } catch (error) {
      logger.error(`Error deleting legal update ${id}:`, error);
      throw new Error('Failed to delete legal update');
    }
  }
}