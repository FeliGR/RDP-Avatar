import React, { useRef } from "react";
import useScrollToBottom from "../hooks/useScrollToBottom";
import TypingIndicator from "./TypingIndicator";
import { useTTS } from "../../voice/context/TTSContext";

const MessageList = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);
  const { isPlaying } = useTTS();

  useScrollToBottom(messagesEndRef, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="messages-container">
        <div className="empty-chat">
          <p>Start a conversation with your AI avatar</p>
        </div>
        <div ref={messagesEndRef} />
      </div>
    );
  }

  return (
    <div className="messages-container">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message ${message.sender === "user" ? "user-message" : "bot-message"}`}
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

      {isLoading && <TypingIndicator />}

      {isPlaying && (
        <div className="speaking-indicator" aria-label="AI is speaking">
          <div className="speaking-content">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
            <span>Speaking...</span>
            <div className="speaking-waves">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
