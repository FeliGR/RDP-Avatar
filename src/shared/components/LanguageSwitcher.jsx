import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.language;

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'es' : 'en';
    i18n.changeLanguage(newLanguage);
  };

  const getLanguageFlag = (lang) => {
    return lang === 'en' ? '🇺🇸' : '🇪🇸';
  };

  const getLanguageLabel = (lang) => {
    return lang === 'en' ? t('languageSwitcher.english') : t('languageSwitcher.spanish');
  };

  return (
    <div className="language-switcher">
      <button 
        className="language-switcher-btn"
        onClick={toggleLanguage}
        title={t('languageSwitcher.selectLanguage')}
        aria-label={`${t('languageSwitcher.selectLanguage')}: ${getLanguageLabel(currentLanguage)}`}
      >
        <span className="language-flag">{getLanguageFlag(currentLanguage)}</span>
        <span className="language-code">{currentLanguage.toUpperCase()}</span>
      </button>
    </div>
  );
};

export default LanguageSwitcher; 