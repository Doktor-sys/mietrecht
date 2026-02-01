"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const logger_1 = require("../utils/logger");
const CacheService_1 = require("./CacheService");
class DocumentService {
    constructor(prisma) {
        this.prisma = prisma;
        this.cacheService = CacheService_1.CacheService.getInstance();
    }
    /**
     * Holt ein Dokument anhand seiner ID (mit Caching)
     */
    async getDocumentById(id) {
        // Prüfe zuerst den Cache
        const cacheKey = `document:${id}`;
        const cachedDocument = this.cacheService.get(cacheKey);
        if (cachedDocument !== undefined) {
            logger_1.logger.debug(`Document ${id} found in cache`);
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
            });
            // Speichere im Cache für zukünftige Anfragen
            if (document) {
                this.cacheService.set(cacheKey, document);
            }
            return document;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching document ${id}:`, error);
            throw new Error('Failed to fetch document');
        }
    }
    /**
     * Erstellt ein neues Dokument
     */
    async createDocument(documentData) {
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
            logger_1.logger.info(`Created new document: ${document.id}`);
            return document;
        }
        catch (error) {
            logger_1.logger.error('Error creating document:', error);
            throw new Error('Failed to create document');
        }
    }
    /**
     * Aktualisiert ein Dokument
     */
    async updateDocument(id, updates) {
        try {
            // Filtere undefinierte Werte aus den Updates
            const filteredUpdates = {};
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
            logger_1.logger.info(`Updated document: ${id}`);
            return document;
        }
        catch (error) {
            logger_1.logger.error(`Error updating document ${id}:`, error);
            throw new Error('Failed to update document');
        }
    }
    /**
     * Holt alle Dokumente eines Benutzers mit Pagination
     */
    async getUserDocuments(userId, page = 1, pageSize = 20, documentType, status) {
        try {
            // Begrenze die Seitengröße
            const limit = Math.min(pageSize, 100);
            const offset = (page - 1) * limit;
            // Erstelle Filterbedingungen
            const whereConditions = { userId };
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
        }
        catch (error) {
            logger_1.logger.error(`Error fetching documents for user ${userId}:`, error);
            throw new Error('Failed to fetch documents');
        }
    }
    /**
     * Holt Dokumente mit komplexen Filtern
     */
    async getDocumentsWithFilters(filters, page = 1, pageSize = 20) {
        try {
            // Begrenze die Seitengröße
            const limit = Math.min(pageSize, 100);
            const offset = (page - 1) * limit;
            // Erstelle Filterbedingungen
            const whereConditions = {};
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
        }
        catch (error) {
            logger_1.logger.error('Error fetching documents with filters:', error);
            throw new Error('Failed to fetch documents');
        }
    }
    /**
     * Löscht ein Dokument
     */
    async deleteDocument(id) {
        try {
            await this.prisma.document.delete({
                where: { id }
            });
            // Lösche den Cache-Eintrag für dieses Dokument
            this.cacheService.del(`document:${id}`);
            logger_1.logger.info(`Deleted document: ${id}`);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting document ${id}:`, error);
            throw new Error('Failed to delete document');
        }
    }
    /**
     * Setzt den Analysestatus eines Dokuments
     */
    async setDocumentAnalysisStatus(id, status, analysis) {
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
            logger_1.logger.info(`Updated document analysis status: ${id} -> ${status}`);
            return document;
        }
        catch (error) {
            logger_1.logger.error(`Error updating document analysis status ${id}:`, error);
            throw new Error('Failed to update document analysis status');
        }
    }
    /**
     * Löscht den Cache für ein Dokument
     */
    clearDocumentCache(id) {
        this.cacheService.del(`document:${id}`);
    }
    /**
     * Holt Cache-Statistiken
     */
    getCacheStats() {
        return this.cacheService.getStats();
    }
}
exports.DocumentService = DocumentService;
