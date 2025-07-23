import React, { createContext, useContext, useState, useCallback } from "react";
import { DEFAULT_VOICE_CONFIG } from "../constants/voiceConstants";

const VoiceConfigContext = createContext();

export const useVoiceConfig = () => {
  const context = useContext(VoiceConfigContext);
  if (!context) {
    throw new Error("useVoiceConfig must be used within a VoiceConfigProvider");
  }
  return context;
};

export const VoiceConfigProvider = ({ children }) => {
  const [voiceConfig, setVoiceConfig] = useState(() => {
    // Try to load from localStorage
    try {
      const saved = localStorage.getItem("ar-avatar-voice-config");
      return saved ? JSON.parse(saved) : DEFAULT_VOICE_CONFIG;
    } catch (error) {
      console.warn("Failed to load voice config from localStorage:", error);
      return DEFAULT_VOICE_CONFIG;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Save to localStorage whenever config changes
  const saveToLocalStorage = useCallback((config) => {
    try {
      localStorage.setItem("ar-avatar-voice-config", JSON.stringify(config));
    } catch (error) {
      console.warn("Failed to save voice config to localStorage:", error);
    }
  }, []);

  const updateVoiceConfig = useCallback(
    (updates) => {
      setVoiceConfig((prev) => {
        const newConfig = { ...prev, ...updates };
        saveToLocalStorage(newConfig);
        return newConfig;
      });
      setError(null);
    },
    [saveToLocalStorage],
  );

  const updateLanguage = useCallback(
    (languageCode) => {
      // When language changes, we need to update the voice name to match the new language
      const getDefaultVoiceForLanguage = (langCode) => {
        switch (langCode) {
          case "en-US":
            return "en-US-Wavenet-D";
          case "es-US":
            return "es-US-Wavenet-A";
          case "es-ES":
            return "es-ES-Wavenet-A";
          default:
            return "en-US-Wavenet-D";
        }
      };

      updateVoiceConfig({
        languageCode,
        name: getDefaultVoiceForLanguage(languageCode),
      });
    },
    [updateVoiceConfig],
  );

  const updateVoiceName = useCallback(
    (name) => {
      updateVoiceConfig({ name });
    },
    [updateVoiceConfig],
  );

  const updateSsmlGender = useCallback(
    (ssmlGender) => {
      updateVoiceConfig({ ssmlGender });
    },
    [updateVoiceConfig],
  );

  const updateSpeakingRate = useCallback(
    (speakingRate) => {
      updateVoiceConfig({ speakingRate: parseFloat(speakingRate) });
    },
    [updateVoiceConfig],
  );

  const updatePitch = useCallback(
    (pitch) => {
      updateVoiceConfig({ pitch: parseFloat(pitch) });
    },
    [updateVoiceConfig],
  );

  const resetToDefaults = useCallback(() => {
    setVoiceConfig(DEFAULT_VOICE_CONFIG);
    saveToLocalStorage(DEFAULT_VOICE_CONFIG);
    setError(null);
  }, [saveToLocalStorage]);

  // Convert to the format expected by the TTS service
  const getTTSConfig = useCallback(() => {
    return {
      languageCode: voiceConfig.languageCode,
      name: voiceConfig.name,
      ssmlGender: voiceConfig.ssmlGender,
      speakingRate: voiceConfig.speakingRate,
      pitch: voiceConfig.pitch,
    };
  }, [voiceConfig]);

  const contextValue = {
    voiceConfig,
    isLoading,
    error,
    updateVoiceConfig,
    updateLanguage,
    updateVoiceName,
    updateSsmlGender,
    updateSpeakingRate,
    updatePitch,
    resetToDefaults,
    getTTSConfig,
    setIsLoading,
    setError,
  };

  return <VoiceConfigContext.Provider value={contextValue}>{children}</VoiceConfigContext.Provider>;
};
