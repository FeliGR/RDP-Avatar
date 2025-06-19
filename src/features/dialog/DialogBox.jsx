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
  const { messages, sendUserMessage, isLoading, error } = useDialog();
  const { updateTrait, personalityTraits } = usePersonality();

  const { isListening, statusMessage, toggleVoiceInput } = useVoiceCommands(
    sendUserMessage,
    updateTrait,
    personalityTraits
  );

  return (
    <div className="dialog-box">
      {/* Error display */}
      <ErrorMessage message={error} />

      {/* Voice status message */}
      {statusMessage && <div className="voice-status-message">{statusMessage}</div>}

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
