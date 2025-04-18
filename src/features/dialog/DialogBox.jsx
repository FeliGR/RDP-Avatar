import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePersonality } from "../../features/personality/PersonalityContext";
import VoiceCommandProcessor from "../voice/voiceCommands";
import "./DialogBox.css";
import { useDialog } from "./DialogContext";

// Create a custom event for typing status
export const TYPING_EVENTS = {
  START: 'user-typing-start',
  STOP: 'user-typing-stop'
};

const DialogBox = () => {
  const { messages, sendUserMessage, isLoading, error, clearConversation } =
    useDialog();
  const { updateTrait, personalityTraits } = usePersonality();
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [commandProcessor, setCommandProcessor] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom of messages with a more reliable approach
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Force immediate scroll without animation
      messagesEndRef.current.scrollIntoView(false);
      
      // Double-ensure scroll position with a small delay and direct DOM manipulation
      setTimeout(() => {
        const container = document.querySelector('.messages-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 50);
    }
  };

  // Use useLayoutEffect instead of useEffect for DOM measurements before browser paint
  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Dispatch custom events for typing to notify avatar
  const dispatchTypingEvent = (isTyping) => {
    const eventName = isTyping ? TYPING_EVENTS.START : TYPING_EVENTS.STOP;
    document.dispatchEvent(new CustomEvent(eventName));
  };

  // Handle recognition end (called when speech recognition stops)
  const handleRecognitionEnd = () => {
    setIsListening(false);
    setStatusMessage("Voice recognition complete");
    
    // Also dispatch typing stop event 
    dispatchTypingEvent(false);
    
    // Clear status message after 2 seconds
    setTimeout(() => {
      setStatusMessage("");
    }, 2000);
  };

  // Initialize voice command processor if not yet done
  useEffect(() => {
    if (!commandProcessor) {
      const handleDialog = (text) => {
        sendUserMessage(text);
      };

      const handlePersonality = (trait, action, value) => {
        let newValue;
        const currentValue = personalityTraits[trait];

        if (action === "increase") {
          newValue = Math.min(5.0, currentValue + value);
        } else if (action === "decrease") {
          newValue = Math.max(1.0, currentValue - value);
        } else if (action === "set") {
          newValue = Math.max(1.0, Math.min(5.0, value));
        }

        if (newValue !== undefined) {
          updateTrait(trait, newValue);
          setStatusMessage(`Updated ${trait} to ${newValue.toFixed(1)}`);
          
          // Clear status message after 2 seconds
          setTimeout(() => {
            setStatusMessage("");
          }, 2000);
        }
      };

      const processor = new VoiceCommandProcessor(
        handleDialog,
        handlePersonality,
        handleRecognitionEnd // Pass the callback for when recognition ends
      );
      setCommandProcessor(processor);
    }
  }, [commandProcessor, sendUserMessage, updateTrait, personalityTraits]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const messageToSend = inputText.trim();
    
    // Clear input text immediately
    setInputText("");
    
    // Dispatch typing stop event
    dispatchTypingEvent(false);
    
    // Clear any pending typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // After clearing the input, send the message
    await sendUserMessage(messageToSend);
  };

  // Handle typing events for the avatar
  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    
    // Dispatch typing start event
    dispatchTypingEvent(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      dispatchTypingEvent(false);
    }, 2000);
  };

  // Send message on Ctrl+Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && inputText.trim()) {
      handleSubmit(e);
    }
  };

  // Voice input toggle
  const toggleVoiceInput = () => {
    if (isListening) {
      commandProcessor.stopListening();
      setStatusMessage("Voice recognition stopped");
      setIsListening(false);
      
      // Dispatch typing stop event
      dispatchTypingEvent(false);
      
      // Clear status message after 2 seconds
      setTimeout(() => {
        setStatusMessage("");
      }, 2000);
    } else {
      const started = commandProcessor.startListening();
      if (started) {
        setStatusMessage("Listening...");
        setIsListening(true);
        
        // Dispatch typing start event since voice is active
        dispatchTypingEvent(true);
      } else {
        setStatusMessage("Failed to start voice recognition");
        
        // Clear error message after 2 seconds
        setTimeout(() => {
          setStatusMessage("");
        }, 2000);
      }
    }
  };
  
  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="dialog-box">
      <div className="dialog-header">
        <button
          className="clear-button"
          onClick={clearConversation}
          disabled={isLoading || messages.length === 0}
        >
          Clear Chat
        </button>
        {statusMessage && <div className="voice-status-message">{statusMessage}</div>}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>Start a conversation with your AI avatar</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.sender === "user" ? "user-message" : "bot-message"
                }`}
              >
                <div className="message-content">
                  <p>{message.text}</p>
                </div>
                <div className="message-timestamp">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="message-input-form">
        {/* Voice input button */}
        <button 
          type="button"
          className={`voice-input-button ${isListening ? 'listening' : ''}`}
          onClick={toggleVoiceInput}
          disabled={isLoading}
          aria-label={isListening ? "Stop voice recognition" : "Start voice recognition"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
        
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about your AI self…"
          disabled={isLoading}
          className="message-input"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="send-button"
          aria-label="Send message"
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default DialogBox;
