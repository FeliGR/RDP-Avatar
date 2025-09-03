/**
 * Text-to-Speech Service
 * Handles communication with Google Cloud Text-to-Speech API
 */
class TTSService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_AUDIO_ENGINE_URL || "http://localhost:5003";
    this.defaultVoiceConfig = {
      languageCode: "en-US",
      name: "en-US-Wavenet-D",
      ssmlGender: "NEUTRAL",
      speakingRate: 1.0,
      pitch: 0.0,
    };
  }

  /**
   * Synthesize text to speech
   * @param {string} text - The text to synthesize
   * @param {object} voiceConfig - Optional voice configuration
   * @returns {Promise<string>} Base64 encoded audio data
   */
  async synthesizeText(text, voiceConfig = null) {
    if (!text || typeof text !== "string") {
      throw new Error("Text is required for TTS synthesis");
    }

    if (text.length > 5000) {
      throw new Error("Text exceeds maximum length of 5000 characters");
    }

    try {
      // Use provided voiceConfig or fallback to default
      const finalVoiceConfig = voiceConfig
        ? { ...this.defaultVoiceConfig, ...voiceConfig }
        : this.defaultVoiceConfig;

      // Convert camelCase to snake_case for API compatibility
      const apiVoiceConfig = {
        language_code: finalVoiceConfig.languageCode,
        name: finalVoiceConfig.name,
        ssml_gender: finalVoiceConfig.ssmlGender,
        speaking_rate: finalVoiceConfig.speakingRate,
        pitch: finalVoiceConfig.pitch,
      };

      const requestBody = {
        text: text.trim(),
        voiceConfig: apiVoiceConfig,
      };

      const response = await fetch(`${this.baseUrl}/api/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.message || "TTS synthesis failed");
      }

      if (!result.data?.audioContent) {
        throw new Error("No audio content returned from TTS service");
      }

      return result.data.audioContent;
    } catch (error) {
      console.error("TTS Service Error:", error);
      throw new Error(`Failed to synthesize speech: ${error.message}`);
    }
  }

  /**
   * Create an audio element from base64 audio data
   * @param {string} base64Audio - Base64 encoded audio data
   * @returns {HTMLAudioElement} Audio element ready to play
   */
  createAudioElement(base64Audio) {
    if (!base64Audio) {
      throw new Error("Base64 audio data is required");
    }

    try {
      const audioBlob = this.base64ToBlob(base64Audio, "audio/mp3");
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);

      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(audioUrl);
      });

      return audio;
    } catch (error) {
      console.error("Error creating audio element:", error);
      throw new Error(`Failed to create audio element: ${error.message}`);
    }
  }

  /**
   * Convert base64 string to Blob
   * @param {string} base64 - Base64 string
   * @param {string} mimeType - MIME type of the blob
   * @returns {Blob} Blob object
   */
  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Check if TTS service is available
   * @returns {Promise<boolean>} True if service is available
   */
  async checkAvailability() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: "test" }),
      });

      return response.ok;
    } catch (error) {
      console.warn("TTS service unavailable:", error);
      return false;
    }
  }
}

export default TTSService;
