/**
 * Court Decision DAO
 * This module provides data access methods for court decisions.
 */

const { db } = require('../connection.js');

/**
 * Get all court decisions
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDirection - Order direction (ASC or DESC)
 * @returns {Promise<Array>} Array of court decision objects
 */
function getAllCourtDecisions(options = {}) {
  return new Promise((resolve, reject) => {
    const {
      limit = 100,
      offset = 0,
      orderBy = 'decision_date',
      orderDirection = 'DESC'
    } = options;
    
    // Validate order direction
    const validDirections = ['ASC', 'DESC'];
    const direction = validDirections.includes(orderDirection.toUpperCase()) 
      ? orderDirection.toUpperCase() 
      : 'DESC';
      
    // Validate order by field
    const validFields = [
      'id', 'decision_id', 'court', 'location', 'decision_date', 
      'case_number', 'importance', 'source', 'processed', 'created_at'
    ];
    const field = validFields.includes(orderBy) ? orderBy : 'decision_date';
    
    const sql = `
      SELECT * FROM court_decisions
      ORDER BY ${field} ${direction}
      LIMIT ? OFFSET ?
    `;
    
    db.all(sql, [limit, offset], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Parse JSON fields
        const decisions = rows.map(row => ({
          ...row,
          topics: row.topics ? JSON.parse(row.topics) : [],
          judges: row.judges ? JSON.parse(row.judges) : []
        }));
        resolve(decisions);
      }
    });
  });
}

/**
 * Get a court decision by ID
 * @param {number} id - Decision ID
 * @returns {Promise<Object|null>} Court decision object or null if not found
 */
function getCourtDecisionById(id) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM court_decisions WHERE id = ?';
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        // Parse JSON fields
        const decision = {
          ...row,
          topics: row.topics ? JSON.parse(row.topics) : [],
          judges: row.judges ? JSON.parse(row.judges) : []
        };
        resolve(decision);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Get a court decision by external decision ID with performance optimization
 * @param {string} decisionId - External decision ID
 * @returns {Promise<Object|null>} Court decision object or null if not found
 */
function getCourtDecisionByDecisionId(decisionId) {
  return new Promise((resolve, reject) => {
    // Use index for faster lookup
    const sql = 'SELECT * FROM court_decisions WHERE decision_id = ?';
    
    db.get(sql, [decisionId], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        // Parse JSON fields
        const decision = {
          ...row,
          topics: row.topics ? JSON.parse(row.topics) : [],
          judges: row.judges ? JSON.parse(row.judges) : []
        };
        resolve(decision);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Create a new court decision
 * @param {Object} decision - Court decision object
 * @returns {Promise<number>} ID of the created decision
 */
function createCourtDecision(decision) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO court_decisions 
      (decision_id, court, location, decision_date, case_number, topics, summary, 
       full_text, url, judges, practice_implications, importance, source, processed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      decision.decision_id,
      decision.court,
      decision.location,
      decision.decision_date,
      decision.case_number,
      JSON.stringify(decision.topics || []),
      decision.summary,
      decision.full_text,
      decision.url,
      JSON.stringify(decision.judges || []),
      decision.practice_implications,
      decision.importance,
      decision.source,
      decision.processed ? 1 : 0
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
 * Update a court decision
 * @param {number} id - Decision ID
 * @param {Object} decision - Court decision object
 * @returns {Promise<void>}
 */
function updateCourtDecision(id, decision) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE court_decisions
      SET decision_id = ?, court = ?, location = ?, decision_date = ?, case_number = ?,
          topics = ?, summary = ?, full_text = ?, url = ?, judges = ?,
          practice_implications = ?, importance = ?, source = ?, processed = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const params = [
      decision.decision_id,
      decision.court,
      decision.location,
      decision.decision_date,
      decision.case_number,
      JSON.stringify(decision.topics || []),
      decision.summary,
      decision.full_text,
      decision.url,
      JSON.stringify(decision.judges || []),
      decision.practice_implications,
      decision.importance,
      decision.source,
      decision.processed ? 1 : 0,
      id
    ];
    
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Delete a court decision by ID
 * @param {number} id - Decision ID
 * @returns {Promise<void>}
 */
function deleteCourtDecision(id) {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM court_decisions WHERE id = ?';
    db.run(sql, [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Mark a court decision as processed
 * @param {number} id - Decision ID
 * @returns {Promise<void>}
 */
function markDecisionAsProcessed(id) {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE court_decisions SET processed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(sql, [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get count of court decisions
 * @returns {Promise<number>} Total count of court decisions
 */
function getCourtDecisionsCount() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT COUNT(*) as count FROM court_decisions';
    db.get(sql, [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count);
      }
    });
  });
}

/**
 * Get count of unprocessed court decisions
 * @returns {Promise<number>} Count of unprocessed court decisions
 */
function getUnprocessedCourtDecisionsCount() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT COUNT(*) as count FROM court_decisions WHERE processed = 0';
    db.get(sql, [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count);
      }
    });
  });
}

/**
 * Get recent court decisions for performance optimization
 * @param {Object} options - Query options
 * @param {string} options.since - Date string to filter decisions from
 * @param {number} options.limit - Maximum number of results
 * @returns {Promise<Array>} Array of recent court decision objects
 */
function getRecentCourtDecisions(options = {}) {
  return new Promise((resolve, reject) => {
    const {
      since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to last 7 days
      limit = 50
    } = options;
    
    // Use index on decision_date for faster lookup
    const sql = `
      SELECT * FROM court_decisions
      WHERE decision_date >= ?
      ORDER BY decision_date DESC
      LIMIT ?
    `;
    
    db.all(sql, [since, limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Parse JSON fields
        const decisions = rows.map(row => ({
          ...row,
          topics: row.topics ? JSON.parse(row.topics) : [],
          judges: row.judges ? JSON.parse(row.judges) : []
        }));
        resolve(decisions);
      }
    });
  });
}

