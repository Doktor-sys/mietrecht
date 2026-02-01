import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Since the Prisma client generation is failing, we'll define the types manually
type PartnershipType = 'LEGAL_TECH' | 'REAL_ESTATE' | 'FINANCIAL_SERVICES' | 'INSURANCE' | 'PROPERTY_MANAGEMENT' | 'GOVERNMENT' | 'NON_PROFIT' | 'OTHER';
type PartnershipStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';

interface Partnership {
  id: string;
  organizationId: string;
  partnerName: string;
  partnerType: PartnershipType;
  partnerId?: string;
  status: PartnershipStatus;
  integrationType?: string;
  apiKey?: string;
  config?: any;
  startDate: Date;
  endDate?: Date;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PartnershipInteraction {
  id: string;
  partnershipId: string;
  interactionType: string;
  description?: string;
  metadata?: any;
  createdAt: Date;
}

const prisma = new PrismaClient();

export class PartnershipService {
  /**
   * Create a new partnership
   */
  async createPartnership(data: {
    organizationId: string;
    partnerName: string;
    partnerType: PartnershipType;
    partnerId?: string;
    status?: PartnershipStatus;
    integrationType?: string;
    apiKey?: string;
    config?: any;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
  }): Promise<Partnership> {
    try {
      // Using $executeRaw or $queryRaw since the typed client isn't available
      await prisma.$executeRaw`
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
      const partnership: any = await prisma.$queryRaw`
        SELECT * FROM partnerships 
        WHERE organization_id = ${data.organizationId} 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      logger.info('Partnership created', { partnershipId: partnership[0].id });
      return this.mapPartnership(partnership[0]);
    } catch (error) {
      logger.error('Failed to create partnership', { error });
      throw error;
    }
  }

  /**
   * Get all partnerships for an organization
   */
  async getPartnerships(organizationId: string): Promise<Partnership[]> {
    try {
      const partnerships: any = await prisma.$queryRaw`
        SELECT * FROM partnerships 
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC
      `;
      
      return partnerships.map(this.mapPartnership);
    } catch (error) {
      logger.error('Failed to get partnerships', { error });
      throw error;
    }
  }

  /**
   * Get a specific partnership by ID
   */
  async getPartnershipById(id: string): Promise<Partnership | null> {
    try {
      const partnership: any = await prisma.$queryRaw`
        SELECT * FROM partnerships 
        WHERE id = ${id}
      `;
      
      return partnership.length > 0 ? this.mapPartnership(partnership[0]) : null;
    } catch (error) {
      logger.error('Failed to get partnership', { error });
      throw error;
    }
  }

  /**
   * Update a partnership
   */
  async updatePartnership(id: string, data: Partial<Partnership>): Promise<Partnership> {
    try {
      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      
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
      const partnership: any = await prisma.$queryRaw`
        SELECT * FROM partnerships 
        WHERE id = ${id}
      `;
      
      logger.info('Partnership updated', { partnershipId: id });
      return this.mapPartnership(partnership[0]);
    } catch (error) {
      logger.error('Failed to update partnership', { error });
      throw error;
    }
  }

  /**
   * Delete a partnership
   */
  async deletePartnership(id: string): Promise<Partnership> {
    try {
      // First fetch the partnership to return it
      const partnership: any = await prisma.$queryRaw`
        SELECT * FROM partnerships 
        WHERE id = ${id}
      `;
      
      if (partnership.length === 0) {
        throw new Error('Partnership not found');
      }
      
      // Then delete it
      await prisma.$executeRaw`
        DELETE FROM partnerships 
        WHERE id = ${id}
      `;
      
      logger.info('Partnership deleted', { partnershipId: id });
      return this.mapPartnership(partnership[0]);
    } catch (error) {
      logger.error('Failed to delete partnership', { error });
      throw error;
    }
  }

  /**
   * Record a partnership interaction
   */
  async recordInteraction(data: {
    partnershipId: string;
    interactionType: string;
    description?: string;
    metadata?: any;
  }) {
    try {
      await prisma.$executeRaw`
        INSERT INTO partnership_interactions (
          id, partnership_id, interaction_type, description, metadata, created_at
        ) VALUES (
          ${this.generateId()}, ${data.partnershipId}, ${data.interactionType}, 
          ${data.description || null}, ${data.metadata ? JSON.stringify(data.metadata) : null}, 
          NOW()
        )
      `;
      
      // Fetch the created interaction
      const interaction: any = await prisma.$queryRaw`
        SELECT * FROM partnership_interactions 
        WHERE partnership_id = ${data.partnershipId} 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      logger.info('Partnership interaction recorded', { interactionId: interaction[0].id });
      return this.mapInteraction(interaction[0]);
    } catch (error) {
      logger.error('Failed to record partnership interaction', { error });
      throw error;
    }
  }

  /**
   * Get partnership interactions
   */
  async getInteractions(partnershipId: string, limit: number = 50): Promise<PartnershipInteraction[]> {
    try {
      const interactions: any = await prisma.$queryRaw`
        SELECT * FROM partnership_interactions 
        WHERE partnership_id = ${partnershipId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      
      return interactions.map(this.mapInteraction);
    } catch (error) {
      logger.error('Failed to get partnership interactions', { error });
      throw error;
    }
  }

  /**
   * Helper method to convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Helper method to generate IDs
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Map database row to Partnership interface
   */
  private mapPartnership(row: any): Partnership {
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
  private mapInteraction(row: any): PartnershipInteraction {
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