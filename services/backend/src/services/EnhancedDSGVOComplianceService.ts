import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AuditService } from './AuditService';
import { EmailService } from './EmailService';

export interface DSGVODataSubjectRequest {
  id: string;
  userId: string;
  requestId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestData: any;
  response?: any;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  rejectionReason?: string;
}

export interface DSGVOComplianceReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  dataSubjectRequests: {
    total: number;
    byType: Record<string, number>;
    averageResponseTime: number; // in hours
    fulfillmentRate: number; // percentage
  };
  consentManagement: {
    totalConsents: number;
    activeConsents: number;
    revokedConsents: number;
    consentTypes: Record<string, number>;
  };
  dataBreaches: {
    total: number;
    reported: number;
    resolved: number;
    averageResolutionTime: number; // in days
  };
  dataProtectionImpactAssessments: {
    total: number;
    completed: number;
    pending: number;
  };
  complianceScore: number; // 0-100
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: string;
  givenAt: Date;
  withdrawnAt?: Date;
  consentText: string;
  version: string;
}

export class EnhancedDSGVOComplianceService {
  private emailService: EmailService;

  constructor(
    private prisma: PrismaClient,
    private auditService: AuditService
  ) {
    this.emailService = new EmailService();
  }

  /**
   * Erstellt eine neue Datensubjektanfrage
   */
  async createDataSubjectRequest(
    userId: string,
    requestType: DSGVODataSubjectRequest['requestType'],
    requestData: any
  ): Promise<DSGVODataSubjectRequest> {
    try {
      // Generiere eine eindeutige Request-ID
      const requestId = `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const request = await (this.prisma as any).dSGVODataSubjectRequest.create({
        data: {
          userId,
          requestId,
          requestType: requestType as any,
          status: 'PENDING',
          requestData
        }
      });

      // Log die Anfrage
      await this.auditService.logSecurityEvent(
        'gdpr_data_export' as any,
        userId,
        undefined,
        {
          action: 'create_data_subject_request',
          resourceType: 'DSGVODataSubjectRequest',
          resourceId: requestId,
          metadata: { requestType, requestData }
        }
      );

      logger.info(`Created DSGVO data subject request ${requestId} for user ${userId}`);

      return request;
    } catch (error) {
      logger.error('Failed to create data subject request:', error);
      throw error;
    }
  }

  /**
   * Verarbeitet eine Datensubjektanfrage
   */
  async processDataSubjectRequest(requestId: string, response: any): Promise<DSGVODataSubjectRequest> {
    try {
      const request = await (this.prisma as any).dSGVODataSubjectRequest.update({
        where: { requestId },
        data: {
          status: 'COMPLETED',
          response,
          resolvedAt: new Date()
        }
      });

      // Sende Benachrichtigung an den Benutzer
      await this.notifyUserAboutRequestCompletion(request);

      // Log die Verarbeitung
      await this.auditService.logSecurityEvent(
        'gdpr_data_export' as any,
        request.userId,
        undefined,
        {
          action: 'process_data_subject_request',
          resourceType: 'DSGVODataSubjectRequest',
          resourceId: requestId,
          metadata: { response }
        }
      );

      logger.info(`Processed DSGVO data subject request ${requestId}`);

      return request;
    } catch (error) {
      logger.error('Failed to process data subject request:', error);
      throw error;
    }
  }

  /**
   * Lehnt eine Datensubjektanfrage ab
   */
  async rejectDataSubjectRequest(requestId: string, reason: string): Promise<DSGVODataSubjectRequest> {
    try {
      const request = await (this.prisma as any).dSGVODataSubjectRequest.update({
        where: { requestId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          resolvedAt: new Date()
        }
      });

      // Sende Benachrichtigung an den Benutzer
      await this.notifyUserAboutRequestRejection(request, reason);

      // Log die Ablehnung
      await this.auditService.logSecurityEvent(
        'gdpr_data_export' as any,
        request.userId,
        undefined,
        {
          action: 'reject_data_subject_request',
          resourceType: 'DSGVODataSubjectRequest',
          resourceId: requestId,
          metadata: { reason }
        }
      );

      logger.info(`Rejected DSGVO data subject request ${requestId}: ${reason}`);

      return request;
    } catch (error) {
      logger.error('Failed to reject data subject request:', error);
      throw error;
    }
  }

  /**
   * Benachrichtigt den Benutzer über die Abschluss einer Anfrage
   */
  private async notifyUserAboutRequestCompletion(request: DSGVODataSubjectRequest): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: request.userId }
      });

      if (!user) {
        logger.warn(`User ${request.userId} not found for DSGVO request notification`);
        return;
      }

      let subject = '';
      let text = '';

      switch (request.requestType) {
        case 'access':
          subject = 'Ihr Auskunftsersuchen wurde bearbeitet';
          text = `Sehr geehrte/r Nutzer/in,

Ihr Auskunftsersuchen (Referenz: ${request.requestId}) wurde erfolgreich bearbeitet. Die angeforderten Daten stehen Ihnen in Ihrem Konto zur Verfügung.

Mit freundlichen Grüßen
Ihr SmartLaw Team`;
          break;
        case 'erasure':
          subject = 'Ihr Löschersuchen wurde bearbeitet';
          text = `Sehr geehrte/r Nutzer/in,

Ihr Löschersuchen (Referenz: ${request.requestId}) wurde erfolgreich bearbeitet. Die angeforderten Daten wurden gemäß Ihrer Anfrage gelöscht.

Mit freundlichen Grüßen
Ihr SmartLaw Team`;
          break;
        case 'rectification':
          subject = 'Ihr Berichtigungsersuchen wurde bearbeitet';
          text = `Sehr geehrte/r Nutzer/in,

Ihr Berichtigungsersuchen (Referenz: ${request.requestId}) wurde erfolgreich bearbeitet. Die angeforderten Daten wurden entsprechend aktualisiert.

Mit freundlichen Grüßen
Ihr SmartLaw Team`;
          break;
        default:
          subject = 'Ihr DSGVO-Ersuchen wurde bearbeitet';
          text = `Sehr geehrte/r Nutzer/in,

Ihr DSGVO-Ersuchen (Referenz: ${request.requestId}) wurde erfolgreich bearbeitet.

Mit freundlichen Grüßen
Ihr SmartLaw Team`;
      }

      await this.emailService.sendEmail({
        to: user.email,
        subject,
        text
      });
    } catch (error) {
      logger.error('Failed to notify user about request completion:', error);
    }
  }

  /**
   * Benachrichtigt den Benutzer über die Ablehnung einer Anfrage
   */
  private async notifyUserAboutRequestRejection(request: DSGVODataSubjectRequest, reason: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: request.userId }
      });

      if (!user) {
        logger.warn(`User ${request.userId} not found for DSGVO request rejection notification`);
        return;
      }

      const subject = 'Ihr DSGVO-Ersuchen wurde abgelehnt';
      const text = `Sehr geehrte/r Nutzer/in,

Ihr DSGVO-Ersuchen (Referenz: ${request.requestId}) wurde leider abgelehnt aus folgendem Grund:

${reason}

Wenn Sie Fragen dazu haben oder weitere Informationen benötigen, wenden Sie sich bitte an unseren Datenschutzbeauftragten unter datenschutz@smartlaw.de.

Mit freundlichen Grüßen
Ihr SmartLaw Team`;

      await this.emailService.sendEmail({
        to: user.email,
        subject,
        text
      });
    } catch (error) {
      logger.error('Failed to notify user about request rejection:', error);
    }
  }

  /**
   * Gibt alle Datensubjektanfragen eines Benutzers zurück
   */
  async getDataSubjectRequestsForUser(userId: string): Promise<DSGVODataSubjectRequest[]> {
    try {
      return await (this.prisma as any).dSGVODataSubjectRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('Failed to get data subject requests for user:', error);
      throw error;
    }
  }

  /**
   * Gibt alle ausstehenden Datensubjektanfragen zurück
   */
  async getPendingDataSubjectRequests(): Promise<DSGVODataSubjectRequest[]> {
    try {
      return await (this.prisma as any).dSGVODataSubjectRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' }
      });
    } catch (error) {
      logger.error('Failed to get pending data subject requests:', error);
      throw error;
    }
  }

  /**
   * Erteilt eine Einwilligung
   */
  async giveConsent(userId: string, consentType: string, consentText: string, version: string): Promise<ConsentRecord> {
    try {
      const consent = await (this.prisma as any).consentRecord.create({
        data: {
          userId,
          consentType: consentType as any,
          consentText,
          version
        }
      });

      // Log die Einwilligung
      await this.auditService.logSecurityEvent(
        'gdpr_data_export' as any,
        userId,
        undefined,
        {
          action: 'give_consent',
          resourceType: 'ConsentRecord',
          resourceId: consent.id,
          metadata: { consentType, version }
        }
      );

      logger.info(`User ${userId} gave consent for ${consentType}`);

      return consent;
    } catch (error) {
      logger.error('Failed to give consent:', error);
      throw error;
    }
  }

  /**
   * Widerruft eine Einwilligung
   */
  async withdrawConsent(consentId: string): Promise<ConsentRecord> {
    try {
      const consent = await (this.prisma as any).consentRecord.update({
        where: { id: consentId },
        data: {
          withdrawnAt: new Date()
        }
      });

      // Log den Widerruf
      await this.auditService.logSecurityEvent(
        'gdpr_data_export' as any,
        consent.userId,
        undefined,
        {
          action: 'withdraw_consent',
          resourceType: 'ConsentRecord',
          resourceId: consentId,
          metadata: { consentType: consent.consentType }
        }
      );

      logger.info(`User ${consent.userId} withdrew consent for ${consent.consentType}`);

      return consent;
    } catch (error) {
      logger.error('Failed to withdraw consent:', error);
      throw error;
    }
  }

  /**
   * Gibt alle Einwilligungen eines Benutzers zurück
   */
  async getConsentsForUser(userId: string): Promise<ConsentRecord[]> {
    try {
      return await (this.prisma as any).consentRecord.findMany({
        where: { userId },
        orderBy: { givenAt: 'desc' }
      });
    } catch (error) {
      logger.error('Failed to get consents for user:', error);
      throw error;
    }
  }

  /**
   * Meldet eine Datenschutzverletzung
   */
  async reportDataBreach(description: string, affectedUsers: number, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<void> {
    try {
      // Erstelle einen Bericht über die Datenschutzverletzung
      await (this.prisma as any).dataBreachReport.create({
        data: {
          description,
          affectedUsers,
          severity: severity.toUpperCase() as any
        }
      });

      // Log die Meldung
      await this.auditService.logSecurityEvent(
        'security_alert' as any,
        undefined,
        undefined,
        {
          action: 'report_data_breach',
          resourceType: 'DataBreachReport',
          metadata: { description, affectedUsers, severity }
        }
      );

      logger.warn(`Data breach reported: ${description} (Severity: ${severity}, Affected: ${affectedUsers} users)`);

      // Benachrichtige den Datenschutzbeauftragten
      await this.notifyDataProtectionOfficer(description, affectedUsers, severity);
    } catch (error) {
      logger.error('Failed to report data breach:', error);
      throw error;
    }
  }

  /**
   * Benachrichtigt den Datenschutzbeauftragten über eine Datenschutzverletzung
   */
  private async notifyDataProtectionOfficer(description: string, affectedUsers: number, severity: string): Promise<void> {
    try {
      // In einer echten Implementierung würden wir hier eine echte E-Mail-Adresse verwenden
      // Für dieses Beispiel verwenden wir eine Dummy-Adresse
      const dpoEmail = 'datenschutz@smartlaw.de';

      const subject = `DRINGEND: Datenschutzverletzung gemeldet (Schweregrad: ${severity})`;
      const text = `Sehr geehrte/r Datenschutzbeauftragte/r,

Es wurde eine Datenschutzverletzung gemeldet:

Beschreibung: ${description}
Betroffene Nutzer: ${affectedUsers}
Schweregrad: ${severity}

Bitte ergreifen Sie umgehend die notwendigen Maßnahmen.

Mit freundlichen Grüßen
SmartLaw System`;

      await this.emailService.sendEmail({
        to: dpoEmail,
        subject,
        text
      });
    } catch (error) {
      logger.error('Failed to notify data protection officer:', error);
    }
  }

  /**
   * Erstellt einen erweiterten DSGVO-Compliance-Bericht
   */
  async generateEnhancedDSGVOComplianceReport(startDate: Date, endDate: Date): Promise<DSGVOComplianceReport> {
    try {
      // Datensubjektanfragen
      const requests = await (this.prisma as any).dSGVODataSubjectRequest.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalRequests = requests.length;
      const requestsByType: Record<string, number> = {};
      let totalResolutionTime = 0;
      let resolvedRequests = 0;

      requests.forEach((request: any) => {
        // Zähle Anfragen nach Typ
        requestsByType[request.requestType] = (requestsByType[request.requestType] || 0) + 1;

        // Berechne durchschnittliche Bearbeitungszeit
        if (request.resolvedAt) {
          const resolutionTime = (request.resolvedAt.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60); // in Stunden
          totalResolutionTime += resolutionTime;
          resolvedRequests++;
        }
      });

      const averageResponseTime = resolvedRequests > 0 ? totalResolutionTime / resolvedRequests : 0;
      const fulfilledRequests = requests.filter((r: any) => r.status === 'COMPLETED').length;
      const fulfillmentRate = totalRequests > 0 ? (fulfilledRequests / totalRequests) * 100 : 100;

      // Einwilligungen
      const consents = await (this.prisma as any).consentRecord.findMany({
        where: {
          givenAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalConsents = consents.length;
      const activeConsents = consents.filter((c: any) => !c.withdrawnAt).length;
      const revokedConsents = consents.filter((c: any) => c.withdrawnAt).length;

      const consentTypes: Record<string, number> = {};
      consents.forEach((consent: any) => {
        consentTypes[consent.consentType] = (consentTypes[consent.consentType] || 0) + 1;
      });

      // Datenschutzverletzungen
      const breaches = await (this.prisma as any).dataBreachReport.findMany({
        where: {
          reportedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalBreaches = breaches.length;
      const resolvedBreaches = breaches.filter((b: any) => b.resolvedAt).length;
      
      let totalBreachResolutionTime = 0;
      breaches.forEach((breach: any) => {
        if (breach.resolvedAt) {
          const resolutionTime = (breach.resolvedAt.getTime() - breach.reportedAt.getTime()) / (1000 * 60 * 60 * 24); // in Tagen
          totalBreachResolutionTime += resolutionTime;
        }
      });

      const averageBreachResolutionTime = resolvedBreaches > 0 ? totalBreachResolutionTime / resolvedBreaches : 0;

      // Datenschutz-Folgenabschätzungen
      const dpiaRecords = await (this.prisma as any).dataProtectionImpactAssessment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalDPIA = dpiaRecords.length;
      const completedDPIA = dpiaRecords.filter((d: any) => d.status === 'COMPLETED').length;
      const pendingDPIA = dpiaRecords.filter((d: any) => d.status === 'PENDING').length;

      // Berechne Compliance-Score
      let complianceScore = 100;

      // Abzüge für lange Bearbeitungszeiten
      if (averageResponseTime > 30 * 24) complianceScore -= 20; // Mehr als 30 Tage
      else if (averageResponseTime > 14 * 24) complianceScore -= 10; // Mehr als 14 Tage

      // Abzüge für niedrige Erfüllungsrate
      if (fulfillmentRate < 80) complianceScore -= 15;
      else if (fulfillmentRate < 90) complianceScore -= 5;

      // Abzüge für Datenschutzverletzungen
      complianceScore -= Math.min(totalBreaches * 5, 25);

      // Abzüge für unerledigte DPIAs
      if (pendingDPIA > 0) {
        const pendingRatio = pendingDPIA / Math.max(totalDPIA, 1);
        if (pendingRatio > 0.5) complianceScore -= 10;
        else complianceScore -= 5;
      }

      complianceScore = Math.max(0, complianceScore);

      return {
        period: {
          startDate,
          endDate
        },
        dataSubjectRequests: {
          total: totalRequests,
          byType: requestsByType,
          averageResponseTime,
          fulfillmentRate
        },
        consentManagement: {
          totalConsents,
          activeConsents,
          revokedConsents,
          consentTypes
        },
        dataBreaches: {
          total: totalBreaches,
          reported: totalBreaches,
          resolved: resolvedBreaches,
          averageResolutionTime: averageBreachResolutionTime
        },
        dataProtectionImpactAssessments: {
          total: totalDPIA,
          completed: completedDPIA,
          pending: pendingDPIA
        },
        complianceScore
      };
    } catch (error) {
      logger.error('Failed to generate enhanced DSGVO compliance report:', error);
      throw error;
    }
  }
}