/**
 * Script to synchronize payments from accounting system
 * This script fetches payments from the accounting system and updates local records.
 */

const { syncPaymentsFromAccountingSystem } = require('./accounting_integration.js');

async function syncPayments() {
  console.log('Starting payment synchronization...\n');
  
  try {
    const result = await syncPaymentsFromAccountingSystem();
    
    console.log('\nSynchronization completed:');
    console.log(`- Synced: ${result.paymentCount} payments`);
    console.log('- Sample payments:', JSON.stringify(result.payments, null, 2));
    
    console.log('\n✅ Payment synchronization finished successfully');
  } catch (error) {
    console.error('❌ Payment synchronization failed:', error.message);
    process.exit(1);
  }
}

// Run the synchronization
if (require.main === module) {
  syncPayments();
}

module.exports = { syncPayments };