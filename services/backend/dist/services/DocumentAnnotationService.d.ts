import { PrismaClient, AnnotationType } from '@prisma/client';
export declare class DocumentAnnotationService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Create a new annotation
     */
    createAnnotation(documentId: string, userId: string, text: string, type?: AnnotationType, parentId?: string, page?: number, positionX?: number, positionY?: number): Promise<any>;
    /**
     * Get annotations for a document
     */
    getDocumentAnnotations(documentId: string, includeReplies?: boolean): Promise<any>;
    /**
     * Update an annotation
     */
    updateAnnotation(annotationId: string, userId: string, text?: string, resolved?: boolean): Promise<any>;
    /**
     * Delete an annotation
     */
    deleteAnnotation(annotationId: string, userId: string): Promise<void>;
    /**
     * Resolve an annotation
     */
    resolveAnnotation(annotationId: string, userId: string): Promise<any>;
}
