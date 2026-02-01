import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiKeyRequest } from '../middleware/apiKeyAuth';
import { ChatService } from '../services/ChatService';
import { DocumentAnalysisService } from '../services/DocumentAnalysisService';
import { TemplateService } from '../services/TemplateService';
import { LawyerMatchingService } from '../services/LawyerMatchingService';
import { BulkProcessingService } from '../services/BulkProcessingService';
import { AnalyticsService } from '../services/AnalyticsService';
import { PartnershipService } from '../services/PartnershipService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * B2B Controller für die Enterprise-API
 * Stellt alle B2B-Funktionen für externe Partner bereit
 */
export class B2BController {
  private chatService: ChatService;
  private documentAnalysisService: DocumentAnalysisService;
  private templateService: TemplateService;
  private lawyerMatchingService: LawyerMatchingService;
  private bulkProcessingService: BulkProcessingService;
  private analyticsService: AnalyticsService;
  private partnershipService: PartnershipService;

  constructor() {
    this.chatService = new ChatService(prisma);
    this.documentAnalysisService = new DocumentAnalysisService(prisma);
    this.templateService = new TemplateService(prisma);
    this.lawyerMatchingService = new LawyerMatchingService(prisma);
    this.bulkProcessingService = new BulkProcessingService();
    this.analyticsService = new AnalyticsService();
    this.partnershipService = new PartnershipService();
  }

  /**
   * Einzeldokument analysieren
   */
  analyzeDocument = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { documentType, metadata } = req.body;
      const organizationId = req.apiKey!.organizationId;

      // Für die B2B-API erwarten wir entweder eine Datei oder base64-encodierte Daten
      let documentData: Buffer;
      let filename: string;
      let mimeType: string;

