/**
 * Lawyer DAO
 * This module provides data access methods for lawyers and their preferences.
 */

const { db } = require('../connection.js');

/**
 * Get all lawyers
 * @returns {Promise<Array>} Array of lawyer objects
 */
function getAllLawyers() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT l.*, lp.court_levels, lp.topics, lp.frequency, lp.importance_threshold
      FROM lawyers l
      LEFT JOIN lawyer_preferences lp ON l.id = lp.lawyer_id
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Parse JSON fields
        const lawyers = rows.map(row => ({
          ...row,
          practice_areas: row.practice_areas ? JSON.parse(row.practice_areas) : [],
          regions: row.regions ? JSON.parse(row.regions) : [],
          court_levels: row.court_levels ? JSON.parse(row.court_levels) : [],
          topics: row.topics ? JSON.parse(row.topics) : []
        }));
        resolve(lawyers);
      }
    });
  });
}

/**
 * Get a lawyer by ID
 * @param {number} id - Lawyer ID
 * @returns {Promise<Object|null>} Lawyer object or null if not found
 */
function getLawyerById(id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT l.*, lp.court_levels, lp.topics, lp.frequency, lp.importance_threshold
      FROM lawyers l
      LEFT JOIN lawyer_preferences lp ON l.id = lp.lawyer_id
      WHERE l.id = ?
    `;
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        // Parse JSON fields
        const lawyer = {
          ...row,
          practice_areas: row.practice_areas ? JSON.parse(row.practice_areas) : [],
          regions: row.regions ? JSON.parse(row.regions) : [],
          court_levels: row.court_levels ? JSON.parse(row.court_levels) : [],
          topics: row.topics ? JSON.parse(row.topics) : []
        };
        resolve(lawyer);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Create a new lawyer
 * @param {Object} lawyer - Lawyer object
 * @returns {Promise<number>} ID of the created lawyer
 */
function createLawyer(lawyer) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Insert lawyer
      const lawyerSql = `
        INSERT INTO lawyers (name, email, law_firm, practice_areas, regions)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const lawyerParams = [
        lawyer.name,
        lawyer.email,
        lawyer.law_firm,
        JSON.stringify(lawyer.practice_areas || []),
        JSON.stringify(lawyer.regions || [])
      ];
      
      db.run(lawyerSql, lawyerParams, function(err) {
        if (err) {
          return reject(err);
        }
        
        const lawyerId = this.lastID;
        
        // Insert preferences if provided
        if (lawyer.preferences) {
          const prefSql = `
            INSERT INTO lawyer_preferences (lawyer_id, court_levels, topics, frequency, importance_threshold)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          const prefParams = [
            lawyerId,
            JSON.stringify(lawyer.preferences.court_levels || []),
            JSON.stringify(lawyer.preferences.topics || []),
            lawyer.preferences.frequency,
            lawyer.preferences.importance_threshold
          ];
          
          db.run(prefSql, prefParams, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(lawyerId);
            }
          });
        } else {
          resolve(lawyerId);
        }
      });
    });
  });
}

/**
 * Update a lawyer
 * @param {number} id - Lawyer ID
 * @param {Object} lawyer - Lawyer object
 * @returns {Promise<void>}
 */
function updateLawyer(id, lawyer) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Update lawyer
      const lawyerSql = `
        UPDATE lawyers
        SET name = ?, email = ?, law_firm = ?, practice_areas = ?, regions = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const lawyerParams = [
        lawyer.name,
        lawyer.email,
        lawyer.law_firm,
        JSON.stringify(lawyer.practice_areas || []),
        JSON.stringify(lawyer.regions || []),
        id
      ];
      
      db.run(lawyerSql, lawyerParams, function(err) {
        if (err) {
          return reject(err);
        }
        
        // Update or insert preferences
        const prefSql = `
          INSERT OR REPLACE INTO lawyer_preferences 
          (lawyer_id, court_levels, topics, frequency, importance_threshold, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        const prefParams = [
          id,
          JSON.stringify(lawyer.preferences?.court_levels || []),
          JSON.stringify(lawyer.preferences?.topics || []),
          lawyer.preferences?.frequency,
          lawyer.preferences?.importance_threshold
        ];
        
        db.run(prefSql, prefParams, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  });
}

/**
 * Delete a lawyer by ID
 * @param {number} id - Lawyer ID
 * @returns {Promise<void>}
 */
function deleteLawyer(id) {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM lawyers WHERE id = ?';
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
 * Get the count of all lawyers
 * @returns {Promise<number>} Number of lawyers
 */
function getLawyersCount() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT COUNT(*) as count FROM lawyers';
    db.get(sql, [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count);
      }
    });
  });
}

// Export functions
module.exports = {
  getAllLawyers,
  getLawyerById,
  createLawyer,
  updateLawyer,
  deleteLawyer,
  getLawyersCount
};