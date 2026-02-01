/**
 * E-Mail-Konfiguration Beispiele für verschiedene Anbieter
 *
 * Kopiere diese Datei nach email.ts und passe die Konfiguration an deine Bedürfnisse an.
 */
export declare const emailConfigurations: {
    gmail: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
    outlook: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
    sendgrid: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
    mailgun: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
    ses: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
    local: {
        host: string;
        port: number;
        secure: boolean;
        auth: boolean;
    };
};
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
