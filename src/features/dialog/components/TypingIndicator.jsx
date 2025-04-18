import React from "react";

/**
 * Component that displays a typing animation when the AI is preparing a response
 */
const TypingIndicator = () => {
  return (
    <div className="typing-indicator" aria-label="AI is typing">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
};

export default TypingIndicator;