/**
 * Get court decisions by importance level for performance optimization
 * @param {string} importance - Importance level (high, medium, low)
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of results
 * @returns {Promise<Array>} Array of court decision objects
 */
function getCourtDecisionsByImportance(importance, options = {}) {
  return new Promise((resolve, reject) => {
    const { limit = 50 } = options;
    
    // Use index on importance for faster lookup
    const sql = `
      SELECT * FROM court_decisions
      WHERE importance = ?
      ORDER BY decision_date DESC
      LIMIT ?
    `;
    
    db.all(sql, [importance, limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Parse JSON fields
        const decisions = rows.map(row => ({
          ...row,
          topics: row.topics ? JSON.parse(row.topics) : [],
          judges: row.judges ? JSON.parse(row.judges) : []
        }));
        resolve(decisions);
      }
    });
  });
}

/**
 * Get unprocessed court decisions for performance optimization
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of results
 * @returns {Promise<Array>} Array of unprocessed court decision objects
 */
function getUnprocessedCourtDecisions(options = {}) {
  return new Promise((resolve, reject) => {
    const { limit = 50 } = options;
    
    // Use index on processed for faster lookup
    const sql = `
      SELECT * FROM court_decisions
      WHERE processed = 0
      ORDER BY decision_date DESC
      LIMIT ?
    `;
    
    db.all(sql, [limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Parse JSON fields
        const decisions = rows.map(row => ({
          ...row,
          topics: row.topics ? JSON.parse(row.topics) : [],
          judges: row.judges ? JSON.parse(row.judges) : []
        }));
        resolve(decisions);
      }
    });
  });
}

// Export functions
module.exports = {
  getAllCourtDecisions,
  getCourtDecisionById,
  getCourtDecisionByDecisionId,
  createCourtDecision,
  updateCourtDecision,
  deleteCourtDecision,
  markDecisionAsProcessed,
  getCourtDecisionsCount,
  getUnprocessedCourtDecisionsCount,
  getRecentCourtDecisions,
  getCourtDecisionsByImportance,
  getUnprocessedCourtDecisions
};
