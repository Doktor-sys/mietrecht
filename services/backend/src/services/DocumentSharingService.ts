import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';

// @ts-ignore: TypeScript not recognizing Permission enum
import { Permission } from '@prisma/client';

export class DocumentSharingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Share a document with another user
   */
  async shareDocument(
    documentId: string,
    ownerId: string,
    sharedWithEmail: string,
    permission: Permission = Permission.READ,
    expiresAt?: Date
  ) {
    try {
      // Verify the document belongs to the owner
      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          userId: ownerId
        }
      });

      if (!document) {
        throw new ValidationError('Document not found or access denied');
      }

      // Find the user to share with
      const sharedWithUser = await this.prisma.user.findUnique({
        where: {
          email: sharedWithEmail
        }
      });

      if (!sharedWithUser) {
        throw new ValidationError('User not found');
      }

      // Check if already shared with this user
      // @ts-ignore: TypeScript not recognizing documentSharing property
      const existingShare = await this.prisma.documentSharing.findFirst({
        where: {
          documentId,
          sharedWithId: sharedWithUser.id
        }
      });

      if (existingShare) {
        throw new ValidationError('Document already shared with this user');
      }

      // Create the sharing record
      // @ts-ignore: TypeScript not recognizing documentSharing property
      const sharing = await this.prisma.documentSharing.create({
        data: {
          documentId,
          ownerId,
          sharedWithId: sharedWithUser.id,
          permission,
          expiresAt
        },
        include: {
          document: true,
          owner: true,
          sharedWith: true
        }
      });

      logger.info('Document shared successfully', {
        documentId,
        ownerId,
        sharedWithId: sharedWithUser.id,
        permission
      });

      return sharing;
    } catch (error) {
      logger.error('Error sharing document', { error, documentId, ownerId });
      throw error;
    }
  }

  /**
   * Get documents shared with a user
   */
  async getSharedDocuments(userId: string) {
    try {
      // @ts-ignore: TypeScript not recognizing documentSharing property
      const sharedDocuments = await this.prisma.documentSharing.findMany({
        where: {
          sharedWithId: userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        },
        include: {
          document: {
            include: {
              analysis: true
            }
          },
          owner: true
        },
        orderBy: {
          sharedAt: 'desc'
        }
      });

      return sharedDocuments;
    } catch (error) {
      logger.error('Error getting shared documents', { error, userId });
      throw error;
    }
  }

  /**
   * Get users a document is shared with
   */
  async getDocumentShares(documentId: string, ownerId: string) {
    try {
      // Verify the document belongs to the owner
      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          userId: ownerId
        }
      });

      if (!document) {
        throw new ValidationError('Document not found or access denied');
      }

      // @ts-ignore: TypeScript not recognizing documentSharing property
      const shares = await this.prisma.documentSharing.findMany({
        where: {
          documentId
        },
        include: {
          sharedWith: true
        },
        orderBy: {
          sharedAt: 'desc'
        }
      });

      return shares;
    } catch (error) {
      logger.error('Error getting document shares', { error, documentId, ownerId });
      throw error;
    }
  }

  /**
   * Update sharing permissions
   */
  async updateShare(
    shareId: string,
    ownerId: string,
    permission: Permission,
    expiresAt?: Date
  ) {
    try {
      // Verify the share belongs to the owner
      // @ts-ignore: TypeScript not recognizing documentSharing property
      const share = await this.prisma.documentSharing.findFirst({
        where: {
          id: shareId,
          ownerId
        },
        include: {
          document: true
        }
      });

      if (!share) {
        throw new ValidationError('Share not found or access denied');
      }

      // @ts-ignore: TypeScript not recognizing documentSharing property
      const updatedShare = await this.prisma.documentSharing.update({
        where: {
          id: shareId
        },
        data: {
          permission,
          expiresAt
        },
        include: {
          document: true,
          sharedWith: true
        }
      });

      logger.info('Document share updated', {
        shareId,
        permission,
        expiresAt
      });

      return updatedShare;
    } catch (error) {
      logger.error('Error updating document share', { error, shareId, ownerId });
      throw error;
    }
  }

  /**
   * Remove a document share
   */
  async removeShare(shareId: string, ownerId: string) {
    try {
      // Verify the share belongs to the owner
      // @ts-ignore: TypeScript not recognizing documentSharing property
      const share = await this.prisma.documentSharing.findFirst({
        where: {
          id: shareId,
          ownerId
        }
      });

      if (!share) {
        throw new ValidationError('Share not found or access denied');
      }

      // @ts-ignore: TypeScript not recognizing documentSharing property
      await this.prisma.documentSharing.delete({
        where: {
          id: shareId
        }
      });

      logger.info('Document share removed', { shareId });
    } catch (error) {
      logger.error('Error removing document share', { error, shareId, ownerId });
      throw error;
    }
  }

  /**
   * Check if a user has access to a document
   */
  async hasAccess(documentId: string, userId: string): Promise<boolean> {
    try {
      // Check if user is the owner
      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          userId
        }
      });

      if (document) {
        return true;
      }

      // Check if document is shared with the user
      // @ts-ignore: TypeScript not recognizing documentSharing property
      const share = await this.prisma.documentSharing.findFirst({
        where: {
          documentId,
          sharedWithId: userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      });

      return !!share;
    } catch (error) {
      logger.error('Error checking document access', { error, documentId, userId });
      throw error;
    }
  }

  /**
   * Get the permission level for a user on a document
   */
  async getPermission(documentId: string, userId: string): Promise<Permission | null> {
    try {
      // Check if user is the owner (full access)
      const isOwner = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          userId
        }
      });

      if (isOwner) {
        // Owner has full permissions, but we'll return WRITE as the highest explicit permission
        // @ts-ignore: TypeScript not recognizing Permission enum
        return Permission.WRITE;
      }

      // Check if document is shared with the user
      // @ts-ignore: TypeScript not recognizing documentSharing property
      const share = await this.prisma.documentSharing.findFirst({
        where: {
          documentId,
          sharedWithId: userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      });

      // @ts-ignore: TypeScript not recognizing permission property
      return share ? share.permission : null;
    } catch (error) {
      logger.error('Error getting document permission', { error, documentId, userId });
      throw error;
    }
  }
}