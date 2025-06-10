import React from "react";
import { usePersonality } from "../personality";
import "./DialogBox.css";
import { useDialog } from "./context/DialogContext";
import ErrorMessage from "./components/ErrorMessage";
import MessageInput from "./components/MessageInput";
import MessageList from "./components/MessageList";
import useVoiceCommands from "./hooks/useVoiceCommands";

/**
 * Main dialog box component that integrates all chat functionality
 */
const DialogBox = () => {
  const { messages, sendUserMessage, isLoading, error, clearConversation } =
    useDialog();
  const { updateTrait, personalityTraits } = usePersonality();

  // Voice command functionality
  const { isListening, statusMessage, toggleVoiceInput } = useVoiceCommands(
    sendUserMessage,
    updateTrait,
    personalityTraits
  );

  return (
    <div className="dialog-box">
      {/* Dialog header */}
      <div className="dialog-header">
        <button
          className="clear-button"
          onClick={clearConversation}
          disabled={isLoading || messages.length === 0}
          aria-label="Clear conversation"
        >
          Clear Chat
        </button>
        {statusMessage && (
          <div className="voice-status-message">{statusMessage}</div>
        )}
      </div>

      {/* Error display */}
      <ErrorMessage message={error} />

      {/* Messages display */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Message input */}
      <MessageInput
        onSendMessage={sendUserMessage}
        isLoading={isLoading}
        isListening={isListening}
        onToggleVoice={toggleVoiceInput}
      />
    </div>
  );
};

export default DialogBox;
