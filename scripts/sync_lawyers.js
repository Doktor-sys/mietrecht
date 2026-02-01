/**
 * Script to synchronize lawyers from law firm management system
 * This script fetches lawyers from the law firm management system and updates the local database.
 */

const { syncLawyersFromLawFirmSystem } = require('./law_firm_integration.js');

async function syncLawyers() {
  console.log('Starting lawyer synchronization...\n');
  
  try {
    const result = await syncLawyersFromLawFirmSystem();
    
    console.log('\nSynchronization completed:');
    console.log(`- Created: ${result.created} lawyers`);
    console.log(`- Updated: ${result.updated} lawyers`);
    console.log(`- Deleted: ${result.deleted} lawyers`);
    console.log(`- Total: ${result.total} lawyers processed`);
    
    console.log('\n✅ Lawyer synchronization finished successfully');
  } catch (error) {
    console.error('❌ Lawyer synchronization failed:', error.message);
    process.exit(1);
  }
}

// Run the synchronization
if (require.main === module) {
  syncLawyers();
}

module.exports = { syncLawyers };