      if (req.file) {
        // Multer-Upload
        documentData = req.file.buffer;
        filename = req.file.originalname;
        mimeType = req.file.mimetype;
      } else if (req.body.content && req.body.filename) {
        // Base64-encodierte Daten
        documentData = Buffer.from(req.body.content, 'base64');
        filename = req.body.filename;
        mimeType = req.body.mimeType || 'application/pdf';
      } else {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'Either upload a file or provide base64-encoded content',
        });
      }

      // Erstelle temporäres Dokument in der Datenbank
      const document = await prisma.document.create({
        data: {
          organizationId,
          filename,
          originalName: filename,
          mimeType,
          size: documentData.length,
          documentType,
          uploadedAt: new Date(),
          analysis: metadata || {},
        },
      });

      // Analysiere das Dokument
      const analysis = await this.documentAnalysisService.analyzeDocument(document.id);

      res.json({
        success: true,
        data: {
          documentId: document.id,
          analysis,
        },
      });
    } catch (error) {
      logger.error('Document analysis error:', error);
      res.status(500).json({
        error: 'Analysis failed',
        message: 'An error occurred during document analysis',
      });
    }
  };

  /**
   * Batch-Analyse mehrerer Dokumente
   */
  batchAnalyze = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { documents } = req.body;
      const organizationId = req.apiKey!.organizationId;

      // Validiere Input
      if (!Array.isArray(documents) || documents.length === 0) {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'Documents array is required and must not be empty',
        });
      }

      if (documents.length > 100) {
        return res.status(400).json({
          error: 'Batch too large',
          message: 'Maximum 100 documents per batch allowed',
        });
      }

      // Konvertiere Dokumente in das erwartete Format
      const bulkItems = documents.map((doc: any) => ({
        id: doc.id,
        filename: doc.filename || `document_${doc.id}`,
        content: doc.url ? doc.url : Buffer.from(doc.content || '', 'base64'),
        mimeType: doc.mimeType || 'application/pdf',
        documentType: doc.type,
      }));

      // Starte Bulk-Job
      const jobId = await this.bulkProcessingService.startBulkJob({
        organizationId,
        type: 'document_analysis',
        items: bulkItems,
      });

      res.json({
        success: true,
        data: {
          batchJobId: jobId,
          status: 'pending',
          totalItems: documents.length,
          estimatedCompletionTime: new Date(Date.now() + documents.length * 10000), // 10s pro Dokument
          statusUrl: `/api/b2b/bulk/status/${jobId}`,
        },
      });
    } catch (error) {
      logger.error('Batch analysis error:', error);
      res.status(500).json({
        error: 'Batch analysis failed',
        message: 'An error occurred during batch analysis setup',
      });
    }
  };

  /**
   * KI-Chat-Anfrage
   */
  chatQuery = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { query, context, sessionId } = req.body;
      const organizationId = req.apiKey!.organizationId;

      // Generiere Antwort über ChatService
      const response = await this.chatService.startConversation(
        `b2b_${organizationId}`,
        query
      );

      // Logge Chat-Interaktion
      await prisma.chatInteraction.create({
        data: {
          organizationId,
          sessionId: sessionId || uuidv4(),
          query,
          response: response.message,
          confidence: response.classification?.classification?.confidence || 0.85,
          legalReferences: JSON.stringify(response.legalReferences || []),
        },
      });

      res.json({
        success: true,
        data: {
          response: response.message,
          confidence: response.classification?.classification?.confidence || 0.85,
          legalReferences: response.legalReferences,
          escalationRecommended: response.escalationRecommended,
        },
      });
    } catch (error) {
      logger.error('Chat query error:', error);
      res.status(500).json({
        error: 'Chat query failed',
        message: 'An error occurred during chat processing',
      });
    }
  };

  /**
   * Musterdokument generieren
   */
  generateTemplate = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { templateType, data } = req.body;

      const template = await this.templateService.generateDocument(templateType, data, 'de');

      // Logge Template-Generierung
      await prisma.templateGeneration.create({
        data: {
          organizationId: req.apiKey!.organizationId,
          templateType,
          inputData: data,
          generatedContent: template.content,
        },
      });

      res.json({
        success: true,
        data: {
          templateType,
          content: template.content,
          instructions: template.instructions || 'Verwenden Sie dieses Dokument entsprechend der rechtlichen Anforderungen.',
        },
      });
    } catch (error) {
      logger.error('Template generation error:', error);
      res.status(500).json({
        error: 'Template generation failed',
        message: 'An error occurred during template generation',
      });
    }
  };

  /**
   * Anwaltssuche
   */
  searchLawyers = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { location, specialization, limit = 10, page = 1 } = req.query;

      const lawyerResult = await this.lawyerMatchingService.searchLawyers(
        {
          location: location as string,
          specializations: specialization ? [specialization as string] : [],
        },
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          lawyers: lawyerResult.lawyers.map((lawyer: any) => ({
            id: lawyer.id,
            name: lawyer.name,
            location: lawyer.location,
            specializations: lawyer.specializations,
            rating: lawyer.rating,
            reviewCount: lawyer.reviewCount,
            hourlyRate: lawyer.hourlyRate,
            availableSlots: lawyer.availableSlots || [],
          })),
          total: lawyerResult.total,
        },
      });
    } catch (error) {
      logger.error('Lawyer search error:', error);
      res.status(500).json({
        error: 'Lawyer search failed',
        message: 'An error occurred during lawyer search',
      });
    }
  };

  /**
   * Nutzungsstatistiken abrufen
   */
  getUsageAnalytics = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { period = 'month' } = req.query;
      const organizationId = req.apiKey!.organizationId;

      let startDate: Date;
      const endDate = new Date();

      switch (period) {
        case 'day':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
        default:
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          break;
      }

      // Sammle verschiedene Metriken
      const [
        apiRequests,
        documentAnalyses,
        chatInteractions,
        templateGenerations,
      ] = await Promise.all([
        prisma.apiRequest.count({
          where: {
            apiKey: { organizationId },
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.document.count({
          where: {
            organizationId,
            uploadedAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.chatInteraction.count({
          where: {
            organizationId,
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.templateGeneration.count({
          where: {
            organizationId,
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
      ]);

      // Quota-Informationen
      const quotaInfo = {
        used: req.apiKey!.quotaUsed,
        limit: req.apiKey!.quotaLimit,
        remaining: req.apiKey!.quotaLimit - req.apiKey!.quotaUsed,
        resetDate: new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1),
      };

      res.json({
        success: true,
        data: {
          period,
          startDate,
          endDate,
          metrics: {
            apiRequests,
            documentAnalyses,
            chatInteractions,
            templateGenerations,
          },
          quota: quotaInfo,
        },
      });
    } catch (error) {
      logger.error('Usage analytics error:', error);
      res.status(500).json({
        error: 'Analytics retrieval failed',
        message: 'An error occurred while retrieving usage analytics',
      });
    }
  };

  /**
   * Webhook konfigurieren
   */
  configureWebhook = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { url, events } = req.body;
      const organizationId = req.apiKey!.organizationId;

      // Erstelle oder aktualisiere Webhook
      const webhook = await prisma.webhook.upsert({
        where: { organizationId },
        update: {
          url,
          events,
          isActive: true,
        },
        create: {
          organizationId,
          url,
          events,
          isActive: true,
          secret: uuidv4(),
        },
      });

      res.json({
        success: true,
        data: {
          webhookId: webhook.id,
          url: webhook.url,
          events: webhook.events,
          secret: webhook.secret,
        },
      });
    } catch (error) {
      logger.error('Webhook configuration error:', error);
      res.status(500).json({
        error: 'Webhook configuration failed',
        message: 'An error occurred during webhook configuration',
      });
    }
  };

  /**
   * API-Status und Limits abrufen
   */
  getApiStatus = async (req: ApiKeyRequest, res: Response) => {
    try {
      const apiKey = req.apiKey!;

      // Aktuelle Rate Limit-Nutzung
      const now = new Date();
      const windowStart = new Date(now.getTime() - 60000);

      const currentRateUsage = await prisma.apiRequest.count({
        where: {
          apiKeyId: apiKey.id,
          createdAt: { gte: windowStart },
        },
      });

      res.json({
        success: true,
        data: {
          apiKey: {
            name: apiKey.name,
            permissions: apiKey.permissions,
          },
          rateLimit: {
            limit: apiKey.rateLimit,
            used: currentRateUsage,
            remaining: apiKey.rateLimit - currentRateUsage,
            resetTime: new Date(now.getTime() + 60000),
          },
          quota: {
            limit: apiKey.quotaLimit,
            used: apiKey.quotaUsed,
            remaining: apiKey.quotaLimit - apiKey.quotaUsed,
            resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          },
          status: 'active',
        },
      });
    } catch (error) {
      logger.error('API status error:', error);
      res.status(500).json({
        error: 'Status retrieval failed',
        message: 'An error occurred while retrieving API status',
      });
    }
  };

  /**
   * Bulk Chat-Anfragen verarbeiten
   */
  bulkChatQuery = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { queries, webhookUrl } = req.body;
      const organizationId = req.apiKey!.organizationId;

      // Konvertiere Queries in das erwartete Format
      const bulkItems = queries.map((query: any) => ({
        id: query.id || uuidv4(),
        query: query.query,
        context: query.context,
        sessionId: query.sessionId
      }));

      // Starte Bulk-Job
      const jobId = await this.bulkProcessingService.startBulkJob({
        organizationId,
        type: 'chat_bulk',
        items: bulkItems,
        webhookUrl
      });

      res.json({
        success: true,
        data: {
          batchJobId: jobId,
          status: 'pending',
          totalItems: queries.length,
          estimatedCompletionTime: new Date(Date.now() + queries.length * 5000), // 5s pro Query
          statusUrl: `/api/b2b/bulk/status/${jobId}`
        },
      });
    } catch (error) {
      logger.error('Bulk chat query error:', error);
      res.status(500).json({
        error: 'Bulk chat query failed',
        message: 'An error occurred during bulk chat query setup',
      });
    }
  };

  /**
   * Bulk-Job-Status abrufen
   */
  getBulkJobStatus = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const organizationId = req.apiKey!.organizationId;

      // Überprüfe ob Job zur Organisation gehört
      const job = await prisma.batchJob.findFirst({
        where: {
          id: jobId,
          organizationId
        }
      });

      if (!job) {
        return res.status(404).json({
          error: 'Job not found',
          message: 'The specified batch job was not found or does not belong to your organization',
        });
      }

      const status = await this.bulkProcessingService.getBulkJobStatus(jobId);

      if (!status) {
        return res.status(404).json({
          error: 'Job not found',
          message: 'The specified batch job was not found',
        });
      }

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Get bulk job status error:', error);
      res.status(500).json({
        error: 'Status retrieval failed',
        message: 'An error occurred while retrieving job status',
      });
    }
  };

  /**
   * Bulk-Job abbrechen
   */
  cancelBulkJob = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const organizationId = req.apiKey!.organizationId;

      // Überprüfe ob Job zur Organisation gehört
      const job = await prisma.batchJob.findFirst({
        where: {
          id: jobId,
          organizationId
        }
      });

      if (!job) {
        return res.status(404).json({
          error: 'Job not found',
          message: 'The specified batch job was not found or does not belong to your organization',
        });
      }

      const cancelled = await this.bulkProcessingService.cancelBulkJob(jobId);

      if (cancelled) {
        res.json({
          success: true,
          message: 'Batch job cancelled successfully',
        });
      } else {
        res.status(400).json({
          error: 'Cancellation failed',
          message: 'The batch job could not be cancelled',
        });
      }
    } catch (error) {
      logger.error('Cancel bulk job error:', error);
      res.status(500).json({
        error: 'Cancellation failed',
        message: ' An error occurred while cancelling the job',
      });
    }
  };

  /**
   * Erweiterte Analytics abrufen
   */
  getAdvancedAnalytics = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { startDate, endDate, groupBy, metrics } = req.query;
      const organizationId = req.apiKey!.organizationId;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const analytics = await this.analyticsService.generateAnalytics({
        organizationId,
        startDate: start,
        endDate: end,
        groupBy: groupBy as any,
        metrics: metrics ? (metrics as string).split(',') : undefined
      });

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Advanced analytics error:', error);
      res.status(500).json({
        error: 'Analytics retrieval failed',
        message: 'An error occurred while retrieving advanced analytics',
      });
    }
  };

  /**
   * Nutzungsbericht generieren
   */
  generateUsageReport = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { period = 'month' } = req.query;
      const organizationId = req.apiKey!.organizationId;

      const report = await this.analyticsService.generateUsageReport(
        organizationId,
        period as 'week' | 'month' | 'quarter'
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Usage report error:', error);
      res.status(500).json({
        error: 'Report generation failed',
        message: 'An error occurred while generating the usage report',
      });
    }
  };

  /**
   * Analytics exportieren
   */
  exportAnalytics = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { startDate, endDate, format = 'json' } = req.query;
      const organizationId = req.apiKey!.organizationId;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const exportData = await this.analyticsService.exportAnalytics(
        organizationId,
        start,
        end,
        format as 'json' | 'csv' | 'pdf'
      );

      // Setze entsprechende Content-Type Header
      switch (format) {
        case 'csv':
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
          break;
        case 'pdf':
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=analytics.pdf');
          break;
        default:
          res.setHeader('Content-Type', 'application/json');
      }

      res.send(exportData);
    } catch (error) {
      logger.error('Analytics export error:', error);
      res.status(500).json({
        error: 'Export failed',
        message: 'An error occurred while exporting analytics',
      });
    }
  };

  /**
   * Alle Bulk-Jobs für Organisation auflisten
   */
  listBulkJobs = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { status, type, limit = 50, offset = 0 } = req.query;
      const organizationId = req.apiKey!.organizationId;

      const where: any = { organizationId };
      if (status) where.status = status;
      if (type) where.type = type;

      const [jobs, total] = await Promise.all([
        prisma.batchJob.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit as string),
          skip: parseInt(offset as string),
          select: {
            id: true,
            type: true,
            status: true,
            totalItems: true,
            processedItems: true,
            createdAt: true,
            startedAt: true,
            completedAt: true,
            error: true
          }
        }),
        prisma.batchJob.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: total > parseInt(offset as string) + parseInt(limit as string)
          }
        },
      });
    } catch (error) {
      logger.error('List bulk jobs error:', error);
      res.status(500).json({
        error: 'Job listing failed',
        message: 'An error occurred while listing bulk jobs',
      });
    }
  };

  /**
   * Performance-Metriken für einen Bulk-Job abrufen
   */
  getBulkJobPerformance = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const organizationId = req.apiKey!.organizationId;

      // Überprüfe ob Job zur Organisation gehört
      const job = await prisma.batchJob.findFirst({
        where: {
          id: jobId,
          organizationId
        }
      });

      if (!job) {
        return res.status(404).json({
          error: 'Job not found',
          message: 'The specified batch job was not found or does not belong to your organization',
        });
      }

      const metrics = await this.bulkProcessingService.getJobPerformanceMetrics(jobId);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Get bulk job performance error:', error);
      res.status(500).json({
        error: 'Performance metrics retrieval failed',
        message: 'An error occurred while retrieving performance metrics',
      });
    }
  };

  /**
   * Bulk-Processing-Statistiken für Organisation abrufen
   */
  getBulkProcessingStats = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { days = 30 } = req.query;
      const organizationId = req.apiKey!.organizationId;

      const stats = await this.bulkProcessingService.getBulkProcessingStats(
        organizationId,
        parseInt(days as string)
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get bulk processing stats error:', error);
      res.status(500).json({
        error: 'Statistics retrieval failed',
        message: 'An error occurred while retrieving bulk processing statistics',
      });
    }
  };

  /**
   * Optimierte Bulk-Analyse mit erweiterten Optionen
   */
  optimizedBatchAnalyze = async (req: ApiKeyRequest, res: Response) => {
    try {
      const {
        documents,
        webhookUrl,
        priority = 'normal',
        maxRetries = 3,
        batchSize = 5,
        timeoutPerItem = 30
      } = req.body;
      const organizationId = req.apiKey!.organizationId;

      // Validiere Eingabeparameter
      if (!Array.isArray(documents) || documents.length === 0) {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'Documents array is required and must not be empty',
        });
      }

      if (documents.length > 1000) {
        return res.status(400).json({
          error: 'Batch too large',
          message: 'Maximum 1000 documents per batch allowed',
        });
      }

      // Konvertiere Dokumente in das erwartete Format
      const bulkItems = documents.map((doc: any) => ({
        id: doc.id,
        filename: doc.filename || `document_${doc.id}`,
        content: Buffer.from(doc.content, 'base64'),
        mimeType: doc.mimeType || 'application/pdf',
        documentType: doc.type,
        metadata: doc.metadata || {}
      }));

      // Starte optimierten Bulk-Job
      const jobId = await this.bulkProcessingService.startBulkJob({
        organizationId,
        type: 'document_analysis',
        items: bulkItems,
        webhookUrl,
        priority: priority as any,
        maxRetries,
        batchSize,
        timeoutPerItem
      });

      res.json({
        success: true,
        data: {
          batchJobId: jobId,
          status: 'pending',
          totalItems: documents.length,
          configuration: {
            priority,
            maxRetries,
            batchSize,
            timeoutPerItem
          },
          estimatedCompletionTime: new Date(Date.now() + documents.length * (timeoutPerItem / batchSize) * 1000),
          statusUrl: `/api/b2b/bulk/status/${jobId}`,
          performanceUrl: `/api/b2b/bulk/performance/${jobId}`
        },
      });
    } catch (error) {
      logger.error('Optimized batch analysis error:', error);
      res.status(500).json({
        error: 'Optimized batch analysis failed',
        message: 'An error occurred during optimized batch analysis setup',
      });
    }
  };

  /**
   * Create a new partnership
   */
  createPartnership = async (req: ApiKeyRequest, res: Response) => {
    try {
      const organizationId = req.apiKey!.organizationId;
      const {
        partnerName,
        partnerType,
        partnerId,
        integrationType,
        apiKey,
        config,
        contactEmail,
        contactPhone,
        notes
      } = req.body;

      const partnership = await this.partnershipService.createPartnership({
        organizationId,
        partnerName,
        partnerType,
        partnerId,
        integrationType,
        apiKey,
        config,
        contactEmail,
        contactPhone,
        notes
      });

      res.json({
        success: true,
        data: partnership
      });
    } catch (error) {
      logger.error('Failed to create partnership:', error);
      res.status(500).json({
        error: 'Failed to create partnership',
        message: 'An error occurred while creating the partnership'
      });
    }
  };

  /**
   * Get all partnerships for an organization
   */
  getPartnerships = async (req: ApiKeyRequest, res: Response) => {
    try {
      const organizationId = req.apiKey!.organizationId;
      
      const partnerships = await this.partnershipService.getPartnerships(organizationId);

      res.json({
        success: true,
        data: partnerships
      });
    } catch (error) {
      logger.error('Failed to get partnerships:', error);
      res.status(500).json({
        error: 'Failed to get partnerships',
        message: 'An error occurred while fetching partnerships'
      });
    }
  };

  /**
   * Get a specific partnership by ID
   */
  getPartnershipById = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const partnership = await this.partnershipService.getPartnershipById(id);
      
      if (!partnership) {
        return res.status(404).json({
          error: 'Partnership not found',
          message: 'The requested partnership could not be found'
        });
      }

      res.json({
        success: true,
        data: partnership
      });
    } catch (error) {
      logger.error('Failed to get partnership:', error);
      res.status(500).json({
        error: 'Failed to get partnership',
        message: 'An error occurred while fetching the partnership'
      });
    }
  };

  /**
   * Update a partnership
   */
  updatePartnership = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.organizationId;
      delete updateData.createdAt;
      
      const partnership = await this.partnershipService.updatePartnership(id, updateData);

      res.json({
        success: true,
        data: partnership
      });
    } catch (error) {
      logger.error('Failed to update partnership:', error);
      res.status(500).json({
        error: 'Failed to update partnership',
        message: 'An error occurred while updating the partnership'
      });
    }
  };

  /**
   * Delete a partnership
   */
  deletePartnership = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const partnership = await this.partnershipService.deletePartnership(id);

      res.json({
        success: true,
        data: partnership,
        message: 'Partnership successfully deleted'
      });
    } catch (error) {
      logger.error('Failed to delete partnership:', error);
      res.status(500).json({
        error: 'Failed to delete partnership',
        message: 'An error occurred while deleting the partnership'
      });
    }
  };

  /**
   * Get partnership interactions
   */
  getPartnershipInteractions = async (req: ApiKeyRequest, res: Response) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      // Verify the partnership belongs to the organization
      const partnership = await this.partnershipService.getPartnershipById(id);
      if (!partnership) {
        return res.status(404).json({
          error: 'Partnership not found',
          message: 'The requested partnership could not be found'
        });
      }
      
      const interactions = await this.partnershipService.getInteractions(id, limit);

      res.json({
        success: true,
        data: interactions
      });
    } catch (error) {
      logger.error('Failed to get partnership interactions:', error);
      res.status(500).json({
        error: 'Failed to get partnership interactions',
        message: 'An error occurred while fetching partnership interactions'
      });
    }
  };
}