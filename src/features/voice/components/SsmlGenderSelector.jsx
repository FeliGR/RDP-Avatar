import React from "react";
import { useVoiceConfig } from "../context/VoiceConfigContext";
import { SSML_GENDER_OPTIONS } from "../constants/voiceConstants";
import "./SsmlGenderSelector.css";

const SsmlGenderSelector = ({ disabled = false }) => {
  const { voiceConfig, updateSsmlGender } = useVoiceConfig();

  const handleGenderChange = (e) => {
    updateSsmlGender(e.target.value);
  };

  return (
    <div className="ssml-gender-selector">
      <div className="ssml-gender-selector__options">
        {SSML_GENDER_OPTIONS.map((option) => (
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
