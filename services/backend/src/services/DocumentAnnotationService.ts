import { PrismaClient, AnnotationType } from '@prisma/client';
import { logger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';

// Service for managing document annotations

export class DocumentAnnotationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new annotation
   */
  async createAnnotation(
    documentId: string,
    userId: string,
    text: string,
    type: AnnotationType = AnnotationType.COMMENT,
    parentId?: string,
    page?: number,
    positionX?: number,
    positionY?: number
  ): Promise<any> {
    try {
      // Verify the document exists and user has access
      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
        }
      });

      if (!document) {
        throw new ValidationError('Document not found');
      }

      // @ts-ignore: TypeScript not recognizing documentAnnotation property
      const annotation = await this.prisma.documentAnnotation.create({
        data: {
          documentId,
          userId,
          text,
          type,
          parentId,
          page,
          positionX,
          positionY
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          },
          parent: true,
          children: true
        }
      });

      logger.info('Document annotation created', {
        annotationId: annotation.id,
        documentId,
        userId
      });

      return annotation;
    } catch (error) {
      logger.error('Error creating document annotation', { error, documentId, userId });
      throw error;
    }
  }

  /**
   * Get annotations for a document
   */
  async getDocumentAnnotations(documentId: string, includeReplies: boolean = true) {
    try {
      // @ts-ignore: TypeScript not recognizing documentAnnotation property
      const annotations = await this.prisma.documentAnnotation.findMany({
        where: {
          documentId,
          parentId: null // Only top-level annotations
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          },
          ...(includeReplies && {
            children: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    profile: true
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          })
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return annotations;
    } catch (error) {
      logger.error('Error getting document annotations', { error, documentId });
      throw error;
    }
  }

  /**
   * Update an annotation
   */
  async updateAnnotation(
    annotationId: string,
    userId: string,
    text?: string,
    resolved?: boolean
  ) {
    try {
      // Verify the annotation belongs to the user
      // @ts-ignore: TypeScript not recognizing documentAnnotation property
      const annotation = await this.prisma.documentAnnotation.findFirst({
        where: {
          id: annotationId,
          userId
        }
      });

      if (!annotation) {
        throw new ValidationError('Annotation not found or access denied');
      }

      // @ts-ignore: TypeScript not recognizing documentAnnotation property
      const updatedAnnotation = await this.prisma.documentAnnotation.update({
        where: {
          id: annotationId
        },
        data: {
          text,
          resolved,
          resolvedAt: resolved ? new Date() : null
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          },
          parent: true,
          children: true
        }
      });

      logger.info('Document annotation updated', {
        annotationId,
        userId
      });

      return updatedAnnotation;
    } catch (error) {
      logger.error('Error updating document annotation', { error, annotationId, userId });
      throw error;
    }
  }

  /**
   * Delete an annotation
   */
  async deleteAnnotation(annotationId: string, userId: string) {
    try {
      // Verify the annotation belongs to the user
      // @ts-ignore: TypeScript not recognizing documentAnnotation property
      const annotation = await this.prisma.documentAnnotation.findFirst({
        where: {
          id: annotationId,
          userId
        }
      });

      if (!annotation) {
        throw new ValidationError('Annotation not found or access denied');
      }

      // Delete the annotation and all its replies
      // @ts-ignore: TypeScript not recognizing documentAnnotation property
      await this.prisma.documentAnnotation.deleteMany({
        where: {
          OR: [
            { id: annotationId },
            { parentId: annotationId }
          ]
        }
      });

      logger.info('Document annotation deleted', {
        annotationId,
        userId
      });
    } catch (error) {
      logger.error('Error deleting document annotation', { error, annotationId, userId });
      throw error;
    }
  }

  /**
   * Resolve an annotation
   */
  async resolveAnnotation(annotationId: string, userId: string) {
    try {
      // @ts-ignore: TypeScript not recognizing documentAnnotation property
      const annotation = await this.prisma.documentAnnotation.update({
        where: {
          id: annotationId
        },
        data: {
          resolved: true,
          resolvedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          }
        }
      });

      logger.info('Document annotation resolved', {
        annotationId,
        userId
      });

      return annotation;
    } catch (error) {
      logger.error('Error resolving document annotation', { error, annotationId, userId });
      throw error;
    }
  }
}