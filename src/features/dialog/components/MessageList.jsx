import React, { useRef } from "react";
import useScrollToBottom from "../hooks/useScrollToBottom";
import TypingIndicator from "./TypingIndicator";

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

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
