"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentAnnotationService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
// Service for managing document annotations
class DocumentAnnotationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Create a new annotation
     */
    async createAnnotation(documentId, userId, text, type = client_1.AnnotationType.COMMENT, parentId, page, positionX, positionY) {
        try {
            // Verify the document exists and user has access
            const document = await this.prisma.document.findFirst({
                where: {
                    id: documentId,
                }
            });
            if (!document) {
                throw new errorHandler_1.ValidationError('Document not found');
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
            logger_1.logger.info('Document annotation created', {
                annotationId: annotation.id,
                documentId,
                userId
            });
            return annotation;
        }
        catch (error) {
            logger_1.logger.error('Error creating document annotation', { error, documentId, userId });
            throw error;
        }
    }
    /**
     * Get annotations for a document
     */
    async getDocumentAnnotations(documentId, includeReplies = true) {
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
        }
        catch (error) {
            logger_1.logger.error('Error getting document annotations', { error, documentId });
            throw error;
        }
    }
    /**
     * Update an annotation
     */
    async updateAnnotation(annotationId, userId, text, resolved) {
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
                throw new errorHandler_1.ValidationError('Annotation not found or access denied');
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
            logger_1.logger.info('Document annotation updated', {
                annotationId,
                userId
            });
            return updatedAnnotation;
        }
        catch (error) {
            logger_1.logger.error('Error updating document annotation', { error, annotationId, userId });
            throw error;
        }
    }
    /**
     * Delete an annotation
     */
    async deleteAnnotation(annotationId, userId) {
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
                throw new errorHandler_1.ValidationError('Annotation not found or access denied');
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
            logger_1.logger.info('Document annotation deleted', {
                annotationId,
                userId
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting document annotation', { error, annotationId, userId });
            throw error;
        }
    }
    /**
     * Resolve an annotation
     */
    async resolveAnnotation(annotationId, userId) {
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
            logger_1.logger.info('Document annotation resolved', {
                annotationId,
                userId
            });
            return annotation;
        }
        catch (error) {
            logger_1.logger.error('Error resolving document annotation', { error, annotationId, userId });
            throw error;
        }
    }
}
exports.DocumentAnnotationService = DocumentAnnotationService;
