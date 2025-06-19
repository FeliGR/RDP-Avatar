import React from "react";
import { usePersonality } from "../personality";
import "./DialogBox.css";
import { useDialog } from "./context/DialogContext";
import ErrorMessage from "./components/ErrorMessage";
import MessageInput from "./components/MessageInput";
import MessageList from "./components/MessageList";
import useVoiceCommands from "./hooks/useVoiceCommands";

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
      <ErrorMessage message={error} />
      {statusMessage && <div className="voice-status-message">{statusMessage}</div>}
      <MessageList messages={messages} isLoading={isLoading} />
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
