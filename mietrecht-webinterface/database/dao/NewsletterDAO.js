/**
 * Data Access Object for Newsletters
 */

const db = require('../connection');

class NewsletterDAO {
  // Create a new newsletter
  static async create(newsletter) {
    const { lawyerId, subject, content, sentAt } = newsletter;
    const query = `
      INSERT INTO newsletters (lawyer_id, subject, content, sent_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [lawyerId, subject, content, sentAt];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Get newsletters by lawyer ID
  static async getByLawyerId(lawyerId, limit = 10) {
    const query = `
      SELECT * FROM newsletters 
      WHERE lawyer_id = $1
      ORDER BY sent_at DESC, created_at DESC
      LIMIT $2
    `;
    const result = await db.query(query, [lawyerId, limit]);
    return result.rows;
  }

  // Get newsletter by ID
  static async getById(id) {
    const query = 'SELECT * FROM newsletters WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Get all newsletters with pagination
  static async getAll(limit = 10, offset = 0) {
    const query = `
      SELECT n.*, l.name as lawyer_name, l.email as lawyer_email
      FROM newsletters n
      JOIN lawyers l ON n.lawyer_id = l.id
      ORDER BY sent_at DESC, created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  // Update newsletter
  static async update(id, updates) {
    const { subject, content, sentAt } = updates;
    const query = `
      UPDATE newsletters 
      SET subject = $1, content = $2, sent_at = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    const values = [subject, content, sentAt, id];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Delete newsletter
  static async delete(id) {
    const query = 'DELETE FROM newsletters WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = NewsletterDAO;