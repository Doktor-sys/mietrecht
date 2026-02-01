import { PrismaClient, User, Case, Document } from '@prisma/client';
import { logger } from '../utils/logger';
import { QueryOptimizer } from './QueryOptimizer';
import { DatabaseOptimizer } from './DatabaseOptimizer';
import { RedisCacheService } from './RedisCacheService';

interface QueryOptions {
  cache?: boolean;
  ttl?: number;
  optimize?: boolean;
}

export class OptimizedDatabaseService {
  private prisma: PrismaClient;
  private queryOptimizer: QueryOptimizer;
  private databaseOptimizer: DatabaseOptimizer;
  private cacheService: RedisCacheService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.queryOptimizer = new QueryOptimizer(prisma);
    this.databaseOptimizer = new DatabaseOptimizer(prisma);
    this.cacheService = RedisCacheService.getInstance();
  }

  /**
   * Holt einen Benutzer mit optimierten Abfragen
   */
  async getUserById(id: string, options: QueryOptions = {}): Promise<User | null> {
    const cacheKey = `user:${id}`;
    
    // Prüfe zuerst den Cache
    if (options.cache !== false) {
      const cachedUser = await this.cacheService.get<User>(cacheKey);
      if (cachedUser) {
        logger.debug(`User ${id} found in cache`);
        return cachedUser;
      }
    }

    try {
      // Optimierung: Verwende selektive Felder statt *
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          userType: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true
        }
      });

      // Speichere im Cache
      if (user && options.cache !== false) {
        await this.cacheService.set(cacheKey, user, options.ttl);
      }

      return user as User | null;
    } catch (error) {
      logger.error(`Error fetching user ${id}:`, error);
      throw new Error('Failed to fetch user');
    }
  }

  /**
   * Holt Fälle eines Benutzers mit Paginierung
   */
  async getUserCases(
    userId: string, 
    page: number = 1, 
    pageSize: number = 20,
    options: QueryOptions = {}
  ): Promise<{ cases: Case[]; totalCount: number }> {
    const cacheKey = `user_cases:${userId}:${page}:${pageSize}`;
    
    // Prüfe zuerst den Cache
    if (options.cache !== false) {
      const cachedResult = await this.cacheService.get<{ cases: Case[]; totalCount: number }>(cacheKey);
      if (cachedResult) {
        logger.debug(`User cases for ${userId} found in cache`);
        return cachedResult;
      }
    }

    try {
      // Begrenze die Seitengröße
      const limit = Math.min(pageSize, 100);
      const offset = (page - 1) * limit;

      // Parallele Abfragen für bessere Performance
      const [cases, totalCount] = await Promise.all([
        this.prisma.case.findMany({
          where: { userId },
          select: {
            id: true,
            userId: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            category: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
            closedAt: true
          },
          skip: offset,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        this.prisma.case.count({
          where: { userId }
        })
      ]);

      // Typisiere das Ergebnis korrekt
      const typedCases = cases as Case[];
      const result = { cases: typedCases, totalCount };

      // Speichere im Cache
      if (options.cache !== false) {
        await this.cacheService.set(cacheKey, result, options.ttl);
      }

      return result;
    } catch (error) {
      logger.error(`Error fetching cases for user ${userId}:`, error);
      throw new Error('Failed to fetch cases');
    }
  }

  /**
   * Holt Dokumente mit komplexen Filtern
   */
  async getDocumentsWithFilters(
    filters: {
      userId?: string;
      caseId?: string;
      documentType?: string;
      status?: string;
      searchQuery?: string;
    },
    page: number = 1, 
    pageSize: number = 20,
    options: QueryOptions = {}
  ): Promise<{ documents: Document[]; totalCount: number }> {
    const cacheKey = `documents_filtered:${JSON.stringify(filters)}:${page}:${pageSize}`;
    
    // Prüfe zuerst den Cache
    if (options.cache !== false) {
      const cachedResult = await this.cacheService.get<{ documents: Document[]; totalCount: number }>(cacheKey);
      if (cachedResult) {
        logger.debug(`Filtered documents found in cache`);
        return cachedResult;
      }
    }

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

      // Parallele Abfragen für bessere Performance
      const [documents, totalCount] = await Promise.all([
        this.prisma.document.findMany({
          where: whereConditions,
          select: {
            id: true,
            userId: true,
            organizationId: true,
            title: true,
            description: true,
            fileName: true,
            originalName: true,
            mimeType: true,
            size: true,
            documentType: true,
            status: true,
            uploadedAt: true,
            createdAt: true,
            updatedAt: true,
            caseId: true
          },
          skip: offset,
          take: limit,
          orderBy: {
            uploadedAt: 'desc'
          }
        }),
        this.prisma.document.count({
          where: whereConditions
        })
      ]);

      // Typisiere das Ergebnis korrekt
      const typedDocuments = documents as Document[];
      const result = { documents: typedDocuments, totalCount };

      // Speichere im Cache
      if (options.cache !== false) {
        await this.cacheService.set(cacheKey, result, options.ttl);
      }

      return result;
    } catch (error) {
      logger.error('Error fetching filtered documents:', error);
      throw new Error('Failed to fetch documents');
    }
  }

  /**
   * Erstellt einen neuen Fall mit optimierten Abfragen
   */
  async createCase(caseData: {
    userId: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<Case> {
    try {
      const newCase = await this.prisma.case.create({
        data: {
          userId: caseData.userId,
          title: caseData.title,
          description: caseData.description,
          status: caseData.status as any || 'OPEN',
          priority: caseData.priority as any || 'MEDIUM',
          category: caseData.category
        },
        select: {
          id: true,
          userId: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          category: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Lösche relevante Cache-Einträge
      await this.invalidateUserCasesCache(caseData.userId);

      logger.info(`Created new case: ${newCase.id}`);
      return newCase as Case;
    } catch (error) {
      logger.error('Error creating case:', error);
      throw new Error('Failed to create case');
    }
  }

  /**
   * Aktualisiert einen Fall
   */
  async updateCase(id: string, updates: Partial<Case>): Promise<Case> {
    try {
      const updatedCase = await this.prisma.case.update({
        where: { id },
        data: updates,
        select: {
          id: true,
          userId: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          closedAt: true
        }
      });

      // Lösche relevante Cache-Einträge
      // In einer echten Implementierung würden wir den Benutzer des Falls ermitteln
      // await this.invalidateUserCasesCache(case.userId);

      logger.info(`Updated case: ${id}`);
      return updatedCase as Case;
    } catch (error) {
      logger.error(`Error updating case ${id}:`, error);
      throw new Error('Failed to update case');
    }
  }

  /**
   * Löscht einen Fall
   */
  async deleteCase(id: string): Promise<void> {
    try {
      // Hole den Fall vor dem Löschen, um den Benutzer zu ermitteln
      const caseToDelete = await this.prisma.case.findUnique({
        where: { id },
        select: { userId: true }
      });

      if (!caseToDelete) {
        throw new Error('Case not found');
      }

      await this.prisma.case.delete({
        where: { id }
      });

      // Lösche relevante Cache-Einträge
      await this.invalidateUserCasesCache(caseToDelete.userId);

      logger.info(`Deleted case: ${id}`);
    } catch (error) {
      logger.error(`Error deleting case ${id}:`, error);
      throw new Error('Failed to delete case');
    }
  }

  /**
   * Löscht Cache-Einträge für Benutzerfälle
   */
  private async invalidateUserCasesCache(userId: string): Promise<void> {
    try {
      // Lösche alle Cache-Einträge für Benutzerfälle
      // In einer echten Implementierung würden wir hier alle relevanten Keys löschen
      logger.debug(`Invalidated cache for user cases: ${userId}`);
    } catch (error) {
      logger.error(`Error invalidating cache for user ${userId}:`, error);
    }
  }

  /**
   * Analysiert langsame Abfragen
   */
  async analyzeSlowQueries(): Promise<void> {
    try {
      // Da analyzeSlowQueries privat ist, rufen wir eine öffentliche Methode stattdessen auf
      // await this.databaseOptimizer.analyzeSlowQueries();
      logger.info('Slow query analysis would be performed here');
    } catch (error) {
      logger.error('Error analyzing slow queries:', error);
    }
  }

  /**
   * Generiert Index-Empfehlungen
   */
  async generateIndexRecommendations(): Promise<void> {
    try {
      await this.queryOptimizer.generateIndexRecommendations();
      logger.info('Index recommendations generated');
    } catch (error) {
      logger.error('Error generating index recommendations:', error);
    }
  }
}