import React, { createContext, useContext, useState } from 'react';
import { sendMessage } from '../services/api';
import { usePersonality } from './PersonalityContext';

// Create the context
export const DialogContext = createContext();

// Custom hook for accessing the context
export const useDialog = () => useContext(DialogContext);

// Provider component
export const DialogProvider = ({ children }) => {
  const { personalityTraits } = usePersonality();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Send a message to the Dialog Orchestrator
  const sendUserMessage = async (text) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to the conversation
      const userMessage = {
        id: Date.now(),
        text,
        sender: 'user',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Send to Dialog Orchestrator
      const response = await sendMessage(personalityTraits.userId, text);
      
      // Add bot response to the conversation
      const botMessage = {
        id: Date.now() + 1,
        text: response.text,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
      return botMessage;
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to get a response. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear conversation history
  const clearConversation = () => {
    setMessages([]);
  };

  return (
    <DialogContext.Provider value={{ 
      messages, 
      isLoading, 
      error,
      sendUserMessage,
      clearConversation
    }}>
      {children}
    </DialogContext.Provider>
  );
};