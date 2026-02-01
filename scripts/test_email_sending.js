/**
 * Test script for email sending functionality
 * This script tests the email sending capability of the Mietrecht Agent
 */

const { sendeNewsletter } = require('./mietrecht_agent_real_data.js');
const { logger } = require('./monitoring/logService.js');

// Test lawyer data
const testLawyer = {
  id: 1,
  name: "Max Mustermann",
  email: "max.mustermann@lawfirm.de",
  lawFirm: "Mustermann & Partner",
  practiceAreas: ["Mietrecht", "Wohnungsrecht"],
  regions: ["Berlin", "Brandenburg"],
  preferences: {
    courtLevels: ["Bundesgerichtshof", "Landgericht"],
    topics: ["Mietminderung", "Kündigung", "Nebenkosten"],
    frequency: "weekly",
    importanceThreshold: "medium"
  }
};

// Test newsletter content
const testNewsletterContent = `
<h1>Mietrechts-Urteile der Woche</h1>
<p>Hallo ${testLawyer.name},</p>
<p>Hier sind die wichtigsten Mietrechts-Urteile der letzten Woche:</p>
<ul>
  <li><strong>BGH, VIII ZR 121/24</strong>: Mietminderung bei Schimmelbefall</li>
  <li><strong>LG Berlin, 34 M 12/25</strong>: Kündigung wegen Eigenbedarf</li>
</ul>
<p>Detaillierte Informationen finden Sie im Webinterface des Mietrecht Agents.</p>
`;

async function testEmailSending() {
  logger.info("Starting email sending test...");
  
  try {
    const result = await sendeNewsletter(testLawyer, testNewsletterContent);
    if (result.success) {
      logger.info(`Email sent successfully! Message ID: ${result.messageId}`);
    } else {
      logger.error(`Failed to send email: ${result.error}`);
    }
  } catch (error) {
    logger.error(`Error during email sending test: ${error.message}`, {
      stack: error.stack
    });
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testEmailSending().catch(error => {
    logger.error("Test failed with error:", error.message, {
      stack: error.stack
    });
    process.exit(1);
  });
}

module.exports = { testEmailSending };