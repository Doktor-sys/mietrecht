import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import deTranslations from './locales/de/translation.json';
import trTranslations from './locales/tr/translation.json';
import arTranslations from './locales/ar/translation.json';
import esTranslations from './locales/es/translation.json';
import frTranslations from './locales/fr/translation.json';
import itTranslations from './locales/it/translation.json';

const resources = {
  de: {
    translation: deTranslations
  },
  tr: {
    translation: trTranslations
  },
  ar: {
    translation: arTranslations
  },
  es: {
    translation: esTranslations
  },
  fr: {
    translation: frTranslations
  },
  it: {
    translation: itTranslations
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('language') || 'de',
  fallbackLng: 'de',
  debug: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Save language preference to localStorage
i18n.on('languageChanged', (lng: string) => {
  localStorage.setItem('language', lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

// Set initial direction
document.documentElement.lang = i18n.language;
document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

export default i18n;