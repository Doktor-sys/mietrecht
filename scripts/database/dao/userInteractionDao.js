/**
 * User Interaction DAO
 * This module provides data access methods for user interactions.
 */

const { db } = require('../connection.js');

/**
 * Create a new user interaction
 * @param {Object} interaction - Interaction object
 * @returns {Promise<number>} ID of the created interaction
 */
function createUserInteraction(interaction) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO user_interactions 
      (lawyer_id, decision_id, interaction_type, interaction_data)
      VALUES (?, ?, ?, ?)
    `;
    
    const params = [
      interaction.lawyer_id,
      interaction.decision_id,
      interaction.interaction_type,
      JSON.stringify(interaction.interaction_data || {})
    ];
    
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

/**
 * Get all user interactions
 * @returns {Promise<Array>} Array of user interaction objects
 */
function getAllUserInteractions() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT ui.*, l.name as lawyer_name, cd.case_number, cd.topics as decision_topics
      FROM user_interactions ui
      LEFT JOIN lawyers l ON ui.lawyer_id = l.id
      LEFT JOIN court_decisions cd ON ui.decision_id = cd.id
      ORDER BY ui.created_at DESC
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Parse JSON fields
        const interactions = rows.map(row => ({
          ...row,
          interaction_data: row.interaction_data ? JSON.parse(row.interaction_data) : {}
        }));
        resolve(interactions);
      }
    });
  });
}

/**
 * Get user interactions by lawyer ID
 * @param {number} lawyerId - Lawyer ID
 * @returns {Promise<Array>} Array of user interaction objects
 */
function getUserInteractionsByLawyer(lawyerId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT ui.*, cd.*
      FROM user_interactions ui
      LEFT JOIN court_decisions cd ON ui.decision_id = cd.id
      WHERE ui.lawyer_id = ?
      ORDER BY ui.created_at DESC
    `;
    
    db.all(sql, [lawyerId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Parse JSON fields
        const interactions = rows.map(row => ({
          ...row,
          interaction_data: row.interaction_data ? JSON.parse(row.interaction_data) : {},
          topics: row.topics ? JSON.parse(row.topics) : [],
          judges: row.judges ? JSON.parse(row.judges) : []
        }));
        resolve(interactions);
      }
    });
  });
}

/**
 * Get user interactions by decision ID
 * @param {number} decisionId - Decision ID
 * @returns {Promise<Array>} Array of user interaction objects
 */
function getUserInteractionsByDecision(decisionId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT ui.*, l.name as lawyer_name, l.email as lawyer_email
      FROM user_interactions ui
      LEFT JOIN lawyers l ON ui.lawyer_id = l.id
      WHERE ui.decision_id = ?
      ORDER BY ui.created_at DESC
    `;
    
    db.all(sql, [decisionId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Parse JSON fields
        const interactions = rows.map(row => ({
          ...row,
          interaction_data: row.interaction_data ? JSON.parse(row.interaction_data) : {}
        }));
        resolve(interactions);
      }
    });
  });
}

/**
 * Get user interactions by type
 * @param {string} interactionType - Interaction type
 * @returns {Promise<Array>} Array of user interaction objects
 */
function getUserInteractionsByType(interactionType) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT ui.*, l.name as lawyer_name, cd.case_number
      FROM user_interactions ui
      LEFT JOIN lawyers l ON ui.lawyer_id = l.id
      LEFT JOIN court_decisions cd ON ui.decision_id = cd.id
      WHERE ui.interaction_type = ?
      ORDER BY ui.created_at DESC
    `;
    
    db.all(sql, [interactionType], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Parse JSON fields
        const interactions = rows.map(row => ({
          ...row,
          interaction_data: row.interaction_data ? JSON.parse(row.interaction_data) : {}
        }));
        resolve(interactions);
      }
    });
  });
}

/**
 * Get recent user interactions
 * @param {Object} options - Query options
 * @param {number} options.hours - Number of hours to look back
 * @param {number} options.limit - Maximum number of results
 * @returns {Promise<Array>} Array of recent user interaction objects
 */
function getRecentUserInteractions(options = {}) {
  return new Promise((resolve, reject) => {
    const {
      hours = 24,
      limit = 50
    } = options;
    
    const sql = `
      SELECT ui.*, l.name as lawyer_name, cd.case_number, cd.topics
      FROM user_interactions ui
      LEFT JOIN lawyers l ON ui.lawyer_id = l.id
      LEFT JOIN court_decisions cd ON ui.decision_id = cd.id
      WHERE ui.created_at >= datetime('now', '-${hours} hours')
      ORDER BY ui.created_at DESC
      LIMIT ?
    `;
    
    db.all(sql, [limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Parse JSON fields
        const interactions = rows.map(row => ({
          ...row,
          interaction_data: row.interaction_data ? JSON.parse(row.interaction_data) : {},
          topics: row.topics ? JSON.parse(row.topics) : []
        }));
        resolve(interactions);
      }
    });
  });
}

/**
 * Delete a user interaction by ID
 * @param {number} id - Interaction ID
 * @returns {Promise<void>}
 */
function deleteUserInteraction(id) {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM user_interactions WHERE id = ?';
    db.run(sql, [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Export functions
module.exports = {
  createUserInteraction,
  getAllUserInteractions,
  getUserInteractionsByLawyer,
  getUserInteractionsByDecision,
  getUserInteractionsByType,
  getRecentUserInteractions,
  deleteUserInteraction
};