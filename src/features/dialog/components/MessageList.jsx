import React, { useRef } from "react";
import useScrollToBottom from "../hooks/useScrollToBottom";
import TypingIndicator from "./TypingIndicator";

/**
 * Component that renders a list of chat messages
 *
 * @param {Object} props - Component props
 * @param {Array} props.messages - Array of message objects
 * @param {boolean} props.isLoading - Whether the bot is currently responding
 */
const MessageList = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);

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

      {/* This invisible element is used for scrolling to bottom */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
