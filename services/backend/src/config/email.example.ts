/**
 * E-Mail-Konfiguration Beispiele für verschiedene Anbieter
 * 
 * Kopiere diese Datei nach email.ts und passe die Konfiguration an deine Bedürfnisse an.
 */

export const emailConfigurations = {
  // Gmail Konfiguration
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true für 465, false für andere Ports
    auth: {
      user: 'deine-email@gmail.com',
      pass: 'dein-app-passwort' // Verwende App-Passwort, nicht dein normales Passwort
    }
  },

  // Outlook/Hotmail Konfiguration
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'deine-email@outlook.com',
      pass: 'dein-passwort'
    }
  },

  // SendGrid Konfiguration
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: 'dein-sendgrid-api-key'
    }
  },

  // Mailgun Konfiguration
  mailgun: {
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
    auth: {
      user: 'postmaster@deine-domain.mailgun.org',
      pass: 'dein-mailgun-passwort'
    }
  },

  // AWS SES Konfiguration
  ses: {
    host: 'email-smtp.eu-west-1.amazonaws.com', // Ersetze Region
    port: 587,
    secure: false,
    auth: {
      user: 'dein-ses-smtp-username',
      pass: 'dein-ses-smtp-passwort'
    }
  },

  // Lokaler SMTP Server (für Entwicklung)
  local: {
    host: 'localhost',
    port: 1025,
    secure: false,
    auth: false // Keine Authentifizierung für lokalen Server
  }
}

/**
 * Umgebungsvariablen für E-Mail-Konfiguration:
 * 
 * EMAIL_HOST=smtp.gmail.com
 * EMAIL_PORT=587
 * EMAIL_SECURE=false
 * EMAIL_USER=deine-email@gmail.com
 * EMAIL_PASSWORD=dein-app-passwort
 * EMAIL_FROM=SmartLaw <noreply@smartlaw.de>
 */

/**
 * Für Gmail App-Passwort erstellen:
 * 1. Gehe zu https://myaccount.google.com/security
 * 2. Aktiviere 2-Faktor-Authentifizierung
 * 3. Gehe zu "App-Passwörter"
 * 4. Erstelle ein neues App-Passwort für "Mail"
 * 5. Verwende dieses Passwort in der EMAIL_PASSWORD Variable
 */

/**
 * Für Entwicklung mit MailHog (lokaler SMTP Server):
 * 1. Installiere MailHog: https://github.com/mailhog/MailHog
 * 2. Starte MailHog: mailhog
 * 3. Verwende die lokale Konfiguration
 * 4. E-Mails sind unter http://localhost:8025 einsehbar
 */