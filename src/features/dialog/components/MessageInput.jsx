import React, { useEffect, useRef, useState } from "react";
import { TYPING_DEBOUNCE_DELAY, TYPING_EVENTS } from "../constants/constants";
import VoiceInput from "./VoiceInput";

/**
 * Component for message input with text and voice capabilities
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSendMessage - Function to call when sending a message
 * @param {boolean} props.isLoading - Whether the bot is currently responding
 * @param {boolean} props.isListening - Whether voice recognition is active
 * @param {Function} props.onToggleVoice - Function to toggle voice recognition
 */
const MessageInput = ({ onSendMessage, isLoading, isListening, onToggleVoice }) => {
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
    <form onSubmit={handleSubmit} className="message-input-form">
      <VoiceInput isListening={isListening} disabled={isLoading} onClick={onToggleVoice} />

      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask me anything about your AI self…"
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
  );
};

export default MessageInput;
