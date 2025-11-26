/**
 * API routes for Mietrecht Webinterface
 */

const express = require('express');
const router = express.Router();

// Import DAOs
const LawyerDAO = require('../database/dao/LawyerDAO');
const LawyerPreferencesDAO = require('../database/dao/LawyerPreferencesDAO');
const CourtDecisionDAO = require('../database/dao/CourtDecisionDAO');
const NewsletterDAO = require('../database/dao/NewsletterDAO');

// Import middleware
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const {
  validateLawyer,
  validatePreferences,
  validateCourtDecision
} = require('../middleware/validation');

// Lawyers API
router.get('/lawyers', authenticateAdmin, async (req, res) => {
  try {
    // In a real implementation, you would implement pagination
    const lawyers = await LawyerDAO.getAll();
    res.json(lawyers);
  } catch (error) {
    console.error('Error fetching lawyers:', error);
    res.status(500).json({ error: 'Failed to fetch lawyers' });
  }
});

router.get('/lawyers/:id', authenticate, async (req, res) => {
  try {
    const lawyerId = parseInt(req.params.id);
    
    // Regular users can only access their own data
    if (req.lawyer.id !== lawyerId && !req.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const lawyer = await LawyerDAO.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }
    
    res.json(lawyer);
  } catch (error) {
    console.error('Error fetching lawyer:', error);
    res.status(500).json({ error: 'Failed to fetch lawyer' });
  }
});

router.post('/lawyers', validateLawyer, async (req, res) => {
  try {
    const { name, email, password, lawFirm } = req.body;
    
    // Check if lawyer already exists
    const existingLawyer = await LawyerDAO.findByEmail(email);
    if (existingLawyer) {
      return res.status(409).json({ error: 'Lawyer with this email already exists' });
    }
    
    // Create lawyer
    const lawyer = await LawyerDAO.create({ name, email, password, lawFirm });
    res.status(201).json(lawyer);
  } catch (error) {
    console.error('Error creating lawyer:', error);
    res.status(500).json({ error: 'Failed to create lawyer' });
  }
});

router.put('/lawyers/:id', authenticate, validateLawyer, async (req, res) => {
  try {
    const lawyerId = parseInt(req.params.id);
    
    // Users can only update their own data
    if (req.lawyer.id !== lawyerId && !req.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, lawFirm } = req.body;
    const lawyer = await LawyerDAO.update(lawyerId, { name, lawFirm });
    
    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }
    
    res.json(lawyer);
  } catch (error) {
    console.error('Error updating lawyer:', error);
    res.status(500).json({ error: 'Failed to update lawyer' });
  }
});

router.delete('/lawyers/:id', authenticate, async (req, res) => {
  try {
    const lawyerId = parseInt(req.params.id);
    
    // Users can only delete their own data
    if (req.lawyer.id !== lawyerId && !req.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const lawyer = await LawyerDAO.delete(lawyerId);
    
    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }
    
    res.json({ message: 'Lawyer deleted successfully' });
  } catch (error) {
    console.error('Error deleting lawyer:', error);
    res.status(500).json({ error: 'Failed to delete lawyer' });
  }
});

