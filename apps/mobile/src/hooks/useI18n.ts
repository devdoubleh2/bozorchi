import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';

export const useI18n = () => {
  const { t, i18n } = useTranslation();
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();

  return {
    t,
    i18n,
    currentLanguage,
    changeLanguage,
    availableLanguages,
    isRTL: false, // Add RTL support if needed in the future
  };
};
