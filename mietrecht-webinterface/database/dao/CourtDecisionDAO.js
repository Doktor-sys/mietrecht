/**
 * Data Access Object for Court Decisions
 */

const db = require('../connection');

class CourtDecisionDAO {
  // Create a new court decision
  static async create(decision) {
    try {
      const { caseNumber, court, location, date, summary, content, importance, topics } = decision;
      const query = `
        INSERT INTO court_decisions (case_number, court, location, date, summary, content, importance, topics)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const values = [caseNumber, court, location, date, summary, content, importance, topics];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating court decision:', error);
      throw error;
    }
  }

  // Find decision by case number
  static async findByCaseNumber(caseNumber) {
    try {
      const query = 'SELECT * FROM court_decisions WHERE case_number = $1';
      const result = await db.query(query, [caseNumber]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding decision by case number:', error);
      throw error;
    }
  }

  // Get decision by ID
  static async getById(id) {
    try {
      const query = 'SELECT * FROM court_decisions WHERE id = $1';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching decision by ID:', error);
      throw error;
    }
  }

  // Get all decisions with pagination
  static async getAll(limit = 10, offset = 0) {
    try {
      const query = `
        SELECT * FROM court_decisions 
        ORDER BY date DESC, created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      const result = await db.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching all decisions:', error);
      throw error;
    }
  }

  // Search decisions by keyword
  static async search(keyword, limit = 10) {
    try {
      const query = `
        SELECT * FROM court_decisions 
        WHERE case_number ILIKE $1 
           OR court ILIKE $1 
           OR location ILIKE $1 
           OR summary ILIKE $1 
           OR content ILIKE $1
        ORDER BY date DESC
        LIMIT $2
      `;
      const searchPattern = `%${keyword}%`;
      const result = await db.query(query, [searchPattern, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error searching decisions by keyword:', error);
      throw error;
    }
  }

  // Search decisions by topic
  static async searchByTopic(topic, limit = 10) {
    try {
      const query = `
        SELECT * FROM court_decisions 
        WHERE $1 = ANY(topics)
        ORDER BY date DESC
        LIMIT $2
      `;
      const result = await db.query(query, [topic, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error searching decisions by topic:', error);
      throw error;
    }
  }

  // Search decisions by court
  static async searchByCourt(court, limit = 10) {
    try {
      const query = `
        SELECT * FROM court_decisions 
        WHERE court ILIKE $1
        ORDER BY date DESC
        LIMIT $2
      `;
      const result = await db.query(query, [`%${court}%`, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error searching decisions by court:', error);
      throw error;
    }
  }

  // Search decisions by date range
  static async searchByDateRange(startDate, endDate, limit = 10) {
    try {
      const query = `
        SELECT * FROM court_decisions 
        WHERE date >= $1 AND date <= $2
        ORDER BY date DESC
        LIMIT $3
      `;
      const result = await db.query(query, [startDate, endDate, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error searching decisions by date range:', error);
      throw error;
    }
  }

  // Get decisions by importance
  static async getByImportance(importance, limit = 10) {
    try {
      const query = `
        SELECT * FROM court_decisions 
        WHERE importance = $1
        ORDER BY date DESC
        LIMIT $2
      `;
      const result = await db.query(query, [importance, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching decisions by importance:', error);
      throw error;
    }
  }

  // Get recent decisions
  static async getRecent(limit = 10) {
    try {
      const query = `
        SELECT * FROM court_decisions 
        ORDER BY date DESC, created_at DESC
        LIMIT $1
      `;
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching recent decisions:', error);
      throw error;
    }
  }

  // Update decision
  static async update(id, updates) {
    try {
      const { caseNumber, court, location, date, summary, content, importance, topics } = updates;
      const query = `
        UPDATE court_decisions 
        SET case_number = $1, court = $2, location = $3, date = $4, summary = $5, 
            content = $6, importance = $7, topics = $8, updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
      `;
      const values = [caseNumber, court, location, date, summary, content, importance, topics, id];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating court decision:', error);
      throw error;
    }
  }

  // Delete decision
  static async delete(id) {
    try {
      const query = 'DELETE FROM court_decisions WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting court decision:', error);
      throw error;
    }
  }
}

module.exports = CourtDecisionDAO;