/**
 * Mietrecht Agent
 * This script automates the process of checking for new court decisions related to rental law.
 */


// Import database modules
const { initializeDatabase, closeDatabase } = require('./database/connection.js');
const { getConfigValue, setConfigValue, getAllConfig } = require('./database/dao/configDao.js');
const { createLawyer, getAllLawyers } = require('./database/dao/lawyerDao.js');
const { createCourtDecision, getCourtDecisionByDecisionId } = require('./database/dao/courtDecisionDao.js');
const { createLogEntry } = require('./database/dao/systemLogDao.js');
const { updateDataSourceStatus } = require('./database/dao/dataSourceStatusDao.js');

// Import analytics modules
const { performComprehensiveAnalysis } = require('./analytics/decisionAnalyzer.js');
const { performPerformanceAnalysis } = require('./analytics/performanceAnalyzer.js');
const { generateAllReports } = require('./analytics/reportGenerator.js');

// Import ML modules
const { generateEnhancedPredictiveAnalysis } = require('./ml/predictiveLegalModel.js');
const { batchAutoCategorize } = require('./ml/automaticCategorizer.js');
const { getPersonalizedRecommendations } = require('./ml/personalizedRecommender.js');

// Import notification modules
const { NotificationManager } = require('./notifications/notificationManager.js');

/**
 * Main function to run the Mietrecht Agent
 */
async function runMietrechtAgent() {
  try {
    // Initialize database
    await initializeDatabase();
    await createLogEntry('info', 'Mietrecht Agent started');
    
    // Load configuration from database or use defaults
    const config = await loadConfiguration();
    
    // Initialize notification manager
    const notificationManager = new NotificationManager({
      email: config.email,
      sms: { enabled: false },
      push: { enabled: false },
      adminRecipients: ['admin@example.com'] // This should be configurable
    });
    
    // Load lawyers from database
    const lawyers = await getAllLawyers();
    
    console.log('Mietrecht Agent is running...');
    console.log(`Checking for new court decisions for ${lawyers.length} lawyers...`);
    
    // Update data source status
    await updateDataSourceStatus('bgh', 'checking');
    
    // Check BGH for new decisions with performance optimizations
    const newDecisions = await checkBGHForNewDecisions(config);
    
    if (newDecisions.length > 0) {
      console.log(`Found ${newDecisions.length} new decisions`);
      
      // Process each new decision
      for (const decision of newDecisions) {
        // Check if decision already exists in database
        const existingDecision = await getCourtDecisionByDecisionId(decision.id);
        
        if (!existingDecision) {
          // Auto-categorize the decision using ML
          const categorizedDecision = await autoCategorizeDecision(decision, lawyers);
          
          // Save new decision to database
          const decisionId = await createCourtDecision({
            decision_id: decision.id,
            court: decision.court,
            location: decision.location,
            decision_date: decision.date,
            case_number: decision.caseNumber,
            topics: categorizedDecision.topics,
            summary: decision.summary,
            full_text: decision.fullText,
            url: decision.url,
            judges: decision.judges,
            practice_implications: decision.practiceImplications,
            importance: categorizedDecision.importance,
            source: 'bgh',
            processed: false
          });
          
          console.log(`Saved new decision with ID: ${decisionId}`);
          await createLogEntry('info', `New decision saved: ${decision.id}`);
          
          // Send notifications to relevant lawyers
          await notifyLawyers(decision, lawyers, notificationManager);
        } else {
          console.log(`Decision ${decision.id} already exists in database`);
        }
      }
    } else {
      console.log('No new decisions found');
    }
    
    // Perform periodic analysis (e.g., every 10 runs)
    const runCount = await getRunCount();
    if (runCount % 10 === 0) {
      console.log('Performing periodic analysis...');
      await performPeriodicAnalysis();
      
      // Generate personalized recommendations for lawyers
      console.log('Generating personalized recommendations...');
      await generatePersonalizedRecommendations(lawyers);
    }
    
    // Check for system alerts
    console.log('Checking for system alerts...');
    await notificationManager.checkForAlerts();
    
    // Update data source status
    await updateDataSourceStatus('bgh', 'online', new Date().toISOString());
    await createLogEntry('info', 'Mietrecht Agent finished successfully');
  } catch (error) {
    console.error('Error running Mietrecht Agent:', error);
    await createLogEntry('error', `Error running Mietrecht Agent: ${error.message}`);
    await updateDataSourceStatus('bgh', 'error', new Date().toISOString());
  } finally {
    await closeDatabase();
  }
}


/**
 * Load configuration from database or use defaults
 */
