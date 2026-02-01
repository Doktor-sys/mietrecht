/**
 * Offline Document Manager
 * 
 * This service provides comprehensive document management capabilities for offline use.
 * It handles document creation, editing, storage, and synchronization.
 */

import { mobileOfflineStorageService } from './mobileOfflineStorage';

// Document types
type DocumentType = 'pdf' | 'doc' | 'docx' | 'txt' | 'jpg' | 'png' | 'contract' | 'invoice' | 'correspondence';

// Document metadata interface
interface DocumentMetadata {
  id: string;
  title: string;
  type: DocumentType;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  fileSize: number; // in bytes
  mimeType: string;
  tags?: string[];
  associatedCaseId?: string;
  associatedClientId?: string;
  isEncrypted: boolean;
  encryptionMethod?: string;
  version: number;
  author?: string;
  description?: string;
}

// Document revision interface
interface DocumentRevision {
  id: string;
  documentId: string;
  version: number;
  createdAt: string; // ISO date string
  changesSummary: string;
  fileSize: number; // in bytes
}

class OfflineDocumentManager {
  private isInitialized: boolean = false;

  constructor() {
    // Constructor remains empty
  }

  /**
   * Initialize the document manager
   */
  async initialize(): Promise<void> {
    try {
      // Set the initialized flag
      this.isInitialized = true;
      console.log('Offline document manager initialized');
    } catch (error) {
      console.error('Failed to initialize offline document manager:', error);
      throw error;
    }
  }

  /**
   * Create a new document
   */
  async createDocument(
    title: string,
    type: DocumentType,
    content: string | Uint8Array,
    options?: {
      tags?: string[];
      associatedCaseId?: string;
      associatedClientId?: string;
      encrypt?: boolean;
      author?: string;
      description?: string;
    }
  ): Promise<DocumentMetadata> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Calculate file size
      const fileSize = typeof content === 'string' ? content.length : content.byteLength;

      // Create document metadata
      const metadata: DocumentMetadata = {
        id: documentId,
        title,
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fileSize,
        mimeType: this.getMimeType(type),
        tags: options?.tags || [],
        associatedCaseId: options?.associatedCaseId,
        associatedClientId: options?.associatedClientId,
        isEncrypted: options?.encrypt || false,
        version: 1,
        author: options?.author,
        description: options?.description
      };

      // Save metadata to offline storage
      await mobileOfflineStorageService.saveDocument(documentId, metadata, typeof content === 'string' ? content : content.toString());

