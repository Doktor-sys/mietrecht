/**
 * Test script for Accounting System Integration
 * This script tests the integration with accounting systems.
 */

const { 
  createInvoiceInAccountingSystem,
  createInvoicesForDecisions,
  fetchFinancialReport,
  syncPaymentsFromAccountingSystem,
  updateInvoiceStatus
} = require('./accounting_integration.js');

async function testAccountingIntegration() {
  console.log('=== Testing Accounting System Integration ===\n');
  
  try {
    // Test 1: Create invoice in accounting system
    console.log('Test 1: Creating invoice in accounting system...');
    const mockInvoiceData = {
      invoiceNumber: 'INV-2025-001',
      date: '2025-12-05',
      dueDate: '2025-12-19',
      client: {
        name: 'Test Mandant',
        email: 'mandant@test.de'
      },
      items: [
        {
          description: 'Rechtliche Beratung',
          quantity: 1,
          unitPrice: 250.00,
          total: 250.00
        }
      ],
      notes: 'Testrechnung für Integrationstest'
    };
    
    const invoiceResult = await createInvoiceInAccountingSystem(mockInvoiceData);
    console.log('✓ Invoice creation result:', JSON.stringify(invoiceResult, null, 2));
    
    // Test 2: Create invoices for decisions
    console.log('\nTest 2: Creating invoices for court decisions...');
    const mockDecisions = [
      {
        caseNumber: 'ABC-123/2025',
        court: 'AG Berlin',
        decisionDate: '2025-12-01',
        topics: ['Mietrecht'],
        summary: 'Wichtige Mietrechtsentscheidung',
        importance: 'high',
        requiresBilling: true,
        billingAmount: 300.00
      }
    ];
    
    const invoicesResult = await createInvoicesForDecisions(mockDecisions);
    console.log('✓ Invoices for decisions result:', JSON.stringify(invoicesResult, null, 2));
    
    // Test 3: Fetch financial report
    console.log('\nTest 3: Fetching financial report...');
    const reportResult = await fetchFinancialReport('2025-12-01', '2025-12-31');
    console.log('✓ Financial report result:', JSON.stringify(reportResult, null, 2));
    
    // Test 4: Sync payments
    console.log('\nTest 4: Syncing payments from accounting system...');
    const paymentsResult = await syncPaymentsFromAccountingSystem();
    console.log('✓ Payments sync result:', JSON.stringify(paymentsResult, null, 2));
    
    // Test 5: Update invoice status
    console.log('\nTest 5: Updating invoice status...');
    const statusResult = await updateInvoiceStatus('acc-inv-12345', 'paid');
    console.log('✓ Invoice status update result:', JSON.stringify(statusResult, null, 2));
    
    console.log('\n=== All Accounting Integration Tests Passed ===');
  } catch (error) {
    console.error('❌ Accounting Integration Test Failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  testAccountingIntegration();
}

module.exports = { testAccountingIntegration };