async function loadConfiguration() {
  try {
    // Try to load configuration from database
    const dbConfig = await getAllConfig();
    
    // If we have configuration in database, use it
    if (Object.keys(dbConfig).length > 0) {
      console.log('Loading configuration from database');
      return {
        bgh: {
          baseUrl: dbConfig.bgh_baseUrl || 'https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung',
          searchEndpoint: dbConfig.bgh_searchEndpoint || '/list.py?Gericht=bgh&Art=en',
          userAgent: dbConfig.bgh_userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        email: {
          service: dbConfig.email_service || 'gmail',
          user: dbConfig.email_user || '',
          pass: dbConfig.email_pass || ''
        },
        notification: {
          enabled: dbConfig.notification_enabled === 'true',
          method: dbConfig.notification_method || 'email'
        },
        processing: {
          autoSummarize: dbConfig.processing_autoSummarize === 'true',
          extractTopics: dbConfig.processing_extractTopics === 'true'
        }
      };
    }
  } catch (error) {
    console.warn('Could not load configuration from database, using defaults:', error.message);
  }
  
  // Default configuration
  return {
    bgh: {
      baseUrl: 'https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung',
      searchEndpoint: '/list.py?Gericht=bgh&Art=en',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    email: {
      service: 'gmail',
      user: '',
      pass: ''
    },
    notification: {
      enabled: false,
      method: 'email'
    },
    processing: {
      autoSummarize: true,
      extractTopics: true
    }
  };
}


/**
 * Assess the importance of a decision for lawyers
 */
function assessImportance(decision, lawyers) {
  // This is a simplified importance assessment
  // In a real implementation, this would be more complex
  
  // Check if decision topics match lawyer practice areas
  for (const lawyer of lawyers) {
    const practiceAreas = lawyer.practice_areas || [];
    const decisionTopics = decision.topics || [];
    
    const match = practiceAreas.some(area => 
      decisionTopics.some(topic => topic.toLowerCase().includes(area.toLowerCase()))
    );
    
    if (match) {
      return 'high';
    }
  }
  
  return 'medium';
}

/**
 * Auto-categorize a decision using ML
 */
async function autoCategorizeDecision(decision, lawyers) {
  try {
    // Import the categorization module
    const { autoCategorizeDecision } = require('./ml/automaticCategorizer.js');
    
    // Categorize the decision
    const categorizedDecision = autoCategorizeDecision(decision, lawyers);
    
    console.log(`Auto-categorized decision: ${decision.id}`);
    return categorizedDecision;
  } catch (error) {
    console.error('Error auto-categorizing decision:', error);
    // Fallback to original categorization
    return {
      ...decision,
      topics: decision.topics || [],
      importance: assessImportance(decision, lawyers)
    };
  }
}

/**
 * Generate personalized recommendations for lawyers
 */
async function generatePersonalizedRecommendations(lawyers) {
  try {
    console.log(`Generating personalized recommendations for ${lawyers.length} lawyers...`);
    
    // For each lawyer, generate recommendations
    for (const lawyer of lawyers) {
      try {
        const recommendations = await getPersonalizedRecommendations(lawyer.id, { 
          count: 5, 
          recentOnly: true, 
          days: 30 
        });
        
        console.log(`Generated ${recommendations.length} recommendations for lawyer ${lawyer.name}`);
        
        // In a real implementation, we would send these recommendations to the lawyer
        // For now, we'll just log them
        if (recommendations.length > 0) {
          console.log(`Top recommendation for ${lawyer.name}: ${recommendations[0].decision.case_number || 'N/A'}`);
        }
      } catch (error) {
        console.error(`Error generating recommendations for lawyer ${lawyer.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
  }
}

/**
 * Notify lawyers about a new court decision
 * @param {Object} decision - Court decision data
 * @param {Array} lawyers - All lawyers
 * @param {NotificationManager} notificationManager - Notification manager instance
 */
async function notifyLawyers(decision, lawyers, notificationManager) {
  try {
    // Filter lawyers based on relevance (simplified implementation)
    const relevantLawyers = lawyers.filter(lawyer => {
      // In a real implementation, this would be more sophisticated
      return lawyer.practice_areas && lawyer.practice_areas.includes('Mietrecht');
    });
    
    if (relevantLawyers.length > 0) {
      // Send notifications using the notification manager
      const results = await notificationManager.notifyLawyersAboutDecision(
        decision,
        relevantLawyers
      );
      
      console.log(`Notifications sent to ${results.length} lawyers`);
      
      // Log notification results
      for (const result of results) {
        const successCount = result.results.filter(r => r.success).length;
        await createLogEntry('info', 
          `Notification to ${result.lawyer}: ${successCount}/${result.results.length} channels successful`);
      }
    } else {
      console.log('No relevant lawyers found for this decision');
    }
  } catch (error) {
    console.error('Error notifying lawyers:', error);
    await createLogEntry('error', `Error notifying lawyers: ${error.message}`);
  }
}

/**
 * Check BGH for new court decisions with performance optimizations
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Array of new court decisions
 */
async function checkBGHForNewDecisions(config) {
  try {
    // Import the BGH API client
    const { fetchBGHDecisions } = require('./mietrecht_data_sources.js');
    
    console.log('Checking BGH for new decisions...');
    
    // Calculate date range (last 7 days)
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Format dates for API
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    // Search for decisions with performance optimizations
    const options = {
      query: 'mietrecht',
      dateFrom: formatDate(oneWeekAgo),
      dateTo: formatDate(today)
    };
    
    // Use caching, rate limiting, and retry mechanisms
    const decisions = await fetchBGHDecisions(options);
    
    console.log(`Found ${decisions.length} decisions from BGH`);
    return decisions;
  } catch (error) {
    console.error('Error checking BGH for new decisions:', error);
    await createLogEntry('error', `Error checking BGH for new decisions: ${error.message}`);
    return [];
  }
}

/**
 * Perform periodic analysis and generate reports
 */
async function performPeriodicAnalysis() {
  try {
    await createLogEntry('info', 'Starting periodic analysis');
    
    // Perform comprehensive analysis
    const decisionAnalysis = await performComprehensiveAnalysis();
    console.log('Decision analysis completed');
    
    // Perform performance analysis
    const performanceAnalysis = await performPerformanceAnalysis();
    console.log('Performance analysis completed');
    
    // Generate reports
    const reportPaths = await generateAllReports();
    console.log('Reports generated:', reportPaths);
    
    await createLogEntry('info', 'Periodic analysis completed successfully');
  } catch (error) {
    console.error('Error performing periodic analysis:', error);
    await createLogEntry('error', `Error performing periodic analysis: ${error.message}`);
  }
}

/**
 * Get run count from database (simplified implementation)
 */
async function getRunCount() {
  // In a real implementation, this would retrieve the actual run count from the database
  // For now, we'll simulate it
  return Math.floor(Math.random() * 20);
}
