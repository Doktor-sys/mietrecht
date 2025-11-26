import { PrismaClient } from '@prisma/client';
import { DocumentAnalysisService } from './DocumentAnalysisService';
import { AIResponseGenerator } from './AIResponseGenerator';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';
import * as uuid from 'uuid';

const prisma = new PrismaClient();

export interface BulkJobOptions {
  organizationId: string;
  type: 'document_analysis' | 'chat_bulk' | 'template_generation';
  items: any[];
  metadata?: any;
  webhookUrl?: string;
  priority?: 'low' | 'normal' | 'high';
  maxRetries?: number;
  retryDelay?: number; // seconds
  batchSize?: number; // items to process in parallel
  timeoutPerItem?: number; // seconds
}

export interface BulkJobProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // in seconds
  results?: any[];
  errors?: any[];
  performance?: {
    startedAt?: Date;
    averageProcessingTime?: number; // seconds per item
    throughput?: number; // items per minute
    peakMemoryUsage?: number; // MB
    currentMemoryUsage?: number; // MB
  };
  retryInfo?: {
    maxRetries: number;
    currentRetries: number;
    retryableErrors: number;
  };
}

export interface DocumentBulkAnalysisItem {
  id: string;
  filename: string;
  content: Buffer;
  mimeType: string;
  documentType: string;
  metadata?: any;
}

export interface ChatBulkQueryItem {
  id: string;
  query: string;
  context?: any;
  sessionId?: string;
}

