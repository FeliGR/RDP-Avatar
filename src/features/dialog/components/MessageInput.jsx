import React, { useEffect, useRef, useState } from "react";
import { TYPING_DEBOUNCE_DELAY, TYPING_EVENTS } from "../constants/constants";
import VoiceInput from "./VoiceInput";

const MessageInput = ({
  onSendMessage,
  isLoading,
  isListening,
  onToggleVoice,
  isRealTimeMode = false,
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
        <VoiceInput
          isListening={isListening}
          disabled={isLoading}
          onClick={onToggleVoice}
          isRealTimeMode={isRealTimeMode}
        />

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
