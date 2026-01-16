import React from "react";
import { useTranslation } from "react-i18next";
import "./LanguageSelector.css";

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const currentLang = i18n.language || i18n.languages?.[0] || 'en';

  return (
    <div className="language-selector">
      <button
        className={`lang-button ${currentLang.startsWith('en') ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        aria-label="Switch to English"
      >
        🇬🇧 EN
      </button>
      <button
        className={`lang-button ${currentLang.startsWith('fr') ? 'active' : ''}`}
        onClick={() => changeLanguage('fr')}
        aria-label="Passer au français"
      >
        🇫🇷 FR
      </button>
    </div>
  );
};

export default LanguageSelector;
