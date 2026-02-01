/**
 * Integration Configuration Definitions
 * 
 * This file defines the supported integration systems and their configurations
 */

// Supported law firm management systems
export const LAW_FIRM_SYSTEMS = {
  lexware: {
    name: 'Lexware Kanzlei',
    type: 'lexware',
    description: 'Lexware Kanzlei-Management-System',
    features: ['cases', 'clients', 'documents', 'billing'],
    apiUrl: 'https://api.lexware.de/kanzlei/v1',
    authType: 'oauth2',
    documentation: 'https://developer.lexware.de/docs/kanzlei-api'
  },
  datev: {
    name: 'DATEV Kanzlei-Rechnungswesen',
    type: 'datev',
    description: 'DATEV Kanzlei-Rechnungswesen API',
    features: ['cases', 'clients', 'documents', 'financial'],
    apiUrl: 'https://api.datev.de/kanzlei/v2',
    authType: 'certificate',
    documentation: 'https://developer.datev.de/docs/kanzlei-rechnungswesen-api'
  },
  kanzleisoft: {
    name: 'Kanzleisoft',
    type: 'kanzleisoft',
    description: 'Kanzleisoft Kanzleimanagement',
    features: ['cases', 'clients', 'documents', 'billing', 'calendar'],
    apiUrl: 'https://api.kanzleisoft.de/v1',
    authType: 'apikey',
    documentation: 'https://docs.kanzleisoft.de/api'
  }
} as const;

// Supported accounting systems
export const ACCOUNTING_SYSTEMS = {
  lexware: {
    name: 'Lexware Buchhalter',
    type: 'lexware',
    description: 'Lexware Buchhaltungssoftware',
    features: ['invoices', 'expenses', 'clients', 'tax'],
    apiUrl: 'https://api.lexware.de/buchhalter/v1',
    authType: 'oauth2',
    documentation: 'https://developer.lexware.de/docs/buchhalter-api'
  },
  datev: {
    name: 'DATEV Unternehmen Online',
    type: 'datev',
    description: 'DATEV Unternehmen Online API',
    features: ['invoices', 'expenses', 'clients', 'tax', 'financial_reports'],
    apiUrl: 'https://api.datev.de/unternehmen/v1',
    authType: 'certificate',
    documentation: 'https://developer.datev.de/docs/unternehmen-online-api'
  },
  fastbill: {
    name: 'FastBill',
    type: 'fastbill',
    description: 'FastBill Rechnungssoftware',
    features: ['invoices', 'subscriptions', 'clients', 'payments'],
    apiUrl: 'https://my.fastbill.com/api/1.0/api.php',
    authType: 'apikey',
    documentation: 'https://www.fastbill.com/api-komplettuebersicht'
  },
  lexoffice: {
    name: 'Lexoffice',
    type: 'lexoffice',
    description: 'Lexoffice Rechnungs- und Buchhaltungssoftware',
    features: ['invoices', 'expenses', 'clients', 'vat', 'financial_reports'],
    apiUrl: 'https://api.lexoffice.de/v1',
    authType: 'bearer',
    documentation: 'https://developers.lexoffice.de/docs/'
  }
} as const;

// Supported calendar systems
export const CALENDAR_SYSTEMS = {
  outlook: {
    name: 'Microsoft Outlook',
    type: 'outlook',
    description: 'Microsoft Outlook/Exchange Kalender',
    features: ['events', 'reminders', 'attendees', 'sync'],
    apiUrl: 'https://graph.microsoft.com/v1.0/me/events',
    authType: 'oauth2',
    documentation: 'https://learn.microsoft.com/en-us/graph/api/resources/calendar'
  },
  google: {
    name: 'Google Calendar',
    type: 'google',
    description: 'Google Calendar API',
    features: ['events', 'reminders', 'attendees', 'sync'],
    apiUrl: 'https://www.googleapis.com/calendar/v3/calendars',
    authType: 'oauth2',
    documentation: 'https://developers.google.com/calendar/api'
  },
  exchange: {
    name: 'Microsoft Exchange',
    type: 'exchange',
    description: 'Microsoft Exchange Server Kalender',
    features: ['events', 'reminders', 'attendees', 'sync'],
    apiUrl: 'https://outlook.office365.com/EWS/Exchange.asmx',
    authType: 'oauth2',
    documentation: 'https://learn.microsoft.com/en-us/exchange/client-developer/exchange-web-services/explore-the-ews-managed-api-ews-and-web-services'
  }
} as const;

// Integration feature mappings
export const INTEGRATION_FEATURES = {
  lawFirm: {
    cases: 'Fallverwaltung',
    clients: 'Kundenverwaltung',
    documents: 'Dokumentenmanagement',
    billing: 'Abrechnung',
    calendar: 'Kalenderintegration'
  },
  accounting: {
    invoices: 'Rechnungserstellung',
    expenses: 'Ausgabenverwaltung',
    clients: 'Kundenkonten',
    tax: 'Steuerdaten',
    vat: 'Mehrwertsteuer',
    financial_reports: 'Finanzberichte',
    payments: 'Zahlungsabwicklung'
  },
  calendar: {
    events: 'Ereignisverwaltung',
    reminders: 'Erinnerungen',
    attendees: 'Teilnehmer',
    sync: 'Synchronisation'
  }
} as const;

// Default configuration templates
export const DEFAULT_CONFIG_TEMPLATES = {
  lawFirm: {
    syncFrequency: 30, // minutes
    autoCreateCases: true,
    syncDocuments: true,
    updateBillingInfo: true
  },
  accounting: {
    syncFrequency: 60, // minutes
    autoCreateInvoices: true,
    syncExpenses: true,
    taxReporting: true
  },
  calendar: {
    syncFrequency: 15, // minutes
    createDeadlines: true,
    sendReminders: true,
    syncCourtDates: true
  }
} as const;

// Export types
export type LawFirmSystemType = keyof typeof LAW_FIRM_SYSTEMS;
export type AccountingSystemType = keyof typeof ACCOUNTING_SYSTEMS;
export type CalendarSystemType = keyof typeof CALENDAR_SYSTEMS;

export type IntegrationFeature = 
  keyof typeof INTEGRATION_FEATURES.lawFirm |
  keyof typeof INTEGRATION_FEATURES.accounting |
  keyof typeof INTEGRATION_FEATURES.calendar;