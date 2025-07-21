import React, { useEffect, useState } from "react";
import { useTTS } from "../../voice/context/TTSContext";
import { useRealTimeConversation } from "../../voice";

const VoiceInput = ({ isListening, disabled, onClick, isRealTimeMode = false }) => {
  const { isPlaying: isTTSSpeaking } = useTTS();
  const { conversationState, isRealTimeActive } = useRealTimeConversation();
  const [delayedTTSState, setDelayedTTSState] = useState(false);

  // Add a small delay when TTS stops to allow avatar to return to idle
  useEffect(() => {
    if (isTTSSpeaking) {
      setDelayedTTSState(true);
    } else {
      // Delay the state change when TTS stops
      const timeout = setTimeout(() => {
        setDelayedTTSState(false);
      }, 800); // Give avatar time to return to idle
      
      return () => clearTimeout(timeout);
    }
  }, [isTTSSpeaking]);

  // Prioritize TTS speaking state - if TTS is playing, show orange regardless of other states
  const buttonState = delayedTTSState ? "speaking" :
    isRealTimeActive && conversationState === "listening" ? "listening" :
    isRealTimeActive && conversationState === "processing" ? "processing" :
    isRealTimeMode ? "realtime-active" : "default";

  return (
    <button
      type="button"
      className={`voice-input-button ${buttonState}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={
        delayedTTSState ? "AI is speaking" :
        isRealTimeActive && conversationState === "listening" ? "AI is listening" :
        isRealTimeActive && conversationState === "processing" ? "AI is processing" :
        isRealTimeMode ? "Exit Real-time Voice Mode" : "Enter Real-time Voice Mode"
      }
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    </button>
  );
};

export default VoiceInput;
