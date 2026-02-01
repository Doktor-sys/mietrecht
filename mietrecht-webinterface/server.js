/**
 * Webinterface Server for Mietrecht Court Decisions Agent
 */

// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const path = require('path');
const axios = require('axios');

// Import security middleware
const { applySecurityHeaders, applyRateLimiting } = require('./scripts/middleware/securityMiddleware');

// Import database modules
const LawyerDAO = require('./database/dao/LawyerDAO');
const LawyerPreferencesDAO = require('./database/dao/LawyerPreferencesDAO');
const CourtDecisionDAO = require('./database/dao/CourtDecisionDAO');
const NewsletterDAO = require('./database/dao/NewsletterDAO');

// Import middleware
const { authenticate, authenticateAdmin } = require('./middleware/auth');
const {
  validateLawyer,
  validatePreferences,
  validateCourtDecision
} = require('./middleware/validation');

// Import API routes
const apiRoutes = require('./routes/api');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Apply security headers
applySecurityHeaders(app);

// Apply rate limiting
applyRateLimiting(app);

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// For development purposes, we'll create some sample data if the database is empty
// In production, you would have a proper migration system

// Routes

// Home page
app.get('/', (req, res) => {
  res.render('index', { title: 'Mietrecht Agent - Webinterface' });
});

// Login page
app.get('/login', (req, res) => {
  res.render('login', { title: 'Anmeldung - Mietrecht Agent' });
});

// Dashboard
app.get('/dashboard', async (req, res) => {
  try {
    // For demo purposes, we'll use a fixed lawyer ID
    // In a real implementation, this would come from the session
    const lawyerId = 1;
    const lawyer = await LawyerDAO.findById(lawyerId);
    
    if (!lawyer) {
      return res.status(404).render('error', { 
        title: 'Nicht gefunden - Mietrecht Agent',
        message: 'Anwalt nicht gefunden.'
      });
    }
    
    res.render('dashboard', { 
      title: 'Dashboard - Mietrecht Agent',
      lawyer: lawyer
    });
  } catch (error) {
    console.error('Error fetching lawyer:', error);
    // Fallback to mock data if database is not available
    const mockLawyer = {
      id: 1,
      name: "Max Mustermann",
      email: "max.mustermann@lawfirm.de",
      law_firm: "Mustermann & Partner",
      created_at: new Date().toISOString()
    };
    res.render('dashboard', { 
      title: 'Dashboard - Mietrecht Agent',
      lawyer: mockLawyer
    });
  }
});

