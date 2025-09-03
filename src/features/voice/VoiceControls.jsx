import React from "react";
import { useTranslation } from "react-i18next";
import { useVoiceConfig } from "./context/VoiceConfigContext";
import { useTTS } from "./context/TTSContext";
import { ErrorMessage } from "../../shared";
import LanguageSelector from "./components/LanguageSelector";
import VoiceSelector from "./components/VoiceSelector";
import SsmlGenderSelector from "./components/SsmlGenderSelector";
import VoiceParameterSlider from "./components/VoiceParameterSlider";
import { getVoiceParameters } from "./constants/voiceConstants";
import "./VoiceControls.css";

const VoiceControls = () => {
  const { t } = useTranslation();
  const { voiceConfig, resetToDefaults, isLoading, error } = useVoiceConfig();
  const { isPlaying } = useTTS();

  const voiceParameters = getVoiceParameters(t);

  const handleReset = () => {
    if (window.confirm(t("voice.confirmReset") || "Reset all voice settings to defaults?")) {
      resetToDefaults();
    }
  };

  return (
    <div className="voice-controls">
      <ErrorMessage message={error} />

      {isLoading && <div className="loading-indicator" aria-label={t("common.loading")} />}

      <div className="voice-controls__content">
        {/* Language Selection Card */}
        <div className="voice-control-card language-card">
          <div className="voice-control-card__header">
            <label className="voice-control-card__title">{t("voice.language")}</label>
          </div>
          <div className="voice-control-card__content">
            <LanguageSelector disabled={isLoading || isPlaying} />
          </div>
        </div>

        {/* Voice Selection Card */}
        <div className="voice-control-card voice-card">
          <div className="voice-control-card__header">
            <label className="voice-control-card__title">{t("voice.voiceModel")}</label>
          </div>
          <div className="voice-control-card__content">
            <VoiceSelector disabled={isLoading || isPlaying} />
          </div>
        </div>

        {/* Gender Selection Card */}
        <div className="voice-control-card gender-card">
          <div className="voice-control-card__header">
            <label className="voice-control-card__title">{t("voice.voiceGender")}</label>
          </div>
          <div className="voice-control-card__content">
            <SsmlGenderSelector disabled={isLoading || isPlaying} />
          </div>
        </div>

        {/* Speaking Rate Card */}
        <div className="voice-control-card rate-card">
          <VoiceParameterSlider
            parameter="speakingRate"
            config={voiceParameters.speakingRate}
            value={voiceConfig.speakingRate}
            disabled={isLoading || isPlaying}
          />
        </div>

        {/* Pitch Card */}
        <div className="voice-control-card pitch-card">
          <VoiceParameterSlider
            parameter="pitch"
            config={voiceParameters.pitch}
            value={voiceConfig.pitch}
            disabled={isLoading || isPlaying}
          />
        </div>

        {/* Reset Card */}
        <div className="voice-control-card reset-card">
          <div className="voice-control-card__content">
            <button
              className="voice-controls__reset-btn"
              onClick={handleReset}
              disabled={isLoading || isPlaying}
              title={t("voice.resetAll") || "Reset all settings to defaults"}
            >
              <span className="reset-icon">↻</span>
              <span className="reset-text">
                {t("voice.resetAllSettings") || "Reset All Settings"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceControls;
