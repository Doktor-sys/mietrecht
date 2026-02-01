/**
 * Script to synchronize legal deadlines to calendar system
 * This script creates calendar events for court decision deadlines and important dates.
 */

const { getAllDecisions } = require('./database/dao/decisionDao.js');
const { syncDeadlinesToCalendar } = require('./calendar_integration.js');

async function syncDeadlines() {
  console.log('Starting deadline synchronization...\n');
  
  try {
    // In a real implementation, we would fetch decisions from the database
    // For now, we'll use mock data
    const mockDecisions = [
      {
        caseNumber: 'ABC-123/2025',
        court: 'AG Berlin',
        decisionDate: '2025-12-01',
        topics: ['Mietrecht'],
        summary: 'Wichtige Mietrechtsentscheidung',
        importance: 'high',
        deadline: '2025-12-20T10:00:00+01:00'
      },
      {
        caseNumber: 'XYZ-456/2025',
        court: 'LG Hamburg',
        decisionDate: '2025-12-02',
        topics: ['Mietrecht', 'Kündigung'],
        summary: 'Entscheidung zur fristlosen Kündigung',
        importance: 'medium',
        deadline: '2025-12-25T14:00:00+01:00'
      }
    ];
    
    // In a real implementation, we would fetch from the database:
    // const decisions = await getAllDecisions();
    
    const result = await syncDeadlinesToCalendar(mockDecisions);
    
    console.log('\nSynchronization completed:');
    console.log(`- Created: ${result.created} events`);
    console.log(`- Updated: ${result.updated} events`);
    console.log(`- Deleted: ${result.deleted} events`);
    console.log(`- Total: ${result.totalEvents} events processed`);
    
    console.log('\n✅ Deadline synchronization finished successfully');
  } catch (error) {
    console.error('❌ Deadline synchronization failed:', error.message);
    process.exit(1);
  }
}

// Run the synchronization
if (require.main === module) {
  syncDeadlines();
}

module.exports = { syncDeadlines };
