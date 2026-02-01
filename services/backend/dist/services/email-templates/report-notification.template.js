"use strict";
// Report-Notification E-Mail-Template
// Dieses Template muss in EmailService.ts in der initializeTemplates() Methode eingefügt werden
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportNotificationTemplate = void 0;
// VERWENDUNG in EmailService.ts:
// this.templates.set('report-notification', reportNotificationTemplate)
exports.reportNotificationTemplate = {
    subject: 'SmartLaw - Ihr {{reportType}} Report ist verfügbar',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Report verfügbar</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .metrics { background: #f0f9ff; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .metric-card { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #6366f1; border-radius: 3px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #6366f1; }
        .metric-label { font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 SmartLaw Mietrecht</h1>
        </div>
        <div class="content">
          <h2>Ihr Report ist verfügbar</h2>
          <p>Hallo {{organizationName}},</p>
          <p>Ihr <strong>{{reportType}}</strong> Report für den Zeitraum <strong>{{period}}</strong> wurde erfolgreich generiert.</p>
          
          <div class="metrics">
            <h3>Zusammenfassung</h3>
            <div class="metric-card">
              <div class="metric-value">{{summary.totalApiCalls}}</div>
              <div class="metric-label">API-Aufrufe</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{summary.totalDocuments}}</div>
              <div class="metric-label">Verarbeitete Dokumente</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{summary.successRate}}%</div>
              <div class="metric-label">Erfolgsrate</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{formattedCost}}</div>
              <div class="metric-label">Gesamtkosten</div>
            </div>
          </div>

          <p>Klicken Sie auf den folgenden Button, um den vollständigen Report anzuzeigen:</p>
          <a href="{{reportUrl}}" class="button">Report ansehen</a>
          
          <p style="font-size: 12px; color: #666;">Generiert am: {{formattedDate}}</p>
        </div>
        <div class="footer">
          <p>SmartLaw Mietrecht Agent<br>
          Support: <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
        </div>
      </div>
    </body>
    </html>
  `,
    text: `
SmartLaw Mietrecht - Report verfügbar

Hallo {{organizationName}},

Ihr {{reportType}} Report für den Zeitraum {{period}} wurde erfolgreich generiert.

ZUSAMMENFASSUNG:
- API-Aufrufe: {{summary.totalApiCalls}}
- Verarbeitete Dokumente: {{summary.totalDocuments}}
- Erfolgsrate: {{summary.successRate}}%
- Gesamtkosten: {{formattedCost}}

Report ansehen: {{reportUrl}}

Generiert am: {{formattedDate}}

Support: {{supportEmail}}
  `
};
