import React from "react";
import { useTranslation } from "react-i18next";
import { useVoiceConfig } from "../context/VoiceConfigContext";
import { getSsmlGenderOptions } from "../constants/voiceConstants";
import "./SsmlGenderSelector.css";

const SsmlGenderSelector = ({ disabled = false }) => {
  const { t } = useTranslation();
  const { voiceConfig, updateSsmlGender } = useVoiceConfig();

  const handleGenderChange = (e) => {
    updateSsmlGender(e.target.value);
  };

  const genderOptions = getSsmlGenderOptions(t);

  return (
    <div className="ssml-gender-selector">
      <div className="ssml-gender-selector__options">
        {genderOptions.map((option) => (
          <label
            key={option.value}
            className={`ssml-gender-selector__option ${
              voiceConfig.ssmlGender === option.value ? "selected" : ""
            } ${disabled ? "disabled" : ""}`}
          >
            <input
              type="radio"
              name="ssmlGender"
              value={option.value}
              checked={voiceConfig.ssmlGender === option.value}
              onChange={handleGenderChange}
              disabled={disabled}
              className="ssml-gender-selector__radio"
            />
            <span className="ssml-gender-selector__icon">{option.icon}</span>
            <span className="ssml-gender-selector__text">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default SsmlGenderSelector;