// Preferences page
app.get('/preferences', async (req, res) => {
  try {
    const lawyerId = 1; // For demo purposes, we'll use a fixed lawyer ID
    const lawyer = await LawyerDAO.findById(lawyerId);
    const preferences = await LawyerPreferencesDAO.getByLawyerId(lawyerId);
    
    if (!lawyer) {
      return res.status(404).render('error', { 
        title: 'Nicht gefunden - Mietrecht Agent',
        message: 'Anwalt nicht gefunden.'
      });
    }
    
    res.render('preferences', { 
      title: 'Einstellungen - Mietrecht Agent',
      lawyer: {
        ...lawyer,
        preferences: preferences || {
          courtLevels: [],
          topics: [],
          frequency: 'weekly',
          regions: []
        }
      }
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    // Fallback to mock data if database is not available
    const mockLawyer = {
      id: 1,
      name: "Max Mustermann",
      email: "max.mustermann@lawfirm.de",
      law_firm: "Mustermann & Partner",
      created_at: new Date().toISOString(),
      preferences: {
        courtLevels: ["Bundesgerichtshof", "Landgericht"],
        topics: ["Mietminderung", "Kündigung", "Nebenkosten"],
        frequency: "weekly",
        regions: ["Berlin", "Brandenburg"]
      }
    };
    res.render('preferences', { 
      title: 'Einstellungen - Mietrecht Agent',
      lawyer: mockLawyer
    });
  }
});

// Save preferences
app.post('/preferences', async (req, res) => {
  try {
    const lawyerId = 1; // For demo purposes, we'll use a fixed lawyer ID
    
    // Extract data from request body
    const { courtLevels, topics, frequency, regions } = req.body;
    
    // Convert comma-separated values to arrays
    const courtLevelsArray = courtLevels ? courtLevels.split(',').map(item => item.trim()) : [];
    const topicsArray = topics ? topics.split(',').map(item => item.trim()) : [];
    const regionsArray = regions ? regions.split(',').map(item => item.trim()) : [];
    
    // Check if preferences already exist
    const existingPreferences = await LawyerPreferencesDAO.getByLawyerId(lawyerId);
    
    if (existingPreferences) {
      // Update existing preferences
      await LawyerPreferencesDAO.update(lawyerId, {
        courtLevels: courtLevelsArray,
        topics: topicsArray,
        frequency: frequency || 'weekly',
        regions: regionsArray
      });
    } else {
      // Create new preferences
      await LawyerPreferencesDAO.create(lawyerId, {
        courtLevels: courtLevelsArray,
        topics: topicsArray,
        frequency: frequency || 'weekly',
        regions: regionsArray
      });
    }
    
    res.redirect('/dashboard?saved=true');
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).render('error', { 
      title: 'Fehler - Mietrecht Agent',
      message: 'Ein Fehler ist beim Speichern der Einstellungen aufgetreten.'
    });
  }
});

// Newsletter archive
app.get('/archive', async (req, res) => {
  try {
    // Fetch recent court decisions from database
    const decisions = await CourtDecisionDAO.getRecent(20);
    
    res.render('archive', { 
      title: 'Newsletter-Archiv - Mietrecht Agent',
      decisions: decisions
    });
  } catch (error) {
    console.error('Error fetching court decisions:', error);
    // Fallback to mock data if database is not available
    const mockCourtDecisions = [
      {
        id: 1,
        court: "Bundesgerichtshof",
        location: "Karlsruhe",
        date: "2025-11-15",
        case_number: "VIII ZR 121/24",
        topics: ["Mietminderung", "Schimmelbefall"],
        summary: "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern, selbst wenn dieser teilweise auf eigenes Verschulden zurückzuführen ist.",
        content: "Der Bundesgerichtshof hat entschieden, dass ein Mieter bei Vorliegen eines schwerwiegenden Schimmelbefalls die Miete mindern kann, auch wenn der Schimmel teilweise auf eigenes Verschulden des Mieters zurückzuführen ist. Die Entscheidung berücksichtigt das Gebot der Verhältnismäßigkeit.",
        url: "https://www.bundesgerichtshof.de/blob/[...]",
        judges: ["Präsident Dr. Müller", "Richter Schmidt", "Richter Weber"],
        practiceImplications: "Diese Entscheidung erweitert den Schutz von Mietern bei Schimmelbefall. Anwälte sollten bei Mietminderungsverlangen nicht mehr automatisch das eigene Verschulden des Mieters als Ausschlussgrund prüfen, sondern eine Einzelfallbetrachtung durchführen.",
        importance: "high"
      },
      {
        id: 2,
        court: "Landgericht",
        location: "Berlin",
        date: "2025-11-10",
        case_number: "34 M 12/25",
        topics: ["Kündigung", "Modernisierung"],
        summary: "Eine Kündigung wegen Eigenbedarf ist unzulässig, wenn die Modernisierungsmaßnahmen nicht ordnungsgemäß angekündigt wurden.",
        content: "Das Landgericht Berlin hat entschieden, dass eine Kündigung wegen Eigenbedarf unzulässig ist, wenn die erforderlichen Modernisierungsmaßnahmen nicht mindestens drei Monate vorher ordnungsgemäß angekündigt wurden. Die ordnungsgemäße Ankündigung ist Voraussetzung für die Zulässigkeit der Kündigung.",
        url: "https://www.berlin.landgericht.de/[...]",
        judges: ["Richterin Fischer", "Richter Klein"],
        practiceImplications: "Vermieteranwälte müssen bei Eigenbedarfskündigungen unbedingt prüfen, ob die Modernisierungsankündigung fristgerecht erfolgt ist. Mieteranwälte können bei mangelnder Ankündigung die Kündigung angreifen.",
        importance: "medium"
      }
    ];
    res.render('archive', { 
      title: 'Newsletter-Archiv - Mietrecht Agent',
      decisions: mockCourtDecisions
    });
  }
});

// Single decision page
app.get('/decision/:id', async (req, res) => {
  try {
    const decisionId = parseInt(req.params.id);
    const decision = await CourtDecisionDAO.getById(decisionId);
    
    if (!decision) {
      return res.status(404).render('error', { 
        title: 'Nicht gefunden - Mietrecht Agent',
        message: 'Die angeforderte Entscheidung wurde nicht gefunden.'
      });
    }
    
    res.render('decision', { 
      title: `Entscheidung ${decision.case_number} - Mietrecht Agent`,
      decision: decision
    });
  } catch (error) {
    console.error('Error fetching court decision:', error);
    // Fallback to mock data if database is not available
    const mockDecision = {
      id: 1,
      court: "Bundesgerichtshof",
      location: "Karlsruhe",
      date: "2025-11-15",
      case_number: "VIII ZR 121/24",
      topics: ["Mietminderung", "Schimmelbefall"],
      summary: "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern, selbst wenn dieser teilweise auf eigenes Verschulden zurückzuführen ist.",
      content: "Der Bundesgerichtshof hat entschieden, dass ein Mieter bei Vorliegen eines schwerwiegenden Schimmelbefalls die Miete mindern kann, auch wenn der Schimmel teilweise auf eigenes Verschulden des Mieters zurückzuführen ist. Die Entscheidung berücksichtigt das Gebot der Verhältnismäßigkeit.",
      url: "https://www.bundesgerichtshof.de/blob/[...]",
      judges: ["Präsident Dr. Müller", "Richter Schmidt", "Richter Weber"],
      practiceImplications: "Diese Entscheidung erweitert den Schutz von Mietern bei Schimmelbefall. Anwälte sollten bei Mietminderungsverlangen nicht mehr automatisch das eigene Verschulden des Mieters als Ausschlussgrund prüfen, sondern eine Einzelfallbetrachtung durchführen.",
      importance: "high"
    };
    res.render('decision', { 
      title: `Entscheidung ${mockDecision.case_number} - Mietrecht Agent`,
      decision: mockDecision
    });
  }
});

// Search page
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    let results = [];
    
    if (query) {
      // Search court decisions in database
      results = await CourtDecisionDAO.search(query, 20);
    }
    
    res.render('search', { 
      title: 'Suche - Mietrecht Agent',
      query: query,
      results: results
    });
  } catch (error) {
    console.error('Error searching court decisions:', error);
    // Fallback to mock data if database is not available
    const mockResults = [
      {
        id: 1,
        court: "Bundesgerichtshof",
        location: "Karlsruhe",
        date: "2025-11-15",
        case_number: "VIII ZR 121/24",
        topics: ["Mietminderung", "Schimmelbefall"],
        summary: "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern, selbst wenn dieser teilweise auf eigenes Verschulden zurückzuführen ist.",
        importance: "high"
      }
    ];
    res.render('search', { 
      title: 'Suche - Mietrecht Agent',
      query: query,
      results: query ? mockResults : []
    });
  }
});

