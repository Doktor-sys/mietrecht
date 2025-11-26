/**
 * Weekly Update Agent Prototype
 * This is a simplified prototype to demonstrate the core functionality
 */

// Import required modules
const fs = require('fs');
const path = require('path');

// Mock data for demonstration
const lawyers = [
  {
    id: 1,
    name: "Max Mustermann",
    email: "max.mustermann@lawfirm.de",
    specialties: ["Mietrecht", "Wohnungsrecht"],
    regions: ["Berlin", "Brandenburg"]
  },
  {
    id: 2,
    name: "Anna Schmidt",
    email: "anna.schmidt@lawfirm.de",
    specialties: ["Mietrecht", "Verwaltungsrecht"],
    regions: ["Hamburg", "Schleswig-Holstein"]
  }
];

const mockCases = [
  {
    id: 101,
    title: "Mietminderung wegen Schimmelbefall",
    summary: "Mieter fordert Mietminderung aufgrund von Schimmel in der Wohnung",
    type: "Mietrecht",
    region: "Berlin",
    date: "2025-11-20",
    priority: "high",
    status: "new"
  },
  {
    id: 102,
    title: "Kündigungsschutz bei Modernisierung",
    summary: "Mieter wehrt Kündigung nach Modernisierungsmaßnahmen ab",
    type: "Mietrecht",
    region: "Hamburg",
    date: "2025-11-18",
    priority: "medium",
    status: "updated"
  },
  {
    id: 103,
    title: "Nebenkostenabrechnung",
    summary: "Streit um korrekte Nebenkostenabrechnung",
    type: "Mietrecht",
    region: "Berlin",
    date: "2025-11-22",
    priority: "low",
    status: "new"
  }
];

const mockLegalUpdates = [
  {
    id: 201,
    title: "BGH-Urteil zur Mietpreisbremse",
    summary: "Bundesgerichtshof veröffentlicht neues Urteil zur Anwendung der Mietpreisbremse",
    type: "court-decision",
    topics: ["Mietrecht", "Mietpreisbremse"],
    date: "2025-11-21",
    source: "BGH"
  },
  {
    id: 202,
    title: "Neue Vorschriften zur Heizkostenabrechnung",
    summary: "Bundesministerium für Wohnen veröffentlicht neue Vorschriften",
    type: "regulation",
    topics: ["Mietrecht", "Nebenkosten"],
    date: "2025-11-19",
    source: "BMWo"
  }
];

/**
 * Filter cases based on lawyer preferences
 * @param {Array} cases - Array of case objects
 * @param {Object} lawyer - Lawyer object with preferences
 * @returns {Array} Filtered cases
 */
function filterCasesForLawyer(cases, lawyer) {
  return cases.filter(caseItem => {
    // Filter by specialty
    const specialtyMatch = lawyer.specialties.includes(caseItem.type);
    
    // Filter by region
    const regionMatch = lawyer.regions.includes(caseItem.region);
    
    // Only include new or updated cases
    const statusMatch = caseItem.status === "new" || caseItem.status === "updated";
    
    return specialtyMatch && regionMatch && statusMatch;
  });
}

/**
 * Filter legal updates based on lawyer preferences
 * @param {Array} updates - Array of legal update objects
 * @param {Object} lawyer - Lawyer object with preferences
 * @returns {Array} Filtered updates
 */
function filterLegalUpdatesForLawyer(updates, lawyer) {
  return updates.filter(update => {
    // Check if any of the lawyer's specialties match the update topics
    const topicMatch = lawyer.specialties.some(specialty => 
      update.topics.includes(specialty)
    );
    
    return topicMatch;
  });
}

/**
 * Generate HTML email content for a lawyer
 * @param {Object} lawyer - Lawyer object
 * @param {Array} cases - Filtered cases for the lawyer
 * @param {Array} updates - Filtered legal updates for the lawyer
 * @returns {String} HTML email content
 */