export class BulkProcessingService extends EventEmitter {
  private documentAnalysisService: DocumentAnalysisService;
  private aiResponseGenerator: AIResponseGenerator;
  private activeJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.documentAnalysisService = new DocumentAnalysisService(prisma);
    this.aiResponseGenerator = new AIResponseGenerator(prisma);
  }

  /**
   * Startet einen neuen Bulk-Job
   */
  async startBulkJob(options: BulkJobOptions): Promise<string> {
    try {
      const jobId = uuid.v4();

      // Erstelle Batch-Job in der Datenbank
      // Temporäre Lösung: Verwende generischen Prisma-Aufruf bis die Datenbank aktualisiert ist
      const batchJob = await (prisma as any).batchJob.create({
        data: {
          id: jobId,
          organizationId: options.organizationId,
          type: options.type,
          status: 'pending',
          totalItems: options.items.length,
          processedItems: 0,
          metadata: {
            ...options.metadata,
            webhookUrl: options.webhookUrl,
            items: options.items.map(item => ({ id: item.id, status: 'pending' }))
          }
        }
      });

      // Starte asynchrone Verarbeitung
      this.processJobAsync(jobId, options);

      logger.info(`Bulk job ${jobId} started with ${options.items.length} items`);
      return jobId;

    } catch (error) {
      logger.error('Error starting bulk job:', error);
      throw new Error('Failed to start bulk job');
    }
  }

  /**
   * Ruft den Status eines Bulk-Jobs ab
   */
  async getBulkJobStatus(jobId: string): Promise<BulkJobProgress | null> {
    try {
      const job = await (prisma as any).batchJob.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        return null;
      }

      const metadata = job.metadata as any;
      const results = metadata?.results || [];
      const errors = metadata?.errors || [];
      const performance = metadata?.performance || {};
      const retryInfo = metadata?.retryInfo || {};

      const progress: BulkJobProgress = {
        jobId: job.id,
        status: job.status as any,
        totalItems: job.totalItems,
        processedItems: job.processedItems,
        successfulItems: results.length,
        failedItems: errors.length,
        progress: job.totalItems > 0 ? Math.round((job.processedItems / job.totalItems) * 100) : 0,
        results: results,
        errors: errors,
        performance: {
          startedAt: performance.startedAt ? new Date(performance.startedAt) : undefined,
          averageProcessingTime: performance.averageProcessingTime,
          throughput: performance.throughput,
          peakMemoryUsage: performance.peakMemoryUsage,
          currentMemoryUsage: performance.currentMemoryUsage
        },
        retryInfo: {
          maxRetries: retryInfo.maxRetries || 0,
          currentRetries: retryInfo.currentRetries || 0,
          retryableErrors: retryInfo.retryableErrors || 0
        }
      };

      // Schätze verbleibende Zeit basierend auf bisheriger Performance
      if (job.status === 'processing' && job.startedAt && job.processedItems > 0) {
        const elapsedTime = (Date.now() - job.startedAt.getTime()) / 1000;
        const avgTimePerItem = performance.averageProcessingTime || (elapsedTime / job.processedItems);
        const remainingItems = job.totalItems - job.processedItems;
        progress.estimatedTimeRemaining = Math.round(remainingItems * avgTimePerItem);
      }

      return progress;

    } catch (error) {
      logger.error('Error getting bulk job status:', error);
      throw new Error('Failed to get job status');
    }
  }

  /**
   * Bricht einen laufenden Bulk-Job ab
   */
  async cancelBulkJob(jobId: string): Promise<boolean> {
    try {
      // Stoppe aktive Verarbeitung
      const timeout = this.activeJobs.get(jobId);
      if (timeout) {
        clearTimeout(timeout);
        this.activeJobs.delete(jobId);
      }

      // Aktualisiere Job-Status
      await (prisma as any).batchJob.update({
        where: { id: jobId },
        data: {
          status: 'cancelled',
          completedAt: new Date()
        }
      });

      logger.info(`Bulk job ${jobId} cancelled`);
      return true;

    } catch (error) {
      logger.error('Error cancelling bulk job:', error);
      return false;
    }
  }

  /**
   * Löscht abgeschlossene Bulk-Jobs (Cleanup)
   */
  async cleanupCompletedJobs(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await (prisma as any).batchJob.deleteMany({
        where: {
          status: { in: ['completed', 'failed', 'cancelled'] },
          completedAt: { lt: cutoffDate }
        }
      });

      logger.info(`Cleaned up ${result.count} old bulk jobs`);
      return result.count;

    } catch (error) {
      logger.error('Error cleaning up jobs:', error);
      return 0;
    }
  }

  /**
   * Private Methode für asynchrone Job-Verarbeitung
   */
  private async processJobAsync(jobId: string, options: BulkJobOptions): Promise<void> {
    const startTime = Date.now();
    let peakMemoryUsage = 0;
    
    try {
      // Markiere Job als "processing"
      await (prisma as any).batchJob.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          startedAt: new Date()
        }
      });

      let results: any[] = [];
      let errors: any[] = [];
      let processedCount = 0;
      let retryCount = 0;
      const maxRetries = options.maxRetries || 3;
      const batchSize = options.batchSize || 5;
      const timeoutPerItem = (options.timeoutPerItem || 30) * 1000; // Convert to ms

      // Verarbeite Items in Batches für bessere Performance
      const itemBatches = this.chunkArray(options.items, batchSize);

      for (const batch of itemBatches) {
        const batchPromises = batch.map(async (item) => {
          let attempts = 0;
          let lastError: Error | null = null;

          while (attempts <= maxRetries) {
            try {
              const result = await Promise.race([
                this.processItemWithType(item, options.type, options.organizationId),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Item processing timeout')), timeoutPerItem)
                )
              ]);

              return { id: item.id, result, success: true };

            } catch (itemError) {
              lastError = itemError instanceof Error ? itemError : new Error('Unknown error');
              attempts++;

              if (attempts <= maxRetries && this.isRetryableError(lastError)) {
                logger.warn(`Retrying item ${item.id}, attempt ${attempts}/${maxRetries}:`, lastError.message);
                retryCount++;
                
                // Exponential backoff
                const delay = (options.retryDelay || 1) * Math.pow(2, attempts - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                break;
              }
            }
          }

          return { 
            id: item.id, 
            error: lastError?.message || 'Unknown error', 
            success: false,
            attempts 
          };
        });

        // Warte auf Batch-Completion
        const batchResults = await Promise.all(batchPromises);

        // Verarbeite Batch-Ergebnisse
        for (const batchResult of batchResults) {
          if (batchResult.success) {
            results.push({ id: batchResult.id, result: batchResult.result });
          } else {
            errors.push({
              id: batchResult.id,
              error: batchResult.error,
              attempts: batchResult.attempts
            });
          }
          processedCount++;
        }

        // Monitor Memory Usage
        const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
        peakMemoryUsage = Math.max(peakMemoryUsage, currentMemory);

        // Aktualisiere Progress mit Performance-Metriken
        await this.updateJobProgressWithMetrics(
          jobId, 
          processedCount, 
          results, 
          errors, 
          startTime, 
          peakMemoryUsage,
          retryCount,
          maxRetries
        );

        // Kurze Pause zwischen Batches
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Markiere Job als abgeschlossen
      await (prisma as any).batchJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          processedItems: processedCount,
          metadata: {
            ...options.metadata,
            results,
            errors,
            summary: {
              total: options.items.length,
              successful: results.length,
              failed: errors.length,
              successRate: Math.round((results.length / options.items.length) * 100)
            }
          }
        }
      });

      // Sende Webhook-Benachrichtigung falls konfiguriert
      if (options.webhookUrl) {
        await this.sendWebhookNotification(options.webhookUrl, {
          jobId,
          status: 'completed',
          summary: {
            total: options.items.length,
            successful: results.length,
            failed: errors.length
          }
        });
      }

      logger.info(`Bulk job ${jobId} completed: ${results.length}/${options.items.length} successful`);

    } catch (error) {
      logger.error(`Bulk job ${jobId} failed:`, error);

      await (prisma as any).batchJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      // Sende Fehler-Webhook
      if (options.webhookUrl) {
        await this.sendWebhookNotification(options.webhookUrl, {
          jobId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Verarbeitet ein einzelnes Dokument für Bulk-Analyse
   */
  private async processDocumentAnalysis(
    item: DocumentBulkAnalysisItem,
    organizationId: string
  ): Promise<any> {
    // Erstelle Dokument-Eintrag
    // Temporäre Lösung: Verwende generischen Aufruf für organizationId bis die Datenbank aktualisiert ist
    const document = await (prisma as any).document.create({
      data: {
        id: uuid.v4(),
        filename: item.filename,
        originalName: item.filename,
        mimeType: item.mimeType,
        size: item.content.length,
        documentType: item.documentType as any,
        organizationId,
        metadata: item.metadata,
        uploadedAt: new Date()
      }
    });

    // Analysiere Dokument
    const analysis = await this.documentAnalysisService.analyzeDocument(document.id);

    // Die Analyse-Ergebnisse werden bereits vom DocumentAnalysisService gespeichert
    // Keine zusätzliche Speicherung erforderlich

    return {
      documentId: document.id,
      riskLevel: analysis.riskLevel,
      confidence: analysis.confidence,
      issueCount: Array.isArray(analysis.issues) ? analysis.issues.length : 0,
      recommendationCount: Array.isArray(analysis.recommendations) ? analysis.recommendations.length : 0
    };
  }

  /**
   * Verarbeitet eine Chat-Anfrage für Bulk-Verarbeitung
   */
  private async processChatQuery(
    item: ChatBulkQueryItem,
    organizationId: string
  ): Promise<any> {
    // Erstelle ein Mock-ClassificationResult für die generateResponse Methode
    const mockClassification = {
      classification: {
        category: 'OTHER' as any,
        subCategory: 'general_inquiry',
        confidence: 0.8,
        riskLevel: 'low' as any,
        escalationRecommended: false,
        estimatedComplexity: 'simple' as any
      },
      intent: {
        intent: 'information_request',
        category: 'OTHER' as any,
        confidence: 0.8,
        entities: []
      },
      context: {
        facts: [],
        legalIssues: [],
        urgency: 'low' as any,
        estimatedValue: undefined
      },
      recommendations: ['Provide general information']
    };

    const response = await this.aiResponseGenerator.generateResponse(
      mockClassification,
      item.query,
      item.context ? JSON.stringify(item.context) : undefined
    );

    // Logge Chat-Interaktion
    await (prisma as any).chatInteraction.create({
      data: {
        organizationId,
        sessionId: item.sessionId || uuid.v4(),
        query: item.query,
        response: response.message,
        confidence: response.confidence,
        legalReferences: response.legalReferences || []
      }
    });

    return {
      response: response.message,
      confidence: response.confidence,
      legalReferences: response.legalReferences,
      escalationRecommended: response.escalationRecommended
    };
  }

  /**
   * Verarbeitet Template-Generierung für Bulk-Verarbeitung
   */
  private async processTemplateGeneration(
    item: any,
    organizationId: string
  ): Promise<any> {
    // Hier würde die Template-Generierung implementiert werden
    // Placeholder für jetzt
    return {
      templateType: item.templateType,
      generated: true,
      content: `Generated template for ${item.templateType}`
    };
  }

  /**
   * Aktualisiert den Job-Progress in der Datenbank
   */
  private async updateJobProgress(
    jobId: string,
    processedItems: number,
    results: any[],
    errors: any[]
  ): Promise<void> {
    await (prisma as any).batchJob.update({
      where: { id: jobId },
      data: {
        processedItems,
        metadata: {
          results,
          errors,
          lastUpdated: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Sendet Webhook-Benachrichtigung
   */
  private async sendWebhookNotification(webhookUrl: string, payload: any): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SmartLaw-BulkProcessor/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        logger.warn(`Webhook notification failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      logger.error('Error sending webhook notification:', error);
    }
  }

  /**
   * Verarbeitet ein Item basierend auf dem Job-Typ
   */
  private async processItemWithType(item: any, type: string, organizationId: string): Promise<any> {
    switch (type) {
      case 'document_analysis':
        return await this.processDocumentAnalysis(item as DocumentBulkAnalysisItem, organizationId);
      case 'chat_bulk':
        return await this.processChatQuery(item as ChatBulkQueryItem, organizationId);
      case 'template_generation':
        return await this.processTemplateGeneration(item, organizationId);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  /**
   * Teilt Array in Chunks für Batch-Verarbeitung
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Prüft ob ein Fehler retry-fähig ist
   */
  private isRetryableError(error: Error): boolean {
    const retryableMessages = [
      'timeout',
      'network',
      'connection',
      'temporary',
      'rate limit',
      'service unavailable'
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Aktualisiert Job-Progress mit erweiterten Metriken
   */
  private async updateJobProgressWithMetrics(
    jobId: string,
    processedItems: number,
    results: any[],
    errors: any[],
    startTime: number,
    peakMemoryUsage: number,
    retryCount: number,
    maxRetries: number
  ): Promise<void> {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000; // seconds
    const averageProcessingTime = processedItems > 0 ? elapsedTime / processedItems : 0;
    const throughput = processedItems > 0 ? (processedItems / elapsedTime) * 60 : 0; // items per minute
    const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    await (prisma as any).batchJob.update({
      where: { id: jobId },
      data: {
        processedItems,
        metadata: {
          results,
          errors,
          lastUpdated: new Date().toISOString(),
          performance: {
            startedAt: new Date(startTime),
            averageProcessingTime,
            throughput,
            peakMemoryUsage,
            currentMemoryUsage: currentMemory
          },
          retryInfo: {
            maxRetries,
            currentRetries: retryCount,
            retryableErrors: errors.filter(e => e.attempts && e.attempts > 1).length
          }
        }
      }
    });
  }

  /**
   * Ruft detaillierte Performance-Metriken für einen Job ab
   */
  async getJobPerformanceMetrics(jobId: string): Promise<any> {
    try {
      const job = await (prisma as any).batchJob.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        return null;
      }

      const metadata = job.metadata as any;
      const performance = metadata?.performance || {};
      const retryInfo = metadata?.retryInfo || {};

      return {
        jobId: job.id,
        type: job.type,
        status: job.status,
        duration: job.completedAt && job.startedAt ? 
          (job.completedAt.getTime() - job.startedAt.getTime()) / 1000 : null,
        performance: {
          averageProcessingTime: performance.averageProcessingTime || 0,
          throughput: performance.throughput || 0,
          peakMemoryUsage: performance.peakMemoryUsage || 0,
          currentMemoryUsage: performance.currentMemoryUsage || 0
        },
        reliability: {
          successRate: job.totalItems > 0 ? 
            ((job.totalItems - (metadata?.errors?.length || 0)) / job.totalItems) * 100 : 0,
          retryRate: retryInfo.currentRetries && job.totalItems ? 
            (retryInfo.currentRetries / job.totalItems) * 100 : 0,
          errorRate: job.totalItems > 0 ? 
            ((metadata?.errors?.length || 0) / job.totalItems) * 100 : 0
        },
        retryInfo
      };
    } catch (error) {
      logger.error('Error getting job performance metrics:', error);
      throw new Error('Failed to get performance metrics');
    }
  }

  /**
   * Ruft Bulk-Processing-Statistiken für eine Organisation ab
   */
  async getBulkProcessingStats(organizationId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const jobs = await (prisma as any).batchJob.findMany({
        where: {
          organizationId,
          createdAt: { gte: startDate }
        }
      });

      const totalJobs = jobs.length;
      const completedJobs = jobs.filter((job: any) => job.status === 'completed').length;
      const failedJobs = jobs.filter((job: any) => job.status === 'failed').length;
      const totalItems = jobs.reduce((sum: number, job: any) => sum + job.totalItems, 0);
      const totalProcessed = jobs.reduce((sum: number, job: any) => sum + job.processedItems, 0);

      // Berechne durchschnittliche Performance-Metriken
      const completedJobsWithMetrics = jobs.filter((job: any) => 
        job.status === 'completed' && job.metadata?.performance
      );

      const avgThroughput = completedJobsWithMetrics.length > 0 ?
        completedJobsWithMetrics.reduce((sum: number, job: any) => 
          sum + (job.metadata.performance.throughput || 0), 0
        ) / completedJobsWithMetrics.length : 0;

      const avgProcessingTime = completedJobsWithMetrics.length > 0 ?
        completedJobsWithMetrics.reduce((sum: number, job: any) => 
          sum + (job.metadata.performance.averageProcessingTime || 0), 0
        ) / completedJobsWithMetrics.length : 0;

      return {
        period: { days, startDate, endDate: new Date() },
        summary: {
          totalJobs,
          completedJobs,
          failedJobs,
          successRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
          totalItems,
          totalProcessed,
          processingRate: totalItems > 0 ? (totalProcessed / totalItems) * 100 : 0
        },
        performance: {
          averageThroughput: avgThroughput,
          averageProcessingTime: avgProcessingTime,
          peakThroughput: Math.max(...completedJobsWithMetrics.map((job: any) => 
            job.metadata?.performance?.throughput || 0
          ))
        },
        trends: await this.calculateBulkProcessingTrends(organizationId, startDate)
      };
    } catch (error) {
      logger.error('Error getting bulk processing stats:', error);
      throw new Error('Failed to get bulk processing statistics');
    }
  }

  /**
   * Berechnet Trends für Bulk-Processing
   */
  private async calculateBulkProcessingTrends(organizationId: string, startDate: Date): Promise<any[]> {
    // Vereinfachte Trend-Berechnung - gruppiert nach Tagen
    const jobs = await (prisma as any).batchJob.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    });

    const trendMap = new Map<string, any>();

    jobs.forEach((job: any) => {
      const date = job.createdAt.toISOString().split('T')[0];
      
      if (!trendMap.has(date)) {
        trendMap.set(date, {
          date,
          jobs: 0,
          items: 0,
          completed: 0,
          failed: 0
        });
      }

      const trend = trendMap.get(date);
      trend.jobs++;
      trend.items += job.totalItems;
      
      if (job.status === 'completed') trend.completed++;
      if (job.status === 'failed') trend.failed++;
    });

    return Array.from(trendMap.values());
  }
}