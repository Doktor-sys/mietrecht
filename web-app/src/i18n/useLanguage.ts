import { useTranslation } from 'react-i18next';
import { SupportedLanguage } from './types';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (language: SupportedLanguage) => {
    i18n.changeLanguage(language);
  };

  const currentLanguage = i18n.language as SupportedLanguage;

  const isRTL = currentLanguage === 'ar';

  return {
    currentLanguage,
    changeLanguage,
    isRTL,
    supportedLanguages: ['de', 'tr', 'ar'] as SupportedLanguage[],
  };
};