function generateEmailContent(lawyer, cases, updates) {
  const currentDate = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Wöchentliche Mietrecht-Updates</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        h1, h2 { color: #2c3e50; }
        .header { background-color: #3498db; color: white; padding: 20px; text-align: center; }
        .section { margin: 20px 0; }
        .case, .update { 
            border-left: 4px solid #3498db; 
            padding: 10px; 
            margin: 10px 0; 
            background-color: #f8f9fa;
        }
        .priority-high { border-left-color: #e74c3c; }
        .priority-medium { border-left-color: #f39c12; }
        .priority-low { border-left-color: #2ecc71; }
        .footer { 
            margin-top: 30px; 
            padding-top: 15px; 
            border-top: 1px solid #eee; 
            font-size: 0.9em; 
            color: #777;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Wöchentliche Mietrecht-Updates</h1>
        <p>${currentDate}</p>
    </div>
    
    <p>Guten Tag ${lawyer.name},</p>
    
    <p>hier sind Ihre wöchentlichen Mietrecht-Updates:</p>
  `;

  // Add cases section
  if (cases.length > 0) {
    html += `
    <div class="section">
        <h2>Neue und aktualisierte Fälle (${cases.length})</h2>
    `;
    
    cases.forEach(caseItem => {
      const priorityClass = `priority-${caseItem.priority}`;
      html += `
        <div class="case ${priorityClass}">
            <h3>${caseItem.title}</h3>
            <p>${caseItem.summary}</p>
            <p><strong>Region:</strong> ${caseItem.region} | 
               <strong>Datum:</strong> ${caseItem.date} | 
               <strong>Status:</strong> ${caseItem.status}</p>
        </div>
      `;
    });
    
    html += `</div>`;
  } else {
    html += `
    <div class="section">
        <h2>Neue und aktualisierte Fälle</h2>
        <p>Keine neuen oder aktualisierten Fälle entsprechen Ihren Kriterien.</p>
    </div>
    `;
  }

  // Add legal updates section
  if (updates.length > 0) {
    html += `
    <div class="section">
        <h2>Rechtliche Entwicklungen (${updates.length})</h2>
    `;
    
    updates.forEach(update => {
      html += `
        <div class="update">
            <h3>${update.title}</h3>
            <p>${update.summary}</p>
            <p><strong>Quelle:</strong> ${update.source} | 
               <strong>Datum:</strong> ${update.date} | 
               <strong>Typ:</strong> ${update.type}</p>
        </div>
      `;
    });
    
    html += `</div>`;
  } else {
    html += `
    <div class="section">
        <h2>Rechtliche Entwicklungen</h2>
        <p>Keine neuen rechtlichen Entwicklungen entsprechen Ihren Kriterien.</p>
    </div>
    `;
  }

  html += `
    <div class="footer">
        <p>Diese E-Mail wurde automatisch generiert vom SmartLaw Mietrecht Agent.</p>
        <p><a href="https://jurismind.de/dashboard">Zum vollständigen Dashboard</a></p>
        <p><small>Diese E-Mail wurde automatisch generiert. Antworten Sie nicht auf diese Nachricht.</small></p>
    </div>
</body>
</html>
  `;

  return html;
}

/**
 * Simulate sending an email
 * @param {Object} lawyer - Lawyer object
 * @param {String} subject - Email subject
 * @param {String} content - Email content
 */
function sendEmail(lawyer, subject, content) {
  console.log(`\n=== EMAIL SIMULATION ===`);
  console.log(`To: ${lawyer.name} <${lawyer.email}>`);
  console.log(`Subject: ${subject}`);
  console.log(`Content preview: ${content.substring(0, 200)}...`);
  console.log(`=== END EMAIL SIMULATION ===\n`);
  
  // In a real implementation, this would use an email service like:
  // await transporter.sendMail({ to: lawyer.email, subject, html: content });
}

/**
 * Main function to run the weekly update agent
 */
async function runWeeklyUpdateAgent() {
  console.log("Starting Weekly Update Agent...");
  console.log(`Date: ${new Date().toLocaleString('de-DE')}`);
  
  // Process each lawyer
  for (const lawyer of lawyers) {
    console.log(`\nProcessing updates for ${lawyer.name}...`);
    
    // Filter cases and updates for this lawyer
    const filteredCases = filterCasesForLawyer(mockCases, lawyer);
    const filteredUpdates = filterLegalUpdatesForLawyer(mockLegalUpdates, lawyer);
    
    console.log(`  Found ${filteredCases.length} relevant cases`);
    console.log(`  Found ${filteredUpdates.length} relevant legal updates`);
    
    // Generate email content
    const emailContent = generateEmailContent(lawyer, filteredCases, filteredUpdates);
    const emailSubject = `Wöchentliche Mietrecht-Updates - ${new Date().toLocaleDateString('de-DE')}`;
    
    // Send email (simulated)
    sendEmail(lawyer, emailSubject, emailContent);
    
    // Log the activity
    console.log(`  Email sent to ${lawyer.email}`);
  }
  
  console.log("\nWeekly Update Agent completed successfully.");
}

/**
 * Scheduler function to run the agent weekly
 */
function scheduleWeeklyAgent() {
  console.log("Weekly Update Agent Scheduler started.");
  console.log("Next run: Every Monday at 8:00 AM");
  
  // For demonstration, we'll run it immediately
  runWeeklyUpdateAgent();
  
  // In a real implementation, this would use a scheduler like:
  // cron.schedule('0 8 * * 1', runWeeklyUpdateAgent); // Every Monday at 8:00 AM
}

// Run the scheduler if this script is executed directly
if (require.main === module) {
  scheduleWeeklyAgent();
}

// Export functions for testing
module.exports = {
  filterCasesForLawyer,
  filterLegalUpdatesForLawyer,
  generateEmailContent,
  sendEmail,
  runWeeklyUpdateAgent,
  scheduleWeeklyAgent,
  lawyers,
  mockCases,
  mockLegalUpdates
};