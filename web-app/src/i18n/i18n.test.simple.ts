// Simple test to validate i18n configuration
import i18n from './index';

console.log('Testing i18n configuration...');

// Test that all languages are loaded
const languages = Object.keys(i18n.services.resourceStore.data);
console.log('Available languages:', languages);

// Test switching to each language
const testLanguages = ['de', 'tr', 'ar', 'es', 'fr', 'it'];
testLanguages.forEach(lang => {
  try {
    i18n.changeLanguage(lang);
    const title = i18n.t('app.title');
    console.log(`Switched to ${lang}: ${title}`);
  } catch (error) {
    console.error(`Error switching to ${lang}:`, error);
  }
});

console.log('i18n test completed!');