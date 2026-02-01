import { PrismaClient } from '@prisma/client';
import { Permission } from '@prisma/client';
export declare class DocumentSharingService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Share a document with another user
     */
    shareDocument(documentId: string, ownerId: string, sharedWithEmail: string, permission?: Permission, expiresAt?: Date): Promise<any>;
    /**
     * Get documents shared with a user
     */
    getSharedDocuments(userId: string): Promise<any>;
    /**
     * Get users a document is shared with
     */
    getDocumentShares(documentId: string, ownerId: string): Promise<any>;
    /**
     * Update sharing permissions
     */
    updateShare(shareId: string, ownerId: string, permission: Permission, expiresAt?: Date): Promise<any>;
    /**
     * Remove a document share
     */
    removeShare(shareId: string, ownerId: string): Promise<void>;
    /**
     * Check if a user has access to a document
     */
    hasAccess(documentId: string, userId: string): Promise<boolean>;
    /**
     * Get the permission level for a user on a document
     */
    getPermission(documentId: string, userId: string): Promise<Permission | null>;
}
