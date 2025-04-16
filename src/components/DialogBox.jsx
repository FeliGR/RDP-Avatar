import React, { useEffect, useRef, useState } from "react";
import { useDialog } from "../context/DialogContext";
import "./DialogBox.css";

const DialogBox = () => {
  const { messages, sendUserMessage, isLoading, error, clearConversation } =
    useDialog();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    await sendUserMessage(inputText.trim());
    setInputText("");
  };

  // Send message on Ctrl+Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && inputText.trim()) {
      handleSubmit(e);
    }
  };

  return (
    <div className="dialog-box">
      <div className="dialog-header">
        <h2>Conversation</h2>
        <button
          className="clear-button"
          onClick={clearConversation}
          disabled={isLoading || messages.length === 0}
        >
          Clear Chat
        </button>
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
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
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
