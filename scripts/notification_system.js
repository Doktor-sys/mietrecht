/**
 * Notification System
 * This module handles sending notifications via email.
 */

const nodemailer = require('nodemailer');

/**
 * Create a transporter for sending emails
 * @param {Object} smtpConfig - SMTP configuration
 * @returns {Object} Nodemailer transporter
 */
function createTransporter(smtpConfig) {
  return nodemailer.createTransporter({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass
    }
  });
}

/**
 * Send email notification
 * @param {Object} transporter - Nodemailer transporter
 * @param {Object} mailOptions - Email options
 * @returns {Promise<Object>} Email sending result
 */
async function sendEmail(transporter, mailOptions) {
  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send newsletter to a lawyer
 * @param {Object} lawyer - Lawyer object
 * @param {String} newsletterContent - Newsletter content
 * @param {Object} smtpConfig - SMTP configuration
 * @returns {Promise<Object>} Email sending result
 */
async function sendNewsletter(lawyer, newsletterContent, smtpConfig) {
  try {
    console.log(`Sending newsletter to lawyer: ${lawyer.name}`);
    
    const transporter = createTransporter(smtpConfig);
    
    const mailOptions = {
      from: '"Mietrecht Agent" <agent@mietrecht.de>',
      to: lawyer.email,
      subject: "Neue Gerichtsentscheidungen im Mietrecht",
      text: newsletterContent,
      html: `<pre>${newsletterContent.replace(/\n/g, '<br>')}</pre>`
    };
    
    return await sendEmail(transporter, mailOptions);
  } catch (error) {
    console.error(`Error sending newsletter to ${lawyer.name}:`, error.message);
    throw new Error(`Failed to send newsletter to ${lawyer.name}: ${error.message}`);
  }
}

/**
 * Send notification about new important decisions
 * @param {Array} decisions - Array of important court decisions
 * @param {Object} lawyer - Lawyer object
 * @param {Object} smtpConfig - SMTP configuration
 * @returns {Promise<Object>} Email sending result
 */
async function sendImportantDecisionsNotification(decisions, lawyer, smtpConfig) {
  try {
    console.log(`Sending important decisions notification to lawyer: ${lawyer.name}`);
    
    const transporter = createTransporter(smtpConfig);
    
    // Create notification content
    let notificationContent = `Sehr geehrte/r ${lawyer.name},

Es wurden neue wichtige Gerichtsentscheidungen gefunden, die für Ihre Praxis relevant sind:

`;
    
    decisions.forEach((decision, index) => {
      notificationContent += `${index + 1}. ${decision.court} - ${decision.caseNumber}
   Datum: ${decision.decisionDate}
   Themen: ${decision.topics.join(', ')}
   
   Zusammenfassung:
   ${decision.summary}

`;
    });
    
    notificationContent += `Weitere Details finden Sie in Ihrem Asana-Workspace oder auf GitHub.

Mit freundlichen Grüßen
Ihr Mietrecht Agent`;
    
    const mailOptions = {
      from: '"Mietrecht Agent" <agent@mietrecht.de>',
      to: lawyer.email,
      subject: "Wichtige neue Gerichtsentscheidungen",
      text: notificationContent,
      html: `<pre>${notificationContent.replace(/\n/g, '<br>')}</pre>`
    };
    
    return await sendEmail(transporter, mailOptions);
  } catch (error) {
    console.error(`Error sending important decisions notification to ${lawyer.name}:`, error.message);
    throw new Error(`Failed to send important decisions notification to ${lawyer.name}: ${error.message}`);
  }
}

/**
 * Send system status notification
 * @param {String} statusMessage - Status message
 * @param {String} recipientEmail - Recipient email address
 * @param {Object} smtpConfig - SMTP configuration
 * @returns {Promise<Object>} Email sending result
 */
async function sendSystemStatus(statusMessage, recipientEmail, smtpConfig) {
  try {
    console.log("Sending system status notification");
    
    const transporter = createTransporter(smtpConfig);
    
    const mailOptions = {
      from: '"Mietrecht Agent" <agent@mietrecht.de>',
      to: recipientEmail,
      subject: "Mietrecht Agent - Systemstatus",
      text: statusMessage,
      html: `<pre>${statusMessage.replace(/\n/g, '<br>')}</pre>`
    };
    
    return await sendEmail(transporter, mailOptions);
  } catch (error) {
    console.error("Error sending system status notification:", error.message);
    throw new Error(`Failed to send system status notification: ${error.message}`);
  }
}

// Export functions
module.exports = {
  createTransporter,
  sendEmail,
  sendNewsletter,
  sendImportantDecisionsNotification,
  sendSystemStatus
};