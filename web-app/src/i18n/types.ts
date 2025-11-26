// Type definitions for i18n translations

export interface TranslationResources {
  app: {
    title: string;
    description: string;
  };
  nav: {
    home: string;
    chat: string;
    documents: string;
    lawyers: string;
    profile: string;
    login: string;
    register: string;
    logout: string;
  };
  auth: {
    email: string;
    password: string;
    login: string;
    register: string;
    loginTitle: string;
    registerTitle: string;
    userType: string;
    tenant: string;
    landlord: string;
    business: string;
  };
  chat: {
    title: string;
    placeholder: string;
    send: string;
    typing: string;
  };
  documents: {
    title: string;
    upload: string;
    analyze: string;
    noDocuments: string;
  };
  lawyers: {
    title: string;
    search: string;
    location: string;
    specialization: string;
    book: string;
  };
  common: {
    loading: string;
    error: string;
    save: string;
    cancel: string;
    close: string;
  };
}

export type SupportedLanguage = 'de' | 'tr' | 'ar';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['de', 'tr', 'ar'];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  de: 'Deutsch',
  tr: 'Türkçe',
  ar: 'العربية',
};
