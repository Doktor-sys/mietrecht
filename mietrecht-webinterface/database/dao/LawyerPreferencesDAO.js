/**
 * Data Access Object for Lawyer Preferences
 */

const db = require('../connection');

class LawyerPreferencesDAO {
  // Create preferences for a lawyer
  static async create(lawyerId, preferences) {
    const { courtLevels, topics, frequency, regions } = preferences;
    const query = `
      INSERT INTO lawyer_preferences (lawyer_id, court_levels, topics, frequency, regions)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [lawyerId, courtLevels, topics, frequency, regions];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Get preferences by lawyer ID
  static async getByLawyerId(lawyerId) {
    const query = 'SELECT * FROM lawyer_preferences WHERE lawyer_id = $1';
    const result = await db.query(query, [lawyerId]);
    return result.rows[0];
  }

  // Update preferences
  static async update(lawyerId, updates) {
    const { courtLevels, topics, frequency, regions } = updates;
    const query = `
      UPDATE lawyer_preferences 
      SET court_levels = $1, topics = $2, frequency = $3, regions = $4, updated_at = CURRENT_TIMESTAMP
      WHERE lawyer_id = $5
      RETURNING *
    `;
    const values = [courtLevels, topics, frequency, regions, lawyerId];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Delete preferences
  static async delete(lawyerId) {
    const query = 'DELETE FROM lawyer_preferences WHERE lawyer_id = $1 RETURNING *';
    const result = await db.query(query, [lawyerId]);
    return result.rows[0];
  }
}

module.exports = LawyerPreferencesDAO;