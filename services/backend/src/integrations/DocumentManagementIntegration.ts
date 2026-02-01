import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import FormData from 'form-data';
import { Readable } from 'stream';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  metadata: Record<string, any>;
  url: string;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  path: string;
}

interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  createdAt: Date;
  createdBy: string;
  comment?: string;
  url: string;
}

export class DocumentManagementIntegration {
  private apiClient: AxiosInstance;
  private baseUrl: string;
  private accessToken: string;

  constructor(baseUrl: string, accessToken: string) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
    
    this.apiClient = axios.create({
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
  async getDocuments(folderId?: string): Promise<Document[]> {
    try {
      const params: any = {};
      if (folderId) params.folderId = folderId;
      
      const response = await this.apiClient.get('/documents', { params });
      return response.data.documents;
    } catch (error) {
      logger.error('Error fetching documents:', error);
      throw new Error('Failed to fetch documents');
    }
  }

  /**
   * Holt ein bestimmtes Dokument anhand seiner ID
   */
  async getDocumentById(documentId: string): Promise<Document> {
    try {
      const response = await this.apiClient.get(`/documents/${documentId}`);
      return response.data.document;
    } catch (error) {
      logger.error(`Error fetching document ${documentId}:`, error);
      throw new Error('Failed to fetch document');
    }
  }

  /**
   * Lädt ein neues Dokument hoch
   */
  async uploadDocument(fileBuffer: Buffer, filename: string, folderId?: string, tags?: string[]): Promise<Document> {
    try {
      const formData = new FormData();
      // Erstelle einen Readable Stream aus dem Buffer
      const bufferStream = new Readable();
      bufferStream.push(fileBuffer);
      bufferStream.push(null);
      
      formData.append('file', bufferStream, {
        filename: filename,
        contentType: 'application/octet-stream'
      });
      
      if (folderId) formData.append('folderId', folderId);
      if (tags) formData.append('tags', JSON.stringify(tags));
      
      const response = await this.apiClient.post('/documents', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      return response.data.document;
    } catch (error) {
      logger.error('Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  /**
   * Aktualisiert ein bestehendes Dokument
   */
  async updateDocument(documentId: string, updates: Partial<Document>): Promise<Document> {
    try {
      const response = await this.apiClient.patch(`/documents/${documentId}`, { document: updates });
      return response.data.document;
    } catch (error) {
      logger.error(`Error updating document ${documentId}:`, error);
      throw new Error('Failed to update document');
    }
  }

  /**
   * Löscht ein Dokument
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/documents/${documentId}`);
    } catch (error) {
      logger.error(`Error deleting document ${documentId}:`, error);
      throw new Error('Failed to delete document');
    }
  }

  /**
   * Sucht nach Dokumenten
   */
  async searchDocuments(query: string, filters?: {
    tags?: string[];
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Document[]> {
    try {
      const params: any = { q: query };
      
      if (filters) {
        if (filters.tags) params.tags = filters.tags.join(',');
        if (filters.type) params.type = filters.type;
        if (filters.dateFrom) params.dateFrom = filters.dateFrom.toISOString();
        if (filters.dateTo) params.dateTo = filters.dateTo.toISOString();
      }
      
      const response = await this.apiClient.get('/documents/search', { params });
      return response.data.documents;
    } catch (error) {
      logger.error('Error searching documents:', error);
      throw new Error('Failed to search documents');
    }
  }

  /**
   * Holt alle Ordner
   */
  async getFolders(parentId?: string): Promise<Folder[]> {
    try {
      const params: any = {};
      if (parentId) params.parentId = parentId;
      
      const response = await this.apiClient.get('/folders', { params });
      return response.data.folders;
    } catch (error) {
      logger.error('Error fetching folders:', error);
      throw new Error('Failed to fetch folders');
    }
  }

  /**
   * Erstellt einen neuen Ordner
   */
  async createFolder(name: string, parentId?: string): Promise<Folder> {
    try {
      const response = await this.apiClient.post('/folders', { folder: { name, parentId } });
      return response.data.folder;
    } catch (error) {
      logger.error('Error creating folder:', error);
      throw new Error('Failed to create folder');
    }
  }

  /**
   * Holt Versionen eines Dokuments
   */
  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    try {
      const response = await this.apiClient.get(`/documents/${documentId}/versions`);
      return response.data.versions;
    } catch (error) {
      logger.error(`Error fetching versions for document ${documentId}:`, error);
      throw new Error('Failed to fetch document versions');
    }
  }

  /**
   * Stellt eine frühere Version eines Dokuments wieder her
   */
  async restoreDocumentVersion(documentId: string, versionId: string): Promise<Document> {
    try {
      const response = await this.apiClient.post(`/documents/${documentId}/versions/${versionId}/restore`);
      return response.data.document;
    } catch (error) {
      logger.error(`Error restoring version ${versionId} for document ${documentId}:`, error);
      throw new Error('Failed to restore document version');
    }
  }

  /**
   * Fügt Tags zu einem Dokument hinzu
   */
  async addTagsToDocument(documentId: string, tags: string[]): Promise<Document> {
    try {
      const response = await this.apiClient.post(`/documents/${documentId}/tags`, { tags });
      return response.data.document;
    } catch (error) {
      logger.error(`Error adding tags to document ${documentId}:`, error);
      throw new Error('Failed to add tags to document');
    }
  }

  /**
   * Entfernt Tags von einem Dokument
   */
  async removeTagsFromDocument(documentId: string, tags: string[]): Promise<Document> {
    try {
      const response = await this.apiClient.delete(`/documents/${documentId}/tags`, { data: { tags } });
      return response.data.document;
    } catch (error) {
      logger.error(`Error removing tags from document ${documentId}:`, error);
      throw new Error('Failed to remove tags from document');
    }
  }
}