import { PrismaClient, Document, DocumentStatus, DocumentType } from '@prisma/client';
import { logger } from '../utils/logger';
import { CacheService } from './CacheService';

interface DocumentWithDetails extends Document {
  user?: any;
  case?: any;
}

export class DocumentService {
  private prisma: PrismaClient;
  private cacheService: CacheService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cacheService = CacheService.getInstance();
  }

  /**
   * Holt ein Dokument anhand seiner ID (mit Caching)
   */
  async getDocumentById(id: string): Promise<DocumentWithDetails | null> {
    // Prüfe zuerst den Cache
    const cacheKey = `document:${id}`;
    const cachedDocument = this.cacheService.get<DocumentWithDetails>(cacheKey);
    
    if (cachedDocument !== undefined) {
      logger.debug(`Document ${id} found in cache`);
      return cachedDocument ?? null;
    }

    // Wenn nicht im Cache, hole aus der Datenbank
    try {
      const document = await this.prisma.document.findUnique({
        where: { id },
        include: {
          user: true,
          case: true
        }
      }) as DocumentWithDetails | null;

      // Speichere im Cache für zukünftige Anfragen
      if (document) {
        this.cacheService.set<DocumentWithDetails>(cacheKey, document);
      }

      return document;
    } catch (error) {
      logger.error(`Error fetching document ${id}:`, error);
      throw new Error('Failed to fetch document');
    }
  }

  /**
   * Erstellt ein neues Dokument
   */
  async createDocument(documentData: {
    userId: string;
    title: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    documentType: DocumentType;
    caseId?: string;
    description?: string;
  }): Promise<Document> {
    try {
      const document = await this.prisma.document.create({
        data: {
          userId: documentData.userId,
          title: documentData.title,
          fileName: documentData.fileName,
          originalName: documentData.originalName,
          mimeType: documentData.mimeType,
          size: documentData.size,
          documentType: documentData.documentType,
          caseId: documentData.caseId,
          description: documentData.description,
          status: 'PENDING'
        }
      });

      logger.info(`Created new document: ${document.id}`);
      return document;
    } catch (error) {
      logger.error('Error creating document:', error);
      throw new Error('Failed to create document');
    }
  }

  /**
   * Aktualisiert ein Dokument
   */
  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    try {
      // Filtere undefinierte Werte aus den Updates
      const filteredUpdates: any = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          filteredUpdates[key] = value;
        }
      }

      const document = await this.prisma.document.update({
        where: { id },
        data: filteredUpdates
      });

      // Lösche den Cache-Eintrag für dieses Dokument
      this.cacheService.del(`document:${id}`);

      logger.info(`Updated document: ${id}`);
      return document;
    } catch (error) {
      logger.error(`Error updating document ${id}:`, error);
      throw new Error('Failed to update document');
    }
  }

  /**
   * Holt alle Dokumente eines Benutzers mit Pagination
   */
  async getUserDocuments(
    userId: string, 
    page: number = 1, 
    pageSize: number = 20,
    documentType?: DocumentType,
    status?: DocumentStatus
  ): Promise<{ documents: Document[]; totalCount: number }> {
    try {
      // Begrenze die Seitengröße
      const limit = Math.min(pageSize, 100);
      const offset = (page - 1) * limit;

      // Erstelle Filterbedingungen
      const whereConditions: any = { userId };
      if (documentType) {
        whereConditions.documentType = documentType;
      }
      if (status) {
        whereConditions.status = status;
      }

      // Hole die Dokumente
      const documents = await this.prisma.document.findMany({
        where: whereConditions,
        skip: offset,
        take: limit,
        orderBy: {
          uploadedAt: 'desc'
        }
      });

      // Hole die Gesamtanzahl (ohne Pagination)
      const totalCount = await this.prisma.document.count({
        where: whereConditions
      });

      return { documents, totalCount };
    } catch (error) {
      logger.error(`Error fetching documents for user ${userId}:`, error);
      throw new Error('Failed to fetch documents');
    }
  }

  /**
   * Holt Dokumente mit komplexen Filtern
   */
  async getDocumentsWithFilters(filters: {
    userId?: string;
    caseId?: string;
    documentType?: DocumentType;
    status?: DocumentStatus;
    searchQuery?: string;
    fromDate?: Date;
    toDate?: Date;
  }, page: number = 1, pageSize: number = 20): Promise<{ documents: Document[]; totalCount: number }> {
    try {
      // Begrenze die Seitengröße
      const limit = Math.min(pageSize, 100);
      const offset = (page - 1) * limit;

      // Erstelle Filterbedingungen
      const whereConditions: any = {};

      if (filters.userId) {
        whereConditions.userId = filters.userId;
      }

      if (filters.caseId) {
        whereConditions.caseId = filters.caseId;
      }

      if (filters.documentType) {
        whereConditions.documentType = filters.documentType;
      }

      if (filters.status) {
        whereConditions.status = filters.status;
      }

      if (filters.searchQuery) {
        whereConditions.OR = [
          { title: { contains: filters.searchQuery, mode: 'insensitive' } },
          { description: { contains: filters.searchQuery, mode: 'insensitive' } }
        ];
      }

      if (filters.fromDate || filters.toDate) {
        whereConditions.uploadedAt = {};
        if (filters.fromDate) {
          whereConditions.uploadedAt.gte = filters.fromDate;
        }
        if (filters.toDate) {
          whereConditions.uploadedAt.lte = filters.toDate;
        }
      }

      // Hole die Dokumente
      const documents = await this.prisma.document.findMany({
        where: whereConditions,
        skip: offset,
        take: limit,
        orderBy: {
          uploadedAt: 'desc'
        }
      });

      // Hole die Gesamtanzahl (ohne Pagination)
      const totalCount = await this.prisma.document.count({
        where: whereConditions
      });

      return { documents, totalCount };
    } catch (error) {
      logger.error('Error fetching documents with filters:', error);
      throw new Error('Failed to fetch documents');
    }
  }

  /**
   * Löscht ein Dokument
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      await this.prisma.document.delete({
        where: { id }
      });

      // Lösche den Cache-Eintrag für dieses Dokument
      this.cacheService.del(`document:${id}`);

      logger.info(`Deleted document: ${id}`);
    } catch (error) {
      logger.error(`Error deleting document ${id}:`, error);
      throw new Error('Failed to delete document');
    }
  }

  /**
   * Setzt den Analysestatus eines Dokuments
   */
  async setDocumentAnalysisStatus(id: string, status: DocumentStatus, analysis?: any): Promise<Document> {
    try {
      const document = await this.prisma.document.update({
        where: { id },
        data: {
          status,
          analyzedAt: new Date(),
          analysis: analysis ? JSON.stringify(analysis) : undefined
        }
      });

      // Lösche den Cache-Eintrag für dieses Dokument
      this.cacheService.del(`document:${id}`);

      logger.info(`Updated document analysis status: ${id} -> ${status}`);
      return document;
    } catch (error) {
      logger.error(`Error updating document analysis status ${id}:`, error);
      throw new Error('Failed to update document analysis status');
    }
  }

  /**
   * Löscht den Cache für ein Dokument
   */
  clearDocumentCache(id: string): void {
    this.cacheService.del(`document:${id}`);
  }

  /**
   * Holt Cache-Statistiken
   */
  getCacheStats(): any {
    return this.cacheService.getStats();
  }
}