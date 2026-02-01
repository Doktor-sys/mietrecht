"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnershipService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class PartnershipService {
    /**
     * Create a new partnership
     */
    async createPartnership(data) {
        try {
            // Using $executeRaw or $queryRaw since the typed client isn't available
            await prisma.$executeRaw `
        INSERT INTO partnerships (
          id, organization_id, partner_name, partner_type, partner_id, status, 
          integration_type, api_key, config, start_date, end_date, 
          contact_email, contact_phone, notes, created_at, updated_at
        ) VALUES (
          ${this.generateId()}, ${data.organizationId}, ${data.partnerName}, ${data.partnerType}, 
          ${data.partnerId || null}, ${data.status || 'ACTIVE'}, ${data.integrationType || null}, 
          ${data.apiKey || null}, ${data.config ? JSON.stringify(data.config) : null}, 
          NOW(), NULL, ${data.contactEmail || null}, ${data.contactPhone || null}, 
          ${data.notes || null}, NOW(), NOW()
        )
      `;
            // Fetch the created partnership
            const partnership = await prisma.$queryRaw `
        SELECT * FROM partnerships 
        WHERE organization_id = ${data.organizationId} 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
            logger_1.logger.info('Partnership created', { partnershipId: partnership[0].id });
            return this.mapPartnership(partnership[0]);
        }
        catch (error) {
            logger_1.logger.error('Failed to create partnership', { error });
            throw error;
        }
    }
    /**
     * Get all partnerships for an organization
     */
    async getPartnerships(organizationId) {
        try {
            const partnerships = await prisma.$queryRaw `
        SELECT * FROM partnerships 
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC
      `;
            return partnerships.map(this.mapPartnership);
        }
        catch (error) {
            logger_1.logger.error('Failed to get partnerships', { error });
            throw error;
        }
    }
    /**
     * Get a specific partnership by ID
     */
    async getPartnershipById(id) {
        try {
            const partnership = await prisma.$queryRaw `
        SELECT * FROM partnerships 
        WHERE id = ${id}
      `;
            return partnership.length > 0 ? this.mapPartnership(partnership[0]) : null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get partnership', { error });
            throw error;
        }
    }
    /**
     * Update a partnership
     */
    async updatePartnership(id, data) {
        try {
            // Build dynamic update query
            const updates = [];
            const values = [];
            Object.entries(data).forEach(([key, value]) => {
                if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
                    const column = this.camelToSnake(key);
                    updates.push(`${column} = ?`);
                    values.push(value);
                }
            });
            if (updates.length === 0) {
                throw new Error('No valid fields to update');
            }
            values.push(id); // For WHERE clause
            const query = `
        UPDATE partnerships 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = ?
      `;
            await prisma.$executeRawUnsafe(query, ...values);
            // Fetch the updated partnership
            const partnership = await prisma.$queryRaw `
        SELECT * FROM partnerships 
        WHERE id = ${id}
      `;
            logger_1.logger.info('Partnership updated', { partnershipId: id });
            return this.mapPartnership(partnership[0]);
        }
        catch (error) {
            logger_1.logger.error('Failed to update partnership', { error });
            throw error;
        }
    }
    /**
     * Delete a partnership
     */
    async deletePartnership(id) {
        try {
            // First fetch the partnership to return it
            const partnership = await prisma.$queryRaw `
        SELECT * FROM partnerships 
        WHERE id = ${id}
      `;
            if (partnership.length === 0) {
                throw new Error('Partnership not found');
            }
            // Then delete it
            await prisma.$executeRaw `
        DELETE FROM partnerships 
        WHERE id = ${id}
      `;
            logger_1.logger.info('Partnership deleted', { partnershipId: id });
            return this.mapPartnership(partnership[0]);
        }
        catch (error) {
            logger_1.logger.error('Failed to delete partnership', { error });
            throw error;
        }
    }
    /**
     * Record a partnership interaction
     */
    async recordInteraction(data) {
        try {
            await prisma.$executeRaw `
        INSERT INTO partnership_interactions (
          id, partnership_id, interaction_type, description, metadata, created_at
        ) VALUES (
          ${this.generateId()}, ${data.partnershipId}, ${data.interactionType}, 
          ${data.description || null}, ${data.metadata ? JSON.stringify(data.metadata) : null}, 
          NOW()
        )
      `;
            // Fetch the created interaction
            const interaction = await prisma.$queryRaw `
        SELECT * FROM partnership_interactions 
        WHERE partnership_id = ${data.partnershipId} 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
            logger_1.logger.info('Partnership interaction recorded', { interactionId: interaction[0].id });
            return this.mapInteraction(interaction[0]);
        }
        catch (error) {
            logger_1.logger.error('Failed to record partnership interaction', { error });
            throw error;
        }
    }
    /**
     * Get partnership interactions
     */
    async getInteractions(partnershipId, limit = 50) {
        try {
            const interactions = await prisma.$queryRaw `
        SELECT * FROM partnership_interactions 
        WHERE partnership_id = ${partnershipId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
            return interactions.map(this.mapInteraction);
        }
        catch (error) {
            logger_1.logger.error('Failed to get partnership interactions', { error });
            throw error;
        }
    }
    /**
     * Helper method to convert camelCase to snake_case
     */
    camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    /**
     * Helper method to generate IDs
     */
    generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    /**
     * Map database row to Partnership interface
     */
    mapPartnership(row) {
        return {
            id: row.id,
            organizationId: row.organization_id,
            partnerName: row.partner_name,
            partnerType: row.partner_type,
            partnerId: row.partner_id,
            status: row.status,
            integrationType: row.integration_type,
            apiKey: row.api_key,
            config: row.config ? JSON.parse(row.config) : null,
            startDate: new Date(row.start_date),
            endDate: row.end_date ? new Date(row.end_date) : undefined,
            contactEmail: row.contact_email,
            contactPhone: row.contact_phone,
            notes: row.notes,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
    /**
     * Map database row to PartnershipInteraction interface
     */
    mapInteraction(row) {
        return {
            id: row.id,
            partnershipId: row.partnership_id,
            interactionType: row.interaction_type,
            description: row.description,
            metadata: row.metadata ? JSON.parse(row.metadata) : null,
            createdAt: new Date(row.created_at)
        };
    }
}
exports.PartnershipService = PartnershipService;
