import React from "react";
import { usePersonality } from "../personality";
import "./DialogBox.css";
import { useDialog } from "./context/DialogContext";
import MessageInput from "./components/MessageInput";
import MessageList from "./components/MessageList";
import useVoiceCommands from "./hooks/useVoiceCommands";
import { useTTS } from "../voice/context/TTSContext";

const DialogBox = () => {
  const { messages, sendUserMessage, isLoading, error } = useDialog();
  const { updateTrait, personalityTraits } = usePersonality();
  const { isListening, statusMessage, toggleVoiceInput } = useVoiceCommands(
    sendUserMessage,
    updateTrait,
    personalityTraits,
  );
  const { isPlaying } = useTTS();

  return (
    <div className="dialog-box">
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
