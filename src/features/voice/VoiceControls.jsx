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
        <div className="voice-controls__section">
          <div className="voice-controls__section-header">
            <h4 className="voice-controls__section-title">Language & Voice</h4>
            <button
              className="voice-controls__reset-btn"
              onClick={handleReset}
              disabled={isLoading || isPlaying}
              title="Reset to defaults"
            >
              ↻
            </button>
          </div>
          <LanguageSelector disabled={isLoading || isPlaying} />
          <VoiceSelector disabled={isLoading || isPlaying} />
          <SsmlGenderSelector disabled={isLoading || isPlaying} />
        </div>

        <div className="voice-controls__section">
          <h4 className="voice-controls__section-title">Voice Parameters</h4>
          <VoiceParameterSlider
            parameter="speakingRate"
            config={VOICE_PARAMETERS.speakingRate}
            value={voiceConfig.speakingRate}
            disabled={isLoading || isPlaying}
          />
          <VoiceParameterSlider
            parameter="pitch"
            config={VOICE_PARAMETERS.pitch}
            value={voiceConfig.pitch}
            disabled={isLoading || isPlaying}
          />
        </div>
      </div>
    </div>
  );
};

export default VoiceControls;
