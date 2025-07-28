import React from "react";
import { useVoiceConfig } from "./context/VoiceConfigContext";
import { useTTS } from "./context/TTSContext";
import "./VoiceControls.css";
import { ErrorMessage } from "../../shared";
import VoiceSelector from "./components/VoiceSelector";
import LanguageSelector from "./components/LanguageSelector";
import VoiceParameterSlider from "./components/VoiceParameterSlider";
import SsmlGenderSelector from "./components/SsmlGenderSelector";
import { VOICE_PARAMETERS } from "./constants/voiceConstants";

const VoiceControls = () => {
  const { voiceConfig, isLoading, error, resetToDefaults } = useVoiceConfig();
  const { isPlaying } = useTTS();

  const handleReset = () => {
    if (window.confirm("Reset all voice settings to defaults?")) {
      resetToDefaults();
    }
  };

  return (
    <div className="voice-controls">
      <ErrorMessage message={error} />

      {isLoading && <div className="loading-indicator" aria-label="Loading..." />}

      <div className="voice-controls__content">
        {/* Language Selection Card */}
        <div className="voice-control-card language-card">
          <div className="voice-control-card__header">
            <label className="voice-control-card__title">Language</label>
          </div>
          <LanguageSelector disabled={isLoading || isPlaying} />
        </div>

        {/* Voice Selection Card */}
        <div className="voice-control-card voice-card">
          <div className="voice-control-card__header">
            <label className="voice-control-card__title">Voice Model</label>
          </div>
          <VoiceSelector disabled={isLoading || isPlaying} />
        </div>

        {/* Gender Selection Card */}
        <div className="voice-control-card gender-card">
          <div className="voice-control-card__header">
            <label className="voice-control-card__title">Voice Gender</label>
          </div>
          <SsmlGenderSelector disabled={isLoading || isPlaying} />
        </div>

        {/* Speaking Rate Card */}
        <div className="voice-control-card rate-card">
          <VoiceParameterSlider
            parameter="speakingRate"
            config={VOICE_PARAMETERS.speakingRate}
            value={voiceConfig.speakingRate}
            disabled={isLoading || isPlaying}
          />
        </div>

        {/* Pitch Card */}
        <div className="voice-control-card pitch-card">
          <VoiceParameterSlider
            parameter="pitch"
            config={VOICE_PARAMETERS.pitch}
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
              title="Reset all settings to defaults"
            >
              <span className="reset-icon">↻</span>
              <span className="reset-text">Reset All Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceControls;
