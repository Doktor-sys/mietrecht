import i18n from './index';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from './types';

describe('i18n Configuration', () => {
  test('should have all supported languages', () => {
    const languages = Object.keys(i18n.options.resources || {});
    expect(languages).toEqual(expect.arrayContaining(['de', 'tr', 'ar', 'es', 'fr', 'it']));
  });

  test('should have German as default language', () => {
    expect(i18n.options.fallbackLng).toEqual(['de']);
  });

  test('should have all translation keys for German', () => {
    const deTranslations = i18n.getResourceBundle('de', 'translation');
    
    expect(deTranslations).toHaveProperty('app');
    expect(deTranslations).toHaveProperty('nav');
    expect(deTranslations).toHaveProperty('auth');
    expect(deTranslations).toHaveProperty('chat');
    expect(deTranslations).toHaveProperty('documents');
    expect(deTranslations).toHaveProperty('lawyers');
    expect(deTranslations).toHaveProperty('common');
  });

  test('should have all translation keys for Turkish', () => {
    const trTranslations = i18n.getResourceBundle('tr', 'translation');
    
    expect(trTranslations).toHaveProperty('app');
    expect(trTranslations).toHaveProperty('nav');
    expect(trTranslations).toHaveProperty('auth');
    expect(trTranslations).toHaveProperty('chat');
    expect(trTranslations).toHaveProperty('documents');
    expect(trTranslations).toHaveProperty('lawyers');
    expect(trTranslations).toHaveProperty('common');
  });

  test('should have all translation keys for Arabic', () => {
    const arTranslations = i18n.getResourceBundle('ar', 'translation');
    
    expect(arTranslations).toHaveProperty('app');
    expect(arTranslations).toHaveProperty('nav');
    expect(arTranslations).toHaveProperty('auth');
    expect(arTranslations).toHaveProperty('chat');
    expect(arTranslations).toHaveProperty('documents');
    expect(arTranslations).toHaveProperty('lawyers');
    expect(arTranslations).toHaveProperty('common');
  });

  test('should have all translation keys for Spanish', () => {
    const esTranslations = i18n.getResourceBundle('es', 'translation');
    
    expect(esTranslations).toHaveProperty('app');
    expect(esTranslations).toHaveProperty('nav');
    expect(esTranslations).toHaveProperty('auth');
    expect(esTranslations).toHaveProperty('chat');
    expect(esTranslations).toHaveProperty('documents');
    expect(esTranslations).toHaveProperty('lawyers');
    expect(esTranslations).toHaveProperty('common');
  });

  test('should have all translation keys for French', () => {
    const frTranslations = i18n.getResourceBundle('fr', 'translation');
    
    expect(frTranslations).toHaveProperty('app');
    expect(frTranslations).toHaveProperty('nav');
    expect(frTranslations).toHaveProperty('auth');
    expect(frTranslations).toHaveProperty('chat');
    expect(frTranslations).toHaveProperty('documents');
    expect(frTranslations).toHaveProperty('lawyers');
    expect(frTranslations).toHaveProperty('common');
  });

  test('should have all translation keys for Italian', () => {
    const itTranslations = i18n.getResourceBundle('it', 'translation');
    
    expect(itTranslations).toHaveProperty('app');
    expect(itTranslations).toHaveProperty('nav');
    expect(itTranslations).toHaveProperty('auth');
    expect(itTranslations).toHaveProperty('chat');
    expect(itTranslations).toHaveProperty('documents');
    expect(itTranslations).toHaveProperty('lawyers');
    expect(itTranslations).toHaveProperty('common');
  });

  test('should translate app title in all languages', () => {
    i18n.changeLanguage('de');
    expect(i18n.t('app.title')).toBe('SmartLaw Agent - Mietrecht');

    i18n.changeLanguage('tr');
    expect(i18n.t('app.title')).toBe('SmartLaw Agent - Kira Hukuku');

    i18n.changeLanguage('ar');
    expect(i18n.t('app.title')).toBe('SmartLaw Agent - قانون الإيجار');

    i18n.changeLanguage('es');
    expect(i18n.t('app.title')).toBe('SmartLaw Agent - Derecho de Arrendamiento');

    i18n.changeLanguage('fr');
    expect(i18n.t('app.title')).toBe('SmartLaw Agent - Droit Locatif');

    i18n.changeLanguage('it');
    expect(i18n.t('app.title')).toBe('SmartLaw Agent - Diritto degli Affitti');
  });

  test('should have consistent structure across all languages', () => {
    const deKeys = Object.keys(i18n.getResourceBundle('de', 'translation'));
    const trKeys = Object.keys(i18n.getResourceBundle('tr', 'translation'));
    const arKeys = Object.keys(i18n.getResourceBundle('ar', 'translation'));
    const esKeys = Object.keys(i18n.getResourceBundle('es', 'translation'));
    const frKeys = Object.keys(i18n.getResourceBundle('fr', 'translation'));
    const itKeys = Object.keys(i18n.getResourceBundle('it', 'translation'));

    expect(deKeys).toEqual(trKeys);
    expect(deKeys).toEqual(arKeys);
    expect(deKeys).toEqual(esKeys);
    expect(deKeys).toEqual(frKeys);
    expect(deKeys).toEqual(itKeys);
  });

  test('SUPPORTED_LANGUAGES should contain all languages', () => {
    expect(SUPPORTED_LANGUAGES).toContain('de');
    expect(SUPPORTED_LANGUAGES).toContain('tr');
    expect(SUPPORTED_LANGUAGES).toContain('ar');
    expect(SUPPORTED_LANGUAGES).toContain('es');
    expect(SUPPORTED_LANGUAGES).toContain('fr');
    expect(SUPPORTED_LANGUAGES).toContain('it');
  });

  test('LANGUAGE_NAMES should have names for all languages', () => {
    expect(LANGUAGE_NAMES.de).toBe('Deutsch');
    expect(LANGUAGE_NAMES.tr).toBe('Türkçe');
    expect(LANGUAGE_NAMES.ar).toBe('العربية');
    expect(LANGUAGE_NAMES.es).toBe('Español');
    expect(LANGUAGE_NAMES.fr).toBe('Français');
    expect(LANGUAGE_NAMES.it).toBe('Italiano');
  });

  test('should not escape HTML by default', () => {
    expect(i18n.options.interpolation?.escapeValue).toBe(false);
  });

  test('should change language and update localStorage', () => {
    const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
    
    i18n.changeLanguage('tr');
    
    expect(mockSetItem).toHaveBeenCalledWith('language', 'tr');
    
    mockSetItem.mockRestore();
  });

  test('should set document direction for RTL languages', () => {
    i18n.changeLanguage('ar');
    expect(document.documentElement.dir).toBe('rtl');

    i18n.changeLanguage('de');
    expect(document.documentElement.dir).toBe('ltr');
  });

  test('should set document lang attribute', () => {
    i18n.changeLanguage('de');
    expect(document.documentElement.lang).toBe('de');

    i18n.changeLanguage('tr');
    expect(document.documentElement.lang).toBe('tr');

    i18n.changeLanguage('ar');
    expect(document.documentElement.lang).toBe('ar');

    i18n.changeLanguage('es');
    expect(document.documentElement.lang).toBe('es');

    i18n.changeLanguage('fr');
    expect(document.documentElement.lang).toBe('fr');

    i18n.changeLanguage('it');
    expect(document.documentElement.lang).toBe('it');
  });
});