// Preferences API
router.get('/lawyers/:id/preferences', authenticate, async (req, res) => {
  try {
    const lawyerId = parseInt(req.params.id);
    
    // Users can only access their own preferences
    if (req.lawyer.id !== lawyerId && !req.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const preferences = await LawyerPreferencesDAO.getByLawyerId(lawyerId);
    res.json(preferences || {});
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

router.post('/lawyers/:id/preferences', authenticate, validatePreferences, async (req, res) => {
  try {
    const lawyerId = parseInt(req.params.id);
    
    // Users can only update their own preferences
    if (req.lawyer.id !== lawyerId && !req.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const preferences = await LawyerPreferencesDAO.create(lawyerId, req.body);
    res.status(201).json(preferences);
  } catch (error) {
    console.error('Error creating preferences:', error);
    res.status(500).json({ error: 'Failed to create preferences' });
  }
});

router.put('/lawyers/:id/preferences', authenticate, validatePreferences, async (req, res) => {
  try {
    const lawyerId = parseInt(req.params.id);
    
    // Users can only update their own preferences
    if (req.lawyer.id !== lawyerId && !req.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const preferences = await LawyerPreferencesDAO.update(lawyerId, req.body);
    res.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

router.delete('/lawyers/:id/preferences', authenticate, async (req, res) => {
  try {
    const lawyerId = parseInt(req.params.id);
    
    // Users can only delete their own preferences
    if (req.lawyer.id !== lawyerId && !req.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const preferences = await LawyerPreferencesDAO.delete(lawyerId);
    res.json({ message: 'Preferences deleted successfully' });
  } catch (error) {
    console.error('Error deleting preferences:', error);
    res.status(500).json({ error: 'Failed to delete preferences' });
  }
});

// Court Decisions API
router.get('/decisions', async (req, res) => {
  try {
    // Extract query parameters
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const decisions = await CourtDecisionDAO.getAll(limit, offset);
    res.json(decisions);
  } catch (error) {
    console.error('Error fetching court decisions:', error);
    res.status(500).json({ error: 'Failed to fetch court decisions' });
  }
});

router.get('/decisions/:id', async (req, res) => {
  try {
    const decisionId = parseInt(req.params.id);
    const decision = await CourtDecisionDAO.getById(decisionId);
    
    if (!decision) {
      return res.status(404).json({ error: 'Court decision not found' });
    }
    
    res.json(decision);
  } catch (error) {
    console.error('Error fetching court decision:', error);
    res.status(500).json({ error: 'Failed to fetch court decision' });
  }
});

router.post('/decisions', authenticateAdmin, validateCourtDecision, async (req, res) => {
  try {
    const decision = await CourtDecisionDAO.create(req.body);
    res.status(201).json(decision);
  } catch (error) {
    console.error('Error creating court decision:', error);
    res.status(500).json({ error: 'Failed to create court decision' });
  }
});

router.put('/decisions/:id', authenticateAdmin, validateCourtDecision, async (req, res) => {
  try {
    const decisionId = parseInt(req.params.id);
    const decision = await CourtDecisionDAO.update(decisionId, req.body);
    
    if (!decision) {
      return res.status(404).json({ error: 'Court decision not found' });
    }
    
    res.json(decision);
  } catch (error) {
    console.error('Error updating court decision:', error);
    res.status(500).json({ error: 'Failed to update court decision' });
  }
});

router.delete('/decisions/:id', authenticateAdmin, async (req, res) => {
  try {
    const decisionId = parseInt(req.params.id);
    const decision = await CourtDecisionDAO.delete(decisionId);
    
    if (!decision) {
      return res.status(404).json({ error: 'Court decision not found' });
    }
    
    res.json({ message: 'Court decision deleted successfully' });
  } catch (error) {
    console.error('Error deleting court decision:', error);
    res.status(500).json({ error: 'Failed to delete court decision' });
  }
});

// Newsletters API
router.get('/newsletters', authenticateAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const newsletters = await NewsletterDAO.getAll(limit, offset);
    res.json(newsletters);
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    res.status(500).json({ error: 'Failed to fetch newsletters' });
  }
});

router.get('/lawyers/:id/newsletters', authenticate, async (req, res) => {
  try {
    const lawyerId = parseInt(req.params.id);
    
    // Users can only access their own newsletters
    if (req.lawyer.id !== lawyerId && !req.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const limit = parseInt(req.query.limit) || 10;
    const newsletters = await NewsletterDAO.getByLawyerId(lawyerId, limit);
    res.json(newsletters);
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    res.status(500).json({ error: 'Failed to fetch newsletters' });
  }
});

module.exports = router;