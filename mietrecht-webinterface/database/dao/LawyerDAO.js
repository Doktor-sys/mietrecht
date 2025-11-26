/**
 * Data Access Object for Lawyers
 */

const db = require('../connection');

class LawyerDAO {
  // Create a new lawyer
  static async create(lawyer) {
    try {
      const { name, email, passwordHash, lawFirm } = lawyer;
      const query = `
        INSERT INTO lawyers (name, email, password_hash, law_firm)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, law_firm, created_at
      `;
      const values = [name, email, passwordHash, lawFirm];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating lawyer:', error);
      throw error;
    }
  }

  // Find lawyer by email
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM lawyers WHERE email = $1';
      const result = await db.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding lawyer by email:', error);
      throw error;
    }
  }

  // Find lawyer by ID
  static async findById(id) {
    try {
      const query = 'SELECT id, name, email, law_firm, created_at FROM lawyers WHERE id = $1';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding lawyer by ID:', error);
      throw error;
    }
  }

  // Get all lawyers with pagination
  static async getAll(limit = 10, offset = 0) {
    try {
      const query = 'SELECT id, name, email, law_firm, created_at FROM lawyers ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      const result = await db.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      throw error;
    }
  }

  // Update lawyer information
  static async update(id, updates) {
    try {
      const { name, lawFirm } = updates;
      const query = `
        UPDATE lawyers 
        SET name = $1, law_firm = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, name, email, law_firm, updated_at
      `;
      const values = [name, lawFirm, id];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating lawyer:', error);
      throw error;
    }
  }

  // Delete lawyer
  static async delete(id) {
    try {
      const query = 'DELETE FROM lawyers WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting lawyer:', error);
      throw error;
    }
  }
}

module.exports = LawyerDAO;