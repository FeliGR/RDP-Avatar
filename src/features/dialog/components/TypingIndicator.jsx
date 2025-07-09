import React, { useState, useEffect } from "react";

const TypingIndicator = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`typing-indicator ${isVisible ? 'visible' : ''}`} aria-label="AI is typing">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
};

export default TypingIndicator;
