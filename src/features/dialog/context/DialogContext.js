import React, { createContext, useCallback, useContext, useState, useEffect, useRef } from "react";
import { sendMessage } from "../../../services/api";
import { usePersonality } from "../../personality";
import { useTTS } from "../../voice/context/TTSContext";
import { useVoiceConfig } from "../../voice/context/VoiceConfigContext";

export const DialogContext = createContext();

export const useDialog = () => useContext(DialogContext);

const FALLBACK_RESPONSES = [
  "I'm here to help, but I seem to be disconnected from my brain at the moment.",
  "I'd love to chat more, but my backend service is currently unavailable.",
  "Sorry, I can't access my full capabilities right now. The API service appears to be offline.",
  "I'm running in offline mode right now. My responses are limited.",
  "Hmm, I can't reach my API server. I'll do my best with basic responses.",
];

export const DialogProvider = ({ children }) => {
  const { personalityTraits, apiAvailable: personalityApiAvailable } = usePersonality();
  const { speak, isAvailable: ttsAvailable } = useTTS();
  const { getTTSConfig } = useVoiceConfig();

  const ttsAvailableRef = useRef(ttsAvailable);
  const speakRef = useRef(speak);
  const getTTSConfigRef = useRef(getTTSConfig);

  useEffect(() => {
    ttsAvailableRef.current = ttsAvailable;
    speakRef.current = speak;
    getTTSConfigRef.current = getTTSConfig;
  }, [ttsAvailable, speak, getTTSConfig]);

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogApiAvailable, setDialogApiAvailable] = useState(true);
  const createMessage = useCallback((text, sender, isOffline = false) => {
    return {
      id: Date.now() + (sender === "bot" ? 1 : 0),
      text,
      sender,
      timestamp: new Date().toISOString(),
      ...(sender === "bot" && { isOffline }),
    };
  }, []);
  const getFallbackResponse = useCallback(() => {
    const index = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
    return FALLBACK_RESPONSES[index];
  }, []);
  const parseApiResponse = useCallback((response) => {
    if (response.data && response.data.response) {
      return response.data.response;
    }
    if (response.text) {
      return response.text;
    }
    if (typeof response === "string") {
      return response;
    }
    return "Received a response in an unexpected format.";
  }, []);
  const fetchBotResponse = useCallback(
    async (userId, messageText) => {
      if (!dialogApiAvailable || !personalityApiAvailable) {
        return getFallbackResponse();
      }
      try {
        const response = await sendMessage(userId, messageText);
        const responseText = parseApiResponse(response);
        setDialogApiAvailable(true);
        return responseText;
      } catch (apiError) {
        setDialogApiAvailable(false);
        setError("API server unavailable - using fallback responses");
        return getFallbackResponse();
      }
    },
    [dialogApiAvailable, personalityApiAvailable, parseApiResponse, getFallbackResponse],
  );
  const sendUserMessage = useCallback(
    async (text) => {
      try {
        setIsLoading(true);
        setError(null);
        const userMessage = createMessage(text, "user");
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        const responseText = await fetchBotResponse(personalityTraits.userId, text);
        const botMessage = createMessage(responseText, "bot", !dialogApiAvailable);
        setMessages((prevMessages) => [...prevMessages, botMessage]);

        const currentTtsAvailable = ttsAvailableRef.current;
        const currentSpeak = speakRef.current;
        const currentGetTTSConfig = getTTSConfigRef.current;

        if (currentTtsAvailable && dialogApiAvailable && responseText) {
          try {
            const voiceConfig = currentGetTTSConfig();
            await currentSpeak(responseText, voiceConfig);
          } catch (ttsError) {
            console.warn("TTS failed for AI response:", ttsError);
          }
        }

        return botMessage;
      } catch (err) {
        setError("Failed to get a response. Please try again.");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [personalityTraits.userId, dialogApiAvailable, fetchBotResponse, createMessage],
  );
  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);
  const contextValue = {
    messages,
    isLoading,
    error,
    sendUserMessage,
    clearConversation,
    apiAvailable: dialogApiAvailable,
  };
  return <DialogContext.Provider value={contextValue}>{children}</DialogContext.Provider>;
};
