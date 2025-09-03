import React from "react";
import { useTranslation } from "react-i18next";
import { useVoiceConfig } from "../context/VoiceConfigContext";
import { VOICE_OPTIONS } from "../constants/voiceConstants";
import "./VoiceSelector.css";

const VoiceSelector = ({ disabled = false }) => {
  const { t } = useTranslation();
  const { voiceConfig, updateVoiceName } = useVoiceConfig();

  const availableVoices = VOICE_OPTIONS[voiceConfig.languageCode] || [];
  const currentVoice = availableVoices.find((voice) => voice.name === voiceConfig.name);

  const handleVoiceChange = (event) => {
    updateVoiceName(event.target.value);
  };

  return (
    <div className="voice-selector">
      <div className="voice-selector__wrapper">
        <select
          id="voice-select"
          className="voice-selector__select"
          value={voiceConfig.name}
          onChange={handleVoiceChange}
          disabled={disabled || availableVoices.length === 0}
        >
          {availableVoices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.label} ({t(`voice.voiceGenders.${voice.gender}`)})
            </option>
          ))}
        </select>
      </div>
      {currentVoice && (
        <div className="voice-selector__info">
          <span className="voice-selector__info-icon">
            {currentVoice.gender === "Male" ? "♂" : "♀"}
          </span>
          <span className="voice-selector__info-text">
            {t(`voice.voiceGenders.${currentVoice.gender}`)} {t("voice.voiceLabel")} -{" "}
            {currentVoice.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default VoiceSelector;
