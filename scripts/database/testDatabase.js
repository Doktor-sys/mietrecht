/**
 * Database Test Script
 * This script tests the database functionality.
 */

const path = require('path');
const { initializeDatabase, closeDatabase } = require(path.join(__dirname, '../database/connection.js'));
const { 
  getConfigValue, 
  setConfigValue, 
  getAllConfig, 
  deleteConfigValue 
} = require(path.join(__dirname, '../database/dao/configDao.js'));
const { 
  getAllLawyers, 
  getLawyerById, 
  createLawyer, 
  updateLawyer, 
  deleteLawyer 
} = require(path.join(__dirname, '../database/dao/lawyerDao.js'));
const { 
  getAllCourtDecisions, 
  getCourtDecisionById, 
  createCourtDecision, 
  updateCourtDecision, 
  deleteCourtDecision 
} = require(path.join(__dirname, '../database/dao/courtDecisionDao.js'));
const { 
  recordMetric, 
  getMetrics, 
  getLatestMetricValue 
} = require(path.join(__dirname, '../database/dao/dashboardMetricsDao.js'));
const { 
  createLogEntry, 
  getLogEntries, 
  getLogStatistics 
} = require(path.join(__dirname, '../database/dao/systemLogDao.js'));
const { 
  getAllDataSourceStatuses, 
  updateDataSourceStatus 
} = require(path.join(__dirname, '../database/dao/dataSourceStatusDao.js'));

async function runTests() {
  try {
    console.log('Testing database functionality...\n');
    
    // Initialize database
    console.log('1. Initializing database...');
    await initializeDatabase();
    console.log('✓ Database initialized\n');
    
    // Test configuration DAO
    console.log('2. Testing configuration DAO...');
    await setConfigValue('test_key', 'test_value');
    const configValue = await getConfigValue('test_key');
    console.log(`✓ Config value retrieved: ${configValue}`);
    
    const allConfig = await getAllConfig();
    console.log(`✓ All config retrieved: ${Object.keys(allConfig).length} items`);
    
    await deleteConfigValue('test_key');
    console.log('✓ Config value deleted\n');
    
    // Test lawyer DAO
    console.log('3. Testing lawyer DAO...');
    const lawyerId = await createLawyer({
      name: 'Test Lawyer',
      email: 'test@example.com',
      law_firm: 'Test Law Firm',
      practice_areas: ['Mietrecht', 'Wohnungsrecht'],
      regions: ['Berlin', 'Brandenburg'],
      preferences: {
        court_levels: ['Bundesgerichtshof', 'Landgericht'],
        topics: ['Mietminderung', 'Kündigung'],
        frequency: 'weekly',
        importance_threshold: 'medium'
      }
    });
    console.log(`✓ Lawyer created with ID: ${lawyerId}`);
    
    const lawyer = await getLawyerById(lawyerId);
    console.log(`✓ Lawyer retrieved: ${lawyer.name}`);
    
    await updateLawyer(lawyerId, {
      ...lawyer,
      name: 'Updated Test Lawyer',
      preferences: {
        ...lawyer.preferences,
        frequency: 'daily'
      }
    });
    console.log('✓ Lawyer updated');
    
    const allLawyers = await getAllLawyers();
    console.log(`✓ All lawyers retrieved: ${allLawyers.length} items`);
    
    await deleteLawyer(lawyerId);
    console.log('✓ Lawyer deleted\n');
    
    // Test court decision DAO
    console.log('4. Testing court decision DAO...');
    const decisionId = await createCourtDecision({
      decision_id: 'TEST-DECISION-001',
      court: 'Bundesgerichtshof',
      location: 'Karlsruhe',
      decision_date: '2025-11-30',
      case_number: 'VIII ZR 999/25',
      topics: ['Mietrecht', 'Testverfahren'],
      summary: 'This is a test decision',
      full_text: 'Full text of the test decision...',
      url: 'https://example.com/decision/TEST-DECISION-001',
      judges: ['Test Judge 1', 'Test Judge 2'],
      practice_implications: 'Test implications',
      importance: 'high',
      source: 'bgh',
      processed: false
    });
    console.log(`✓ Court decision created with ID: ${decisionId}`);
    
    const decision = await getCourtDecisionById(decisionId);
    console.log(`✓ Court decision retrieved: ${decision.case_number}`);
    
    await updateCourtDecision(decisionId, {
      ...decision,
      processed: true
    });
    console.log('✓ Court decision updated');
    
    const allDecisions = await getAllCourtDecisions({ limit: 10 });
    console.log(`✓ All court decisions retrieved: ${allDecisions.length} items`);
    
    await deleteCourtDecision(decisionId);
    console.log('✓ Court decision deleted\n');
    
    // Test dashboard metrics DAO
    console.log('5. Testing dashboard metrics DAO...');
    const metricId = await recordMetric('test_metric', 42.5);
    console.log(`✓ Metric recorded with ID: ${metricId}`);
    
    const metrics = await getMetrics({ metricName: 'test_metric', limit: 5 });
    console.log(`✓ Metrics retrieved: ${metrics.length} items`);
    
    const latestValue = await getLatestMetricValue('test_metric');
    console.log(`✓ Latest metric value: ${latestValue}\n`);
    
    // Test system logs DAO
    console.log('6. Testing system logs DAO...');
    const logId = await createLogEntry('info', 'This is a test log entry');
    console.log(`✓ Log entry created with ID: ${logId}`);
    
    const logs = await getLogEntries({ level: 'info', limit: 5 });
    console.log(`✓ Log entries retrieved: ${logs.length} items`);
    
    const logStats = await getLogStatistics();
    console.log(`✓ Log statistics retrieved: ${Object.keys(logStats).length} levels\n`);
    
    // Test data source status DAO
    console.log('7. Testing data source status DAO...');
    await updateDataSourceStatus('bgh', 'online', new Date().toISOString());
    console.log('✓ Data source status updated');
    
    const statuses = await getAllDataSourceStatuses();
    console.log(`✓ All data source statuses retrieved: ${statuses.length} items\n`);
    
    console.log('=== All database tests passed successfully! ===');
  } catch (error) {
    console.error('Database test failed:', error.message);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };