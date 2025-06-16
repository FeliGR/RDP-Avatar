import React, { createContext, useCallback, useContext, useState } from "react";
import { sendMessage } from "../../../services/api";
import { usePersonality } from "../../personality";
import { useAvatarAnimation } from "../../avatar/context/AvatarAnimationContext";

/**
 * Dialog context for managing conversation state and API interactions
 */
export const DialogContext = createContext();

/**
 * Custom hook for accessing the dialog context
 * @returns {Object} Dialog context values and methods
 */
export const useDialog = () => useContext(DialogContext);

const FALLBACK_RESPONSES = [
  "I'm here to help, but I seem to be disconnected from my brain at the moment.",
  "I'd love to chat more, but my backend service is currently unavailable.",
  "Sorry, I can't access my full capabilities right now. The API service appears to be offline.",
  "I'm running in offline mode right now. My responses are limited.",
  "Hmm, I can't reach my API server. I'll do my best with basic responses.",
];

/**
 * Provider component for Dialog context
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const DialogProvider = ({ children }) => {
  const { personalityTraits, apiAvailable: personalityApiAvailable } = usePersonality();
  const { triggerAIResponseAnimation } = useAvatarAnimation();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogApiAvailable, setDialogApiAvailable] = useState(true);

  /**
   * Create a message object with standard properties
   * @param {string} text - Message content
   * @param {string} sender - Message sender ('user' or 'bot')
   * @param {boolean} isOffline - Whether message was generated offline
   * @returns {Object} Formatted message object
   */
  const createMessage = useCallback((text, sender, isOffline = false) => {
    return {
      id: Date.now() + (sender === "bot" ? 1 : 0),
      text,
      sender,
      timestamp: new Date().toISOString(),
      ...(sender === "bot" && { isOffline }),
    };
  }, []);

  /**
   * Get a random fallback response for when the API is unavailable
   * @returns {string} Random fallback response
   */
  const getFallbackResponse = useCallback(() => {
    const index = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
    return FALLBACK_RESPONSES[index];
  }, []);

  /**
   * Parse API response into a standard text format
   * @param {Object|string} response - API response in various formats
   * @returns {string} Extracted text message
   */
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

    console.warn("Unexpected response format:", response);
    return "Received a response in an unexpected format.";
  }, []);

  /**
   * Handle API interaction to get bot response
   * @param {string} userId - User identifier
   * @param {string} messageText - User message text
   * @returns {Promise<string>} Bot response text
   */
  const fetchBotResponse = useCallback(
    async (userId, messageText) => {
      if (!dialogApiAvailable || !personalityApiAvailable) {
        console.log("Using fallback response - API known to be unavailable");
        return getFallbackResponse();
      }

      try {
        const response = await sendMessage(userId, messageText);

        const responseText = parseApiResponse(response);

        setDialogApiAvailable(true);

        return responseText;
      } catch (apiError) {
        console.error("API call failed:", apiError);
        setDialogApiAvailable(false);
        setError("API server unavailable - using fallback responses");
        return getFallbackResponse();
      }
    },
    [dialogApiAvailable, personalityApiAvailable, parseApiResponse, getFallbackResponse]
  );

  /**
   * Send a user message and get a bot response
   * @param {string} text - Message text to send
   * @returns {Promise<Object|null>} Bot message object or null if failed
   */
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

        // Trigger AI response animation when bot responds
        if (triggerAIResponseAnimation) {
          triggerAIResponseAnimation("all"); // Use all available animations for varied responses
        }

        return botMessage;
      } catch (err) {
        console.error("Failed to send message:", err);
        setError("Failed to get a response. Please try again.");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [
      personalityTraits.userId,
      dialogApiAvailable,
      fetchBotResponse,
      createMessage,
      triggerAIResponseAnimation,
    ]
  );

  /**
   * Clear conversation history
   */
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
