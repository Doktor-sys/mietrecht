"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentManagementIntegration = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const form_data_1 = __importDefault(require("form-data"));
const stream_1 = require("stream");
class DocumentManagementIntegration {
    constructor(baseUrl, accessToken) {
        this.baseUrl = baseUrl;
        this.accessToken = accessToken;
        this.apiClient = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Holt alle Dokumente in einem Ordner
     */
    async getDocuments(folderId) {
        try {
            const params = {};
            if (folderId)
                params.folderId = folderId;
            const response = await this.apiClient.get('/documents', { params });
            return response.data.documents;
        }
        catch (error) {
            logger_1.logger.error('Error fetching documents:', error);
            throw new Error('Failed to fetch documents');
        }
    }
    /**
     * Holt ein bestimmtes Dokument anhand seiner ID
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
     * Lädt ein neues Dokument hoch
     */
    async uploadDocument(fileBuffer, filename, folderId, tags) {
        try {
            const formData = new form_data_1.default();
            // Erstelle einen Readable Stream aus dem Buffer
            const bufferStream = new stream_1.Readable();
            bufferStream.push(fileBuffer);
            bufferStream.push(null);
            formData.append('file', bufferStream, {
                filename: filename,
                contentType: 'application/octet-stream'
            });
            if (folderId)
                formData.append('folderId', folderId);
            if (tags)
                formData.append('tags', JSON.stringify(tags));
            const response = await this.apiClient.post('/documents', formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });
            return response.data.document;
        }
        catch (error) {
            logger_1.logger.error('Error uploading document:', error);
            throw new Error('Failed to upload document');
        }
    }
    /**
     * Aktualisiert ein bestehendes Dokument
     */
    async updateDocument(documentId, updates) {
        try {
            const response = await this.apiClient.patch(`/documents/${documentId}`, { document: updates });
            return response.data.document;
        }
        catch (error) {
            logger_1.logger.error(`Error updating document ${documentId}:`, error);
            throw new Error('Failed to update document');
        }
    }
    /**
     * Löscht ein Dokument
     */
    async deleteDocument(documentId) {
        try {
            await this.apiClient.delete(`/documents/${documentId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting document ${documentId}:`, error);
            throw new Error('Failed to delete document');
        }
    }
    /**
     * Sucht nach Dokumenten
     */
    async searchDocuments(query, filters) {
        try {
            const params = { q: query };
            if (filters) {
                if (filters.tags)
                    params.tags = filters.tags.join(',');
                if (filters.type)
                    params.type = filters.type;
                if (filters.dateFrom)
                    params.dateFrom = filters.dateFrom.toISOString();
                if (filters.dateTo)
                    params.dateTo = filters.dateTo.toISOString();
            }
            const response = await this.apiClient.get('/documents/search', { params });
            return response.data.documents;
        }
        catch (error) {
            logger_1.logger.error('Error searching documents:', error);
            throw new Error('Failed to search documents');
        }
    }
    /**
     * Holt alle Ordner
     */
    async getFolders(parentId) {
        try {
            const params = {};
            if (parentId)
                params.parentId = parentId;
            const response = await this.apiClient.get('/folders', { params });
            return response.data.folders;
        }
        catch (error) {
            logger_1.logger.error('Error fetching folders:', error);
            throw new Error('Failed to fetch folders');
        }
    }
    /**
     * Erstellt einen neuen Ordner
     */
    async createFolder(name, parentId) {
        try {
            const response = await this.apiClient.post('/folders', { folder: { name, parentId } });
            return response.data.folder;
        }
        catch (error) {
            logger_1.logger.error('Error creating folder:', error);
            throw new Error('Failed to create folder');
        }
    }
    /**
     * Holt Versionen eines Dokuments
     */
    async getDocumentVersions(documentId) {
        try {
            const response = await this.apiClient.get(`/documents/${documentId}/versions`);
            return response.data.versions;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching versions for document ${documentId}:`, error);
            throw new Error('Failed to fetch document versions');
        }
    }
    /**
     * Stellt eine frühere Version eines Dokuments wieder her
     */
    async restoreDocumentVersion(documentId, versionId) {
        try {
            const response = await this.apiClient.post(`/documents/${documentId}/versions/${versionId}/restore`);
            return response.data.document;
        }
        catch (error) {
            logger_1.logger.error(`Error restoring version ${versionId} for document ${documentId}:`, error);
            throw new Error('Failed to restore document version');
        }
    }
    /**
     * Fügt Tags zu einem Dokument hinzu
     */
    async addTagsToDocument(documentId, tags) {
        try {
            const response = await this.apiClient.post(`/documents/${documentId}/tags`, { tags });
            return response.data.document;
        }
        catch (error) {
            logger_1.logger.error(`Error adding tags to document ${documentId}:`, error);
            throw new Error('Failed to add tags to document');
        }
    }
    /**
     * Entfernt Tags von einem Dokument
     */
    async removeTagsFromDocument(documentId, tags) {
        try {
            const response = await this.apiClient.delete(`/documents/${documentId}/tags`, { data: { tags } });
            return response.data.document;
        }
        catch (error) {
            logger_1.logger.error(`Error removing tags from document ${documentId}:`, error);
            throw new Error('Failed to remove tags from document');
        }
    }
}
exports.DocumentManagementIntegration = DocumentManagementIntegration;
