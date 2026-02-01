/**
 * Test script for Calendar Integration
 * This script tests the synchronization of legal deadlines with calendar systems.
 */

const { 
  createCalendarEvent,
  createEventsForDecisions,
  fetchUpcomingEvents,
  updateCalendarEvent,
  deleteCalendarEvent,
  syncDeadlinesToCalendar
} = require('./calendar_integration.js');

async function testCalendarIntegration() {
  console.log('=== Testing Calendar Integration ===\n');
  
  try {
    // Test 1: Create calendar event
    console.log('Test 1: Creating calendar event...');
    const mockEventData = {
      summary: 'Test Termin',
      description: 'Testtermin für Integrationstest',
      start: {
        dateTime: '2025-12-15T10:00:00+01:00',
        timeZone: 'Europe/Berlin'
      },
      end: {
        dateTime: '2025-12-15T11:00:00+01:00',
        timeZone: 'Europe/Berlin'
      }
    };
    
    const eventResult = await createCalendarEvent(mockEventData);
    console.log('✓ Calendar event creation result:', JSON.stringify(eventResult, null, 2));
    
    // Test 2: Create events for decisions
    console.log('\nTest 2: Creating events for court decisions...');
    const mockDecisions = [
      {
        caseNumber: 'ABC-123/2025',
        court: 'AG Berlin',
        decisionDate: '2025-12-01',
        topics: ['Mietrecht'],
        summary: 'Wichtige Mietrechtsentscheidung',
        importance: 'high',
        deadline: '2025-12-20T10:00:00+01:00'
      }
    ];
    
    const eventsResult = await createEventsForDecisions(mockDecisions);
    console.log('✓ Events for decisions result:', JSON.stringify(eventsResult, null, 2));
    
    // Test 3: Fetch upcoming events
    console.log('\nTest 3: Fetching upcoming events...');
    const upcomingEvents = await fetchUpcomingEvents('2025-12-01T00:00:00Z', '2025-12-31T23:59:59Z');
    console.log('✓ Upcoming events result:', JSON.stringify(upcomingEvents, null, 2));
    
    // Test 4: Update calendar event
    console.log('\nTest 4: Updating calendar event...');
    const updateData = {
      summary: 'Aktualisierter Test Termin',
      description: 'Aktualisierter Testtermin für Integrationstest'
    };
    
    const updateResult = await updateCalendarEvent('cal-event-12345', updateData);
    console.log('✓ Calendar event update result:', JSON.stringify(updateResult, null, 2));
    
    // Test 5: Delete calendar event
    console.log('\nTest 5: Deleting calendar event...');
    const deleteResult = await deleteCalendarEvent('cal-event-12345');
    console.log('✓ Calendar event deletion result:', JSON.stringify(deleteResult, null, 2));
    
    // Test 6: Sync deadlines to calendar
    console.log('\nTest 6: Syncing deadlines to calendar...');
    const syncResult = await syncDeadlinesToCalendar(mockDecisions);
    console.log('✓ Deadline sync result:', JSON.stringify(syncResult, null, 2));
    
    console.log('\n=== All Calendar Integration Tests Passed ===');
  } catch (error) {
    console.error('❌ Calendar Integration Test Failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  testCalendarIntegration();
}

module.exports = { testCalendarIntegration };