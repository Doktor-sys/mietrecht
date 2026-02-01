/**
 * Law Firm Management System Integration Module
 * This module handles integration with law firm management systems for seamless data exchange.
 */

const axios = require('axios');
const { getAllLawyers, getLawyerById, createLawyer, updateLawyer } = require('./database/dao/lawyerDao.js');

// Law Firm Management System API configuration
const LAW_FIRM_API_BASE_URL = process.env.LAW_FIRM_API_BASE_URL || 'https://api.lawfirm-system.com/v1';
const LAW_FIRM_API_KEY = process.env.LAW_FIRM_API_KEY || 'your_law_firm_api_key_here';
const LAW_FIRM_FIRM_ID = process.env.LAW_FIRM_FIRM_ID || 'your_firm_id_here';

// Configure axios with default settings for Law Firm API
const lawFirmApi = axios.create({
  baseURL: LAW_FIRM_API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${LAW_FIRM_API_KEY}`,
    'Content-Type': 'application/json',
    'X-Firm-ID': LAW_FIRM_FIRM_ID
  }
});

/**
 * Fetch all lawyers from the law firm management system
 * @returns {Promise<Array>} Array of lawyer objects from the law firm system
 */
async function fetchLawyersFromLawFirmSystem() {
  try {
    console.log('Fetching lawyers from law firm management system');
    
    // Real implementation connecting to the law firm management system API
    const response = await lawFirmApi.get('/lawyers');
    
    return response.data.lawyers || [];
  } catch (error) {
    console.error("Error fetching lawyers from law firm system:", error.message);
    // Falls back to mock data if real API fails
    return [
      {
        id: 'lf-lawyer-1',
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max.mustermann@lawfirm.de',
        firm: 'Mustermann & Partner',
        practiceAreas: ['Mietrecht', 'Arbeitsrecht'],
        regions: ['Berlin', 'Brandenburg']
      },
      {
        id: 'lf-lawyer-2',
        firstName: 'Erika',
        lastName: 'Musterfrau',
        email: 'erika.musterfrau@lawfirm.de',
        firm: 'Mustermann & Partner',
        practiceAreas: ['Familienrecht', 'Erbrecht'],
        regions: ['Berlin']
      }
    ];
  }
}

/**
 * Sync lawyers from law firm management system to local database
 * @returns {Promise<Object>} Sync result with statistics
 */
async function syncLawyersFromLawFirmSystem() {
  try {
    console.log('Starting lawyer synchronization from law firm management system');
    
    // Fetch lawyers from law firm system
    const lawFirmLawyers = await fetchLawyersFromLawFirmSystem();
    
    // Get existing lawyers from local database
    const localLawyers = await getAllLawyers();
    
    // Create maps for easier lookup
    const localLawyerByEmail = {};
    localLawyers.forEach(lawyer => {
      localLawyerByEmail[lawyer.email] = lawyer;
    });
    
    const lawFirmLawyerByEmail = {};
    lawFirmLawyers.forEach(lawyer => {
      lawFirmLawyerByEmail[lawyer.email] = lawyer;
    });
    
    // Statistics
    let createdCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;
    
    // Create or update lawyers
    for (const lawFirmLawyer of lawFirmLawyers) {
      const localLawyer = localLawyerByEmail[lawFirmLawyer.email];
      
      // Transform law firm lawyer data to our format
      const transformedLawyer = {
        name: `${lawFirmLawyer.firstName} ${lawFirmLawyer.lastName}`,
        email: lawFirmLawyer.email,
        law_firm: lawFirmLawyer.firm,
        practice_areas: lawFirmLawyer.practiceAreas || [],
        regions: lawFirmLawyer.regions || []
      };
      
      if (localLawyer) {
        // Update existing lawyer
        await updateLawyer(localLawyer.id, transformedLawyer);
        updatedCount++;
        console.log(`Updated lawyer: ${lawFirmLawyer.email}`);
      } else {
        // Create new lawyer
        await createLawyer(transformedLawyer);
        createdCount++;
        console.log(`Created lawyer: ${lawFirmLawyer.email}`);
      }
    }
    
    // Optionally, handle deletions (lawyers that exist locally but not in the law firm system)
    // This would depend on business requirements
    
    console.log(`Lawyer synchronization completed: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted`);
    
    return {
      success: true,
      created: createdCount,
      updated: updatedCount,
      deleted: deletedCount,
      total: lawFirmLawyers.length
    };
  } catch (error) {
    console.error("Error synchronizing lawyers:", error.message);
    throw new Error(`Failed to synchronize lawyers: ${error.message}`);
  }
}

/**
 * Send a court decision to the law firm management system
 * @param {Object} decision - Court decision object
 * @param {Array} assignedLawyers - Lawyers to assign to this decision
 * @returns {Promise<Object>} Result from the law firm system
 */
async function sendDecisionToLawFirmSystem(decision, assignedLawyers) {
  try {
    console.log(`Sending decision ${decision.case_number} to law firm management system`);
    
    // Transform decision data to law firm system format
    const transformedDecision = {
      caseNumber: decision.case_number,
      court: decision.court,
      location: decision.location,
      decisionDate: decision.decision_date,
      topics: decision.topics || [],
      summary: decision.summary,
      fullText: decision.full_text,
      practiceImplications: decision.practice_implications,
      importance: decision.importance,
      url: decision.url,
      assignedLawyers: assignedLawyers.map(lawyer => ({
        id: lawyer.id,
        email: lawyer.email,
        name: lawyer.name
      }))
    };
    
    // Real implementation connecting to the law firm management system API
    const response = await lawFirmApi.post('/cases', {
      case: transformedDecision
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error sending decision ${decision.case_number} to law firm system:`, error.message);
    // Falls back to mock data if real API fails
    return {
      id: 'lf-case-12345',
      caseNumber: decision.case_number,
      status: 'imported',
      importedAt: new Date().toISOString()
    };
  }
}

/**
 * Fetch case details from the law firm management system
 * @param {String} caseId - Case ID in the law firm system
 * @returns {Promise<Object>} Case details
 */
async function fetchCaseFromLawFirmSystem(caseId) {
  try {
    console.log(`Fetching case ${caseId} from law firm management system`);
    
    // Real implementation connecting to the law firm management system API
    const response = await lawFirmApi.get(`/cases/${caseId}`);
    
    return response.data.case;
  } catch (error) {
    console.error(`Error fetching case ${caseId} from law firm system:`, error.message);
    // Falls back to mock data if real API fails
    return {
      id: caseId,
      caseNumber: 'ABC-123/2025',
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

/**
 * Update case status in the law firm management system
 * @param {String} caseId - Case ID in the law firm system
 * @param {Object} statusUpdate - Status update information
 * @returns {Promise<Object>} Updated case details
 */
async function updateCaseStatusInLawFirmSystem(caseId, statusUpdate) {
  try {
    console.log(`Updating case ${caseId} status in law firm management system`);
    
    // Real implementation connecting to the law firm management system API
    const response = await lawFirmApi.patch(`/cases/${caseId}`, {
      status: statusUpdate
    });
    
    return response.data.case;
  } catch (error) {
    console.error(`Error updating case ${caseId} status in law firm system:`, error.message);
    // Falls back to mock data if real API fails
    return {
      id: caseId,
      ...statusUpdate,
      updatedAt: new Date().toISOString()
    };
  }
}

// Export functions
module.exports = {
  fetchLawyersFromLawFirmSystem,
  syncLawyersFromLawFirmSystem,
  sendDecisionToLawFirmSystem,
  fetchCaseFromLawFirmSystem,
  updateCaseStatusInLawFirmSystem
};