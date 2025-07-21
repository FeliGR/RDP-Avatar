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
  const { isPlaying: isTTSSpeaking } = useTTS();

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

  const toggleUnifiedVoiceMode = async () => {
    if (isRealTimeActive) {
      await stopRealTimeConversation();
    } else if (isListening) {
      toggleVoiceInput();
      await startRealTimeConversation(true);
    } else {
      await startRealTimeConversation(true);
    }
  };

  return (
    <div className="dialog-box">
      {statusMessage && <div className="voice-status-message">{statusMessage}</div>}

      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput
        onSendMessage={sendUserMessage}
        isLoading={isLoading}
        isListening={isListening || isStreamListening}
        onToggleVoice={toggleUnifiedVoiceMode}
        isRealTimeMode={isRealTimeActive}
      />
    </div>
  );
};

export default DialogBox;
