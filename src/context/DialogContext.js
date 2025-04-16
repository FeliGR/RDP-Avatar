import React, { createContext, useContext, useState } from "react";
import { sendMessage } from "../services/api";
import { usePersonality } from "./PersonalityContext";

// Create the context
export const DialogContext = createContext();

// Custom hook for accessing the context
export const useDialog = () => useContext(DialogContext);

// Sample responses when API is unavailable
const FALLBACK_RESPONSES = [
  "I'm here to help, but I seem to be disconnected from my brain at the moment.",
  "I'd love to chat more, but my backend service is currently unavailable.",
  "Sorry, I can't access my full capabilities right now. The API service appears to be offline.",
  "I'm running in offline mode right now. My responses are limited.",
  "Hmm, I can't reach my API server. I'll do my best with basic responses.",
];

// Provider component
export const DialogProvider = ({ children }) => {
  const { personalityTraits, apiAvailable } = usePersonality();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogApiAvailable, setDialogApiAvailable] = useState(true);

  // Get a random fallback response
  const getFallbackResponse = () => {
    const index = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
    return FALLBACK_RESPONSES[index];
  };

  // Send a message to the Dialog Orchestrator
  const sendUserMessage = async (text) => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user message to the conversation
      const userMessage = {
        id: Date.now(),
        text,
        sender: "user",
        timestamp: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);

      let responseText;
      
      // Only try to call the API if we think it's available
      if (dialogApiAvailable && apiAvailable) {
        try {
          // Send to Dialog Orchestrator
          const response = await sendMessage(personalityTraits.userId, text);
          responseText = response.text;
          setDialogApiAvailable(true);
        } catch (apiError) {
          console.error("API call failed:", apiError);
          responseText = getFallbackResponse();
          setDialogApiAvailable(false);
          setError("API server unavailable - using fallback responses");
        }
      } else {
        // Use fallback response if we know API is unavailable
        responseText = getFallbackResponse();
        console.log("Using fallback response - API known to be unavailable");
      }

      // Add bot response to the conversation
      const botMessage = {
        id: Date.now() + 1,
        text: responseText,
        sender: "bot",
        timestamp: new Date().toISOString(),
        isOffline: !dialogApiAvailable
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
      return botMessage;
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to get a response. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear conversation history
  const clearConversation = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <DialogContext.Provider
      value={{
        messages,
        isLoading,
        error,
        sendUserMessage,
        clearConversation,
        apiAvailable: dialogApiAvailable
      }}
    >
      {children}
    </DialogContext.Provider>
  );
};
