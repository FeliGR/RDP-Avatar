import React, { useEffect, useRef } from "react";
import { usePersonality } from "../personality";
import "./DialogBox.css";
import { useDialog } from "./context/DialogContext";
import MessageInput from "./components/MessageInput";
import MessageList from "./components/MessageList";
import useVoiceCommands from "./hooks/useVoiceCommands";
import { useTTS } from "../voice/context/TTSContext";
import { useRealTimeConversation } from "../voice";

const DialogBox = ({ isVisible = true }) => {
  const { messages, sendUserMessage, isLoading } = useDialog();
  const { updateTrait, personalityTraits } = usePersonality();
  const { isListening, statusMessage, toggleVoiceInput } = useVoiceCommands(
    sendUserMessage,
    updateTrait,
    personalityTraits,
  );
  const {
    isListening: isStreamListening,
    startRealTimeConversation,
    stopRealTimeConversation,
    conversationState,
    isRealTimeActive,
    isContinuousMode,
  } = useRealTimeConversation();
  useTTS();

  const isRealTimeActiveRef = useRef(isRealTimeActive);
  const stopRealTimeConversationRef = useRef(stopRealTimeConversation);

  useEffect(() => {
    isRealTimeActiveRef.current = isRealTimeActive;
    stopRealTimeConversationRef.current = stopRealTimeConversation;
  }, [isRealTimeActive, stopRealTimeConversation]);

  useEffect(() => {
    if (!isVisible && isRealTimeActive) {
      stopRealTimeConversation();
    }
  }, [isVisible, isRealTimeActive, stopRealTimeConversation]);

  useEffect(() => {
    return () => {
      if (isRealTimeActiveRef.current) {
        stopRealTimeConversationRef.current();
      }
    };
  }, []);

  const toggleRealTimeMode = async () => {
    if (isRealTimeActive) {
      await stopRealTimeConversation();
    } else {
      await startRealTimeConversation(true);
    }
  };

  return (
    <div className="dialog-box">
      {statusMessage && <div className="voice-status-message">{statusMessage}</div>}

      {/* Real-time streaming indicator */}
      {isRealTimeActive && (
        <div className={`real-time-indicator ${isContinuousMode ? "continuous" : ""}`}>
          <div className={`streaming-icon ${conversationState}`}>
            {isStreamListening ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4V2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                <path d="M12 6c-3.31 0-6 2.69-6 6h2c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4v2c3.31 0 6-2.69 6-6s-2.69-6-6-6z" />
              </svg>
            )}
          </div>
          <span className="streaming-status">
            {conversationState === "listening"
              ? "Listening..."
              : conversationState === "processing"
                ? "Processing..."
                : conversationState === "responding"
                  ? "AI Responding..."
                  : isContinuousMode
                    ? "Continuous Voice Mode"
                    : "Voice Mode Active"}
          </span>
        </div>
      )}

      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput
        onSendMessage={sendUserMessage}
        isLoading={isLoading}
        isListening={isListening}
        onToggleVoice={toggleVoiceInput}
        showRealTimeToggle={true}
        onToggleRealTime={toggleRealTimeMode}
        isRealTimeMode={isRealTimeActive}
      />
    </div>
  );
};

export default DialogBox;
