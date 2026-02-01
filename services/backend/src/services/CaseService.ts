import { PrismaClient, Case, CaseStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { CacheService } from './CacheService';

interface CaseWithDetails extends Case {
  user?: any;
  documents?: any[];
  messages?: any[];
}

export class CaseService {
  private prisma: PrismaClient;
  private cacheService: CacheService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cacheService = CacheService.getInstance();
  }

  /**
   * Holt einen Fall anhand seiner ID (mit Caching)
   */
  async getCaseById(id: string): Promise<CaseWithDetails | null> {
    // Prüfe zuerst den Cache
    const cacheKey = `case:${id}`;
    const cachedCase = this.cacheService.get<CaseWithDetails>(cacheKey);
    
    if (cachedCase !== undefined) {
      logger.debug(`Case ${id} found in cache`);
      return cachedCase ?? null;
    }

    // Wenn nicht im Cache, hole aus der Datenbank
    try {
      const caseData = await this.prisma.case.findUnique({
        where: { id },
        include: {
          user: true,
          documents: true,
          messages: true
        }
      }) as CaseWithDetails | null;

      // Speichere im Cache für zukünftige Anfragen
      if (caseData) {
        this.cacheService.set<CaseWithDetails>(cacheKey, caseData);
      }

      return caseData;
    } catch (error) {
      logger.error(`Error fetching case ${id}:`, error);
      throw new Error('Failed to fetch case');
    }
  }

  /**
   * Erstellt einen neuen Fall
   */
  async createCase(caseData: {
    userId: string;
    title: string;
    description?: string;
    status?: CaseStatus;
    priority?: string;
    category?: string;
  }): Promise<Case> {
    try {
      const newCase = await this.prisma.case.create({
        data: {
          userId: caseData.userId,
          title: caseData.title,
          description: caseData.description,
          status: caseData.status || 'OPEN',
          priority: caseData.priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(caseData.priority) 
            ? caseData.priority as any 
            : 'MEDIUM',
          category: caseData.category
        }
      });

      logger.info(`Created new case: ${newCase.id}`);
      return newCase;
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
        data: updates
      });

      // Lösche den Cache-Eintrag für diesen Fall
      this.cacheService.del(`case:${id}`);

      logger.info(`Updated case: ${id}`);
      return updatedCase;
    } catch (error) {
      logger.error(`Error updating case ${id}:`, error);
      throw new Error('Failed to update case');
    }
  }

  /**
   * Holt alle Fälle eines Benutzers mit Pagination
   */
  async getUserCases(
    userId: string, 
    page: number = 1, 
    pageSize: number = 20,
    status?: CaseStatus
  ): Promise<{ cases: Case[]; totalCount: number }> {
    try {
      // Begrenze die Seitengröße
      const limit = Math.min(pageSize, 100);
      const offset = (page - 1) * limit;

      // Erstelle Filterbedingungen
      const whereConditions: any = { userId };
      if (status) {
        whereConditions.status = status;
      }

      // Hole die Fälle
      const cases = await this.prisma.case.findMany({
        where: whereConditions,
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Hole die Gesamtanzahl (ohne Pagination)
      const totalCount = await this.prisma.case.count({
        where: whereConditions
      });

      return { cases, totalCount };
    } catch (error) {
      logger.error(`Error fetching cases for user ${userId}:`, error);
      throw new Error('Failed to fetch cases');
    }
  }

  /**
   * Holt Fälle mit komplexen Filtern
   */
  async getCasesWithFilters(filters: {
    userId?: string;
    status?: CaseStatus;
    priority?: string;
    category?: string;
    searchQuery?: string;
    fromDate?: Date;
    toDate?: Date;
  }, page: number = 1, pageSize: number = 20): Promise<{ cases: Case[]; totalCount: number }> {
    try {
      // Begrenze die Seitengröße
      const limit = Math.min(pageSize, 100);
      const offset = (page - 1) * limit;

      // Erstelle Filterbedingungen
      const whereConditions: any = {};

      if (filters.userId) {
        whereConditions.userId = filters.userId;
      }

      if (filters.status) {
        whereConditions.status = filters.status;
      }

      if (filters.priority) {
        whereConditions.priority = filters.priority;
      }

      if (filters.category) {
        whereConditions.category = filters.category;
      }

      if (filters.searchQuery) {
        whereConditions.OR = [
          { title: { contains: filters.searchQuery, mode: 'insensitive' } },
          { description: { contains: filters.searchQuery, mode: 'insensitive' } }
        ];
      }

      if (filters.fromDate || filters.toDate) {
        whereConditions.createdAt = {};
        if (filters.fromDate) {
          whereConditions.createdAt.gte = filters.fromDate;
        }
        if (filters.toDate) {
          whereConditions.createdAt.lte = filters.toDate;
        }
      }

      // Hole die Fälle
      const cases = await this.prisma.case.findMany({
        where: whereConditions,
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Hole die Gesamtanzahl (ohne Pagination)
      const totalCount = await this.prisma.case.count({
        where: whereConditions
      });

      return { cases, totalCount };
    } catch (error) {
      logger.error('Error fetching cases with filters:', error);
      throw new Error('Failed to fetch cases');
    }
  }

  /**
   * Löscht einen Fall
   */
  async deleteCase(id: string): Promise<void> {
    try {
      await this.prisma.case.delete({
        where: { id }
      });

      // Lösche den Cache-Eintrag für diesen Fall
      this.cacheService.del(`case:${id}`);

      logger.info(`Deleted case: ${id}`);
    } catch (error) {
      logger.error(`Error deleting case ${id}:`, error);
      throw new Error('Failed to delete case');
    }
  }

  /**
   * Schließt einen Fall
   */
  async closeCase(id: string): Promise<Case> {
    try {
      const closedCase = await this.prisma.case.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date()
        }
      });

      // Lösche den Cache-Eintrag für diesen Fall
      this.cacheService.del(`case:${id}`);

      logger.info(`Closed case: ${id}`);
      return closedCase;
    } catch (error) {
      logger.error(`Error closing case ${id}:`, error);
      throw new Error('Failed to close case');
    }
  }

  /**
   * Löscht den Cache für einen Fall
   */
  clearCaseCache(id: string): void {
    this.cacheService.del(`case:${id}`);
  }

  /**
   * Holt Cache-Statistiken
   */
  getCacheStats(): any {
    return this.cacheService.getStats();
  }
}