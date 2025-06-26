import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from "react";
import TTSService from "../../../services/TTSService";
import { useAvatarAnimation } from "../../avatar/context/AvatarAnimationContext";

const TTSContext = createContext();

export const useTTS = () => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error("useTTS must be used within a TTSProvider");
  }
  return context;
};

export const TTSProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const ttsServiceRef = useRef(null);
  const currentAudioRef = useRef(null);
  const animationServiceRef = useRef(null);
  
  const { animationService } = useAvatarAnimation();

  
  useEffect(() => {
    animationServiceRef.current = animationService;
  }, [animationService]);

  
  useEffect(() => {
    const initTTS = async () => {
      try {
        ttsServiceRef.current = new TTSService();
        const available = await ttsServiceRef.current.checkAvailability();
        setIsAvailable(available);
        
        if (!available) {
          console.warn('TTS service is not available');
        }
      } catch (error) {
        console.error('Failed to initialize TTS service:', error);
        setError(error.message);
        setIsAvailable(false);
      }
    };

    initTTS();
  }, []);

  /**
   * Start talking animations
   */
  const startTalkingAnimations = useCallback(async (audioSource = null) => {
    if (animationServiceRef.current) {
      try {
        return await animationServiceRef.current.startTalkingAnimations(audioSource);
      } catch (error) {
        console.error('Error starting talking animations:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: "Animation service not available" };
  }, []);

  /**
   * Stop talking animations
   */
  const stopTalkingAnimations = useCallback(async () => {
    if (animationServiceRef.current) {
      try {
        return await animationServiceRef.current.stopTalkingAnimations();
      } catch (error) {
        console.error('Error stopping talking animations:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: "Animation service not available" };
  }, []);

  /**
   * Speak text using TTS and trigger avatar animations
   * @param {string} text - Text to speak
   * @param {object} voiceConfig - Optional voice configuration
   * @returns {Promise<boolean>} Success status
   */
  const speak = useCallback(async (text, voiceConfig = null) => {
    if (!ttsServiceRef.current || !isAvailable) {
      console.warn('TTS service not available');
      return false;
    }

    if (!text || typeof text !== 'string') {
      console.warn('Invalid text provided to TTS');
      return false;
    }

    
    await stopSpeaking();

    try {
      setIsPlaying(true);
      setError(null);

      console.log('TTS: Synthesizing text:', text.substring(0, 50) + '...');

      
      const base64Audio = await ttsServiceRef.current.synthesizeText(text, voiceConfig);
      
      
      const audio = ttsServiceRef.current.createAudioElement(base64Audio);
      currentAudioRef.current = audio;

      
      const handlePlay = async () => {
        console.log('TTS: Starting speech playback');
        
        await startTalkingAnimations(audio);
      };

      const handleEnded = async () => {
        console.log('TTS: Speech playback ended');
        setIsPlaying(false);
        
        await stopTalkingAnimations();
        
        currentAudioRef.current = null;
      };

      const handleError = (audioError) => {
        console.error('TTS Audio playback error:', audioError);
        setError('Audio playback failed');
        setIsPlaying(false);
        stopTalkingAnimations();
        currentAudioRef.current = null;
      };

      
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      
      await audio.play();
      
      return true;
    } catch (error) {
      console.error('TTS Error:', error);
      
      
      let errorMessage = 'Speech synthesis failed';
      if (error.message.includes('No audio content')) {
        errorMessage = 'TTS service did not return audio content. Check if the TTS server is properly configured.';
      } else if (error.message.includes('HTTP error')) {
        errorMessage = 'TTS server returned an error. Check if the server is running on localhost:5003.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to TTS server. Make sure it\'s running on localhost:5003.';
      }
      
      setError(errorMessage);
      setIsPlaying(false);
      await stopTalkingAnimations();
      currentAudioRef.current = null;
      return false;
    }
  }, [isAvailable, startTalkingAnimations, stopTalkingAnimations]);

  /**
   * Stop current speech playback
   */
  const stopSpeaking = useCallback(async () => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      } catch (error) {
        console.warn('Error stopping audio:', error);
      }
    }
    
    setIsPlaying(false);
    await stopTalkingAnimations();
  }, [stopTalkingAnimations]);

  /**
   * Check if TTS is currently speaking
   * @returns {boolean} True if currently speaking
   */
  const isSpeaking = useCallback(() => {
    return isPlaying && currentAudioRef.current && !currentAudioRef.current.paused;
  }, [isPlaying]);

  
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  const contextValue = {
    speak,
    stopSpeaking,
    isSpeaking,
    isPlaying,
    isAvailable,
    error,
  };

  return (
    <TTSContext.Provider value={contextValue}>
      {children}
    </TTSContext.Provider>
  );
};

export default TTSProvider;