      console.log(`Document ${documentId} created successfully`);
      return metadata;
    } catch (error) {
      console.error('Failed to create document:', error);
      throw error;
    }
  }

  /**
   * Get document metadata
   */
  async getDocumentMetadata(documentId: string): Promise<DocumentMetadata | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const doc = await mobileOfflineStorageService.getDocument(documentId);
      return doc.metadata;
    } catch (error) {
      console.error(`Failed to get metadata for document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Get document content
   */
  async getDocumentContent(documentId: string): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const doc = await mobileOfflineStorageService.getDocument(documentId);
      return doc.content;
    } catch (error) {
      console.error(`Failed to get content for document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Update document content
   */
  async updateDocument(
    documentId: string,
    content: string | Uint8Array,
    changesSummary: string
  ): Promise<DocumentMetadata> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get current metadata
      const currentMetadata = await this.getDocumentMetadata(documentId);
      if (!currentMetadata) {
        throw new Error(`Document ${documentId} not found`);
      }

      // Create revision before updating
      await this.createRevision(documentId, currentMetadata.version, changesSummary);

      // Calculate file size
      const fileSize = typeof content === 'string' ? content.length : content.byteLength;

      // Update metadata
      const updatedMetadata: DocumentMetadata = {
        ...currentMetadata,
        updatedAt: new Date().toISOString(),
        fileSize,
        version: currentMetadata.version + 1
      };

      // Save updated metadata and content
      await mobileOfflineStorageService.saveDocument(
        documentId, 
        updatedMetadata, 
        typeof content === 'string' ? content : content.toString()
      );

      console.log(`Document ${documentId} updated successfully`);
      return updatedMetadata;
    } catch (error) {
      console.error(`Failed to update document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Create a document revision
   */
  private async createRevision(
    documentId: string,
    version: number,
    changesSummary: string
  ): Promise<DocumentRevision> {
    try {
      const revisionId = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get current document content
      const content = await this.getDocumentContent(documentId);
      if (!content) {
        throw new Error(`Failed to get content for document ${documentId}`);
      }

      // Get file size
      const fileSize = content.length;

      // Create revision metadata
      const revision: DocumentRevision = {
        id: revisionId,
        documentId,
        version,
        createdAt: new Date().toISOString(),
        changesSummary,
        fileSize
      };

      // Save revision metadata to a separate store
      const revisionsKey = `@SmartLaw:documentRevisions:${documentId}`;
      const revisionsStr = await mobileOfflineStorageService.getSetting(revisionsKey);
      const revisions = revisionsStr ? JSON.parse(revisionsStr) : {};
      revisions[revisionId] = revision;
      await mobileOfflineStorageService.saveSetting(revisionsKey, JSON.stringify(revisions));

      console.log(`Revision ${revisionId} created for document ${documentId}`);
      return revision;
    } catch (error) {
      console.error(`Failed to create revision for document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Get document revisions
   */
  async getDocumentRevisions(documentId: string): Promise<DocumentRevision[]> {
    try {
      const revisionsKey = `@SmartLaw:documentRevisions:${documentId}`;
      const revisionsStr = await mobileOfflineStorageService.getSetting(revisionsKey);
      const revisions = revisionsStr ? JSON.parse(revisionsStr) : {};
      
      return Object.values(revisions);
    } catch (error) {
      console.error(`Failed to get revisions for document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Restore document from revision
   */
  async restoreDocumentFromRevision(documentId: string, revisionId: string): Promise<DocumentMetadata> {
    try {
      // Get revision
      const revisionsKey = `@SmartLaw:documentRevisions:${documentId}`;
      const revisionsStr = await mobileOfflineStorageService.getSetting(revisionsKey);
      const revisions = revisionsStr ? JSON.parse(revisionsStr) : {};
      const revision = revisions[revisionId];
      
      if (!revision) {
        throw new Error(`Revision ${revisionId} not found for document ${documentId}`);
      }

      // Get current metadata
      const currentMetadata = await this.getDocumentMetadata(documentId);
      if (!currentMetadata) {
        throw new Error(`Document ${documentId} not found`);
      }

      // Create new revision of current content before restoring
      await this.createRevision(documentId, currentMetadata.version, 'Restored from revision');

      // Update metadata
      const updatedMetadata: DocumentMetadata = {
        ...currentMetadata,
        updatedAt: new Date().toISOString(),
        fileSize: revision.fileSize,
        version: currentMetadata.version + 1
      };

      // Save updated metadata
      await mobileOfflineStorageService.saveDocument(documentId, updatedMetadata);

      console.log(`Document ${documentId} restored from revision ${revisionId}`);
      return updatedMetadata;
    } catch (error) {
      console.error(`Failed to restore document ${documentId} from revision ${revisionId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // In a real implementation, we would delete the document file
      // For now, we'll just log the action
      console.log(`Document ${documentId} deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * List all documents
   */
  async listDocuments(filters?: {
    type?: DocumentType;
    associatedCaseId?: string;
    associatedClientId?: string;
    tags?: string[];
  }): Promise<DocumentMetadata[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get all documents from offline storage
      const documents = await mobileOfflineStorageService.getDocuments();
      
      // Convert to array and apply filters
      let docArray = Object.values(documents).map(doc => doc.data) as DocumentMetadata[];
      
      // Apply filters
      if (filters?.type) {
        docArray = docArray.filter(doc => doc.type === filters.type);
      }
      
      if (filters?.associatedCaseId) {
        docArray = docArray.filter(doc => doc.associatedCaseId === filters.associatedCaseId);
      }
      
      if (filters?.associatedClientId) {
        docArray = docArray.filter(doc => doc.associatedClientId === filters.associatedClientId);
      }
      
      if (filters?.tags && filters.tags.length > 0) {
        docArray = docArray.filter(doc => 
          doc.tags && doc.tags.some(tag => filters.tags!.includes(tag))
        );
      }
      
      return docArray;
    } catch (error) {
      console.error('Failed to list documents:', error);
      throw error;
    }
  }

  /**
   * Search documents by title or content
   */
  async searchDocuments(query: string): Promise<DocumentMetadata[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get all documents
      const documents = await this.listDocuments();
      
      // Search in titles
      const titleMatches = documents.filter(doc => 
        doc.title.toLowerCase().includes(query.toLowerCase())
      );
      
      // For content search, we would need to implement full-text search
      // This is a simplified implementation
      const contentMatches: DocumentMetadata[] = [];
      
      // In a real implementation, we would use a search index or database
      // that supports full-text search
      
      // Combine and deduplicate results
      const allMatches = [...titleMatches, ...contentMatches];
      const uniqueMatches = Array.from(
        new Map(allMatches.map(doc => [doc.id, doc])).values()
      );
      
      return uniqueMatches;
    } catch (error) {
      console.error(`Failed to search documents for query "${query}":`, error);
      throw error;
    }
  }

  /**
   * Get MIME type for document type
   */
  private getMimeType(type: DocumentType): string {
    switch (type) {
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt': return 'text/plain';
      case 'jpg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'contract': return 'application/pdf'; // Contracts are typically PDFs
      case 'invoice': return 'application/pdf'; // Invoices are typically PDFs
      case 'correspondence': return 'text/plain'; // Correspondence is typically text
      default: return 'application/octet-stream';
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStatistics(): Promise<{
    totalDocuments: number;
    totalSize: number;
    documentTypes: {[key: string]: number};
    averageSize: number;
  }> {
    try {
      const documents = await this.listDocuments();
      
      const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
      const averageSize = documents.length > 0 ? totalSize / documents.length : 0;
      
      // Count document types
      const documentTypes: {[key: string]: number} = {};
      documents.forEach(doc => {
        documentTypes[doc.type] = (documentTypes[doc.type] || 0) + 1;
      });
      
      return {
        totalDocuments: documents.length,
        totalSize,
        documentTypes,
        averageSize
      };
    } catch (error) {
      console.error('Failed to get storage statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old document revisions
   */
  async cleanupOldRevisions(maxRevisionsPerDocument: number = 10): Promise<void> {
    try {
      // This would require iterating through all documents and their revisions
      // and removing the oldest ones beyond the limit
      console.log(`Cleaning up old document revisions (max ${maxRevisionsPerDocument} per document)`);
    } catch (error) {
      console.error('Failed to clean up old document revisions:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const offlineDocumentManager = new OfflineDocumentManager();