// API endpoint to fetch court decisions
app.get('/api/decisions', async (req, res) => {
  try {
    // Fetch court decisions from database
    const decisions = await CourtDecisionDAO.getAll(20, 0);
    res.json(decisions);
  } catch (error) {
    console.error('Error fetching court decisions:', error);
    // Fallback to mock data if database is not available
    const mockDecisions = [
      {
        id: 1,
        court: "Bundesgerichtshof",
        location: "Karlsruhe",
        date: "2025-11-15",
        case_number: "VIII ZR 121/24",
        topics: ["Mietminderung", "Schimmelbefall"],
        summary: "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern, selbst wenn dieser teilweise auf eigenes Verschulden zurückzuführen ist.",
        importance: "high"
      }
    ];
    res.json(mockDecisions);
  }
});

// API endpoint to fetch lawyer preferences
app.get('/api/lawyer/:id', async (req, res) => {
  try {
    const lawyerId = parseInt(req.params.id);
    const lawyer = await LawyerDAO.findById(lawyerId);
    const preferences = await LawyerPreferencesDAO.getByLawyerId(lawyerId);
    
    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }
    
    res.json({
      ...lawyer,
      preferences: preferences
    });
  } catch (error) {
    console.error('Error fetching lawyer:', error);
    // Fallback to mock data if database is not available
    const mockLawyer = {
      id: 1,
      name: "Max Mustermann",
      email: "max.mustermann@lawfirm.de",
      law_firm: "Mustermann & Partner",
      preferences: {
        courtLevels: ["Bundesgerichtshof", "Landgericht"],
        topics: ["Mietminderung", "Kündigung", "Nebenkosten"],
        frequency: "weekly",
        regions: ["Berlin", "Brandenburg"]
      }
    };
    res.json(mockLawyer);
  }
});

// Error handling
app.use((req, res) => {
  res.status(404).render('error', { 
    title: 'Nicht gefunden - Mietrecht Agent',
    message: 'Die angeforderte Seite wurde nicht gefunden.'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mietrecht Webinterface listening at http://localhost:${PORT}`);
});

module.exports = app;