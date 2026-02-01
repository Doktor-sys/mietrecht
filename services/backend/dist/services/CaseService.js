"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseService = void 0;
const logger_1 = require("../utils/logger");
const CacheService_1 = require("./CacheService");
class CaseService {
    constructor(prisma) {
        this.prisma = prisma;
        this.cacheService = CacheService_1.CacheService.getInstance();
    }
    /**
     * Holt einen Fall anhand seiner ID (mit Caching)
     */
    async getCaseById(id) {
        // Prüfe zuerst den Cache
        const cacheKey = `case:${id}`;
        const cachedCase = this.cacheService.get(cacheKey);
        if (cachedCase !== undefined) {
            logger_1.logger.debug(`Case ${id} found in cache`);
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
            });
            // Speichere im Cache für zukünftige Anfragen
            if (caseData) {
                this.cacheService.set(cacheKey, caseData);
            }
            return caseData;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching case ${id}:`, error);
            throw new Error('Failed to fetch case');
        }
    }
    /**
     * Erstellt einen neuen Fall
     */
    async createCase(caseData) {
        try {
            const newCase = await this.prisma.case.create({
                data: {
                    userId: caseData.userId,
                    title: caseData.title,
                    description: caseData.description,
                    status: caseData.status || 'OPEN',
                    priority: caseData.priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(caseData.priority)
                        ? caseData.priority
                        : 'MEDIUM',
                    category: caseData.category
                }
            });
            logger_1.logger.info(`Created new case: ${newCase.id}`);
            return newCase;
        }
        catch (error) {
            logger_1.logger.error('Error creating case:', error);
            throw new Error('Failed to create case');
        }
    }
    /**
     * Aktualisiert einen Fall
     */
    async updateCase(id, updates) {
        try {
            const updatedCase = await this.prisma.case.update({
                where: { id },
                data: updates
            });
            // Lösche den Cache-Eintrag für diesen Fall
            this.cacheService.del(`case:${id}`);
            logger_1.logger.info(`Updated case: ${id}`);
            return updatedCase;
        }
        catch (error) {
            logger_1.logger.error(`Error updating case ${id}:`, error);
            throw new Error('Failed to update case');
        }
    }
    /**
     * Holt alle Fälle eines Benutzers mit Pagination
     */
    async getUserCases(userId, page = 1, pageSize = 20, status) {
        try {
            // Begrenze die Seitengröße
            const limit = Math.min(pageSize, 100);
            const offset = (page - 1) * limit;
            // Erstelle Filterbedingungen
            const whereConditions = { userId };
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
        }
        catch (error) {
            logger_1.logger.error(`Error fetching cases for user ${userId}:`, error);
            throw new Error('Failed to fetch cases');
        }
    }
    /**
     * Holt Fälle mit komplexen Filtern
     */
    async getCasesWithFilters(filters, page = 1, pageSize = 20) {
        try {
            // Begrenze die Seitengröße
            const limit = Math.min(pageSize, 100);
            const offset = (page - 1) * limit;
            // Erstelle Filterbedingungen
            const whereConditions = {};
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
        }
        catch (error) {
            logger_1.logger.error('Error fetching cases with filters:', error);
            throw new Error('Failed to fetch cases');
        }
    }
    /**
     * Löscht einen Fall
     */
    async deleteCase(id) {
        try {
            await this.prisma.case.delete({
                where: { id }
            });
            // Lösche den Cache-Eintrag für diesen Fall
            this.cacheService.del(`case:${id}`);
            logger_1.logger.info(`Deleted case: ${id}`);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting case ${id}:`, error);
            throw new Error('Failed to delete case');
        }
    }
    /**
     * Schließt einen Fall
     */
    async closeCase(id) {
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
            logger_1.logger.info(`Closed case: ${id}`);
            return closedCase;
        }
        catch (error) {
            logger_1.logger.error(`Error closing case ${id}:`, error);
            throw new Error('Failed to close case');
        }
    }
    /**
     * Löscht den Cache für einen Fall
     */
    clearCaseCache(id) {
        this.cacheService.del(`case:${id}`);
    }
    /**
     * Holt Cache-Statistiken
     */
    getCacheStats() {
        return this.cacheService.getStats();
    }
}
exports.CaseService = CaseService;
