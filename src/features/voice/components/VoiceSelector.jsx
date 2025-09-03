import React, { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useVoiceConfig } from "../context/VoiceConfigContext";
import { VOICE_OPTIONS } from "../constants/voiceConstants";
import "./VoiceSelector.css";

const VoiceSelector = ({ disabled = false }) => {
  const { t } = useTranslation();
  const { voiceConfig, updateVoiceName } = useVoiceConfig();

  const availableVoices = useMemo(() => {
    return VOICE_OPTIONS[voiceConfig.languageCode] || [];
  }, [voiceConfig.languageCode]);

  const filteredVoices = useMemo(() => {
    if (!voiceConfig?.ssmlGender || voiceConfig.ssmlGender === "NEUTRAL") {
      return availableVoices;
    }
    const target = voiceConfig.ssmlGender === "MALE" ? "Male" : "Female";
    return availableVoices.filter((v) => v.gender === target);
  }, [availableVoices, voiceConfig?.ssmlGender]);

  const currentVoice = (filteredVoices.length ? filteredVoices : availableVoices).find(
    (voice) => voice.name === voiceConfig.name,
  );

  useEffect(() => {
    const voiceList = filteredVoices.length ? filteredVoices : availableVoices;
    const stillValid = voiceList.some((v) => v.name === voiceConfig.name);
    if (!stillValid && voiceList.length > 0) {
      updateVoiceName(voiceList[0].name);
    }
  }, [filteredVoices, availableVoices, voiceConfig.name, updateVoiceName]);

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
          disabled={disabled || (filteredVoices.length === 0 && availableVoices.length === 0)}
        >
          {(filteredVoices.length ? filteredVoices : availableVoices).map((voice) => (
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
