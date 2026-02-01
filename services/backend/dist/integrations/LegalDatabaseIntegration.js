"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalDatabaseIntegration = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class LegalDatabaseIntegration {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.apiClient = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Sucht nach juristischen Dokumenten
     */
    async searchDocuments(query, filters) {
        try {
            const params = { q: query };
            if (filters) {
                if (filters.type)
                    params.type = filters.type;
                if (filters.jurisdiction)
                    params.jurisdiction = filters.jurisdiction;
                if (filters.dateFrom)
                    params.dateFrom = filters.dateFrom.toISOString();
                if (filters.dateTo)
                    params.dateTo = filters.dateTo.toISOString();
                if (filters.limit)
                    params.limit = filters.limit;
                if (filters.offset)
                    params.offset = filters.offset;
            }
            const response = await this.apiClient.get('/documents/search', { params });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Error searching legal documents:', error);
            throw new Error('Failed to search legal documents');
        }
    }
    /**
     * Holt ein bestimmtes juristisches Dokument anhand seiner ID
     */
    async getDocumentById(documentId) {
        try {
            const response = await this.apiClient.get(`/documents/${documentId}`);
            return response.data.document;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching document ${documentId}:`, error);
            throw new Error('Failed to fetch document');
        }
    }
    /**
     * Holt verwandte Dokumente
     */
    async getRelatedDocuments(documentId, limit = 10) {
        try {
            const response = await this.apiClient.get(`/documents/${documentId}/related`, {
                params: { limit }
            });
            return response.data.documents;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching related documents for ${documentId}:`, error);
            throw new Error('Failed to fetch related documents');
        }
    }
    /**
     * Holt eine Gesetzesnorm anhand ihrer Kennung
     */
    async getStatuteById(statuteId) {
        try {
            const response = await this.apiClient.get(`/statutes/${statuteId}`);
            return response.data.statute;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching statute ${statuteId}:`, error);
            throw new Error('Failed to fetch statute');
        }
    }
    /**
     * Sucht nach Gesetzesnormen
     */
    async searchStatutes(query, jurisdiction) {
        try {
            const params = { q: query };
            if (jurisdiction)
                params.jurisdiction = jurisdiction;
            const response = await this.apiClient.get('/statutes/search', { params });
            return response.data.statutes;
        }
        catch (error) {
            logger_1.logger.error('Error searching statutes:', error);
            throw new Error('Failed to search statutes');
        }
    }
    /**
     * Holt aktuelle rechtliche Entwicklungen
     */
    async getRecentLegalDevelopments(limit = 20) {
        try {
            const response = await this.apiClient.get('/developments/recent', {
                params: { limit }
            });
            return response.data.developments;
        }
        catch (error) {
            logger_1.logger.error('Error fetching recent legal developments:', error);
            throw new Error('Failed to fetch recent legal developments');
        }
    }
    /**
     * Holt rechtliche Kommentare und Analysen
     */
    async getCommentaries(topic, limit = 10) {
        try {
            const response = await this.apiClient.get('/commentaries', {
                params: { topic, limit }
            });
            return response.data.commentaries;
        }
        catch (error) {
            logger_1.logger.error('Error fetching commentaries:', error);
            throw new Error('Failed to fetch commentaries');
        }
    }
    /**
     * Holt Zitierhäufigkeiten für ein Dokument
     */
    async getDocumentCitations(documentId) {
        try {
            const response = await this.apiClient.get(`/documents/${documentId}/citations`);
            return response.data.citationCount;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching citations for document ${documentId}:`, error);
            throw new Error('Failed to fetch document citations');
        }
    }
    /**
     * Holt die rechtliche Historie eines Dokuments
     */
    async getDocumentHistory(documentId) {
        try {
            const response = await this.apiClient.get(`/documents/${documentId}/history`);
            return response.data.history;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching history for document ${documentId}:`, error);
            throw new Error('Failed to fetch document history');
        }
    }
}
exports.LegalDatabaseIntegration = LegalDatabaseIntegration;
