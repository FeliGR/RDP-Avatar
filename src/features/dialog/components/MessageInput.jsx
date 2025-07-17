import React, { useEffect, useRef, useState } from "react";
import { TYPING_DEBOUNCE_DELAY, TYPING_EVENTS } from "../constants/constants";
import VoiceInput from "./VoiceInput";

const MessageInput = ({ 
  onSendMessage, 
  isLoading, 
  isListening, 
  onToggleVoice, 
  showRealTimeToggle = false, 
  onToggleRealTime, 
  isRealTimeMode = false 
}) => {
  const [inputText, setInputText] = useState("");
  const typingTimeoutRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const messageToSend = inputText.trim();

    setInputText("");

    document.dispatchEvent(new CustomEvent(TYPING_EVENTS.STOP));

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    onSendMessage(messageToSend);
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);

    document.dispatchEvent(new CustomEvent(TYPING_EVENTS.START));

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      document.dispatchEvent(new CustomEvent(TYPING_EVENTS.STOP));
    }, TYPING_DEBOUNCE_DELAY);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && inputText.trim()) {
      handleSubmit(e);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="message-input-container">      
      <form onSubmit={handleSubmit} className="message-input-form">
        <VoiceInput isListening={isListening} disabled={isLoading} onClick={onToggleVoice} />

        {showRealTimeToggle && (
          <button
            className={`voice-mode-btn ${isRealTimeMode ? "active" : ""}`}
            onClick={onToggleRealTime}
            title={isRealTimeMode ? "Exit Voice Mode" : "Enter Voice Mode"}
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 12H7c-.55 0-1-.45-1-1s.45-1 1-1h10c.55 0 1 .45 1 1s-.45 1-1 1zm0-3H7c-.55 0-1-.45-1-1s.45-1 1-1h10c.55 0 1 .45 1 1s-.45 1-1 1zm0-3H7c-.55 0-1-.45-1-1s.45-1 1-1h10c.55 0 1 .45 1 1s-.45 1-1 1z"/>
            </svg>
          </button>
        )}

        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          disabled={isLoading}
          className="message-input"
          aria-label="Message input"
        />

        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="send-button"
          aria-label="Send message"
        >
          {isLoading ? "⋯" : "➤"}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
