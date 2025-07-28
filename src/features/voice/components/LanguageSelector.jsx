import React from "react";
import { useTranslation } from "react-i18next";
import { useVoiceConfig } from "../context/VoiceConfigContext";
import { LANGUAGE_OPTIONS } from "../constants/voiceConstants";
import "./LanguageSelector.css";

const LanguageSelector = ({ disabled = false }) => {
  const { t } = useTranslation();
  const { voiceConfig, updateLanguage } = useVoiceConfig();

  const handleLanguageChange = (event) => {
    updateLanguage(event.target.value);
  };

  const currentLanguage = LANGUAGE_OPTIONS.find((lang) => lang.code === voiceConfig.languageCode);

  return (
    <div className="language-selector">
      <div className="language-selector__wrapper">
        <span className="language-selector__flag">{currentLanguage?.flag || "🌐"}</span>
        <select
          id="language-select"
          className="language-selector__select"
          value={voiceConfig.languageCode}
          onChange={handleLanguageChange}
          disabled={disabled}
        >
          {LANGUAGE_OPTIONS.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>
      </div>
      <div className="language-selector__info">
        <span className="language-selector__current">
          {currentLanguage?.label || t('voice.unknownLanguage')}
        </span>
      </div>
    </div>
  );
};

export default LanguageSelector;
