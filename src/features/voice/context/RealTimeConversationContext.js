import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from "react";
import STTService from "../../../services/STTService";
import { useDialog } from "../../dialog/context/DialogContext";
import { useTTS } from "../../voice/context/TTSContext";

const RealTimeConversationContext = createContext();

export const useRealTimeConversation = () => {
  const context = useContext(RealTimeConversationContext);
  if (!context) {
    throw new Error("useRealTimeConversation must be used within a RealTimeConversationProvider");
  }
  return context;
};

export const RealTimeConversationProvider = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [conversationState, setConversationState] = useState("idle"); // idle, listening, processing, responding
  const [streamRestartCount, setStreamRestartCount] = useState(0);
  const [lastRestartTime, setLastRestartTime] = useState(null);
  const [isContinuousMode, setIsContinuousMode] = useState(false);

  const sttServiceRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const silenceTimerRef = useRef(null);
  const processingTimeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  const conversationStateRef = useRef("idle");
  const isContinuousModeRef = useRef(false);

  const { sendUserMessage } = useDialog();
  const { speak, stopSpeaking, isPlaying } = useTTS();

  // Configuration for real-time conversation
  const conversationConfig = {
    silenceThreshold: 2000, // 2 seconds of silence before processing
    maxSpeechDuration: 30000, // 30 seconds max per utterance
    interimResultsEnabled: true,
    autoProcessing: true,
    restartDelay: 1000, // Delay before restarting listening after response
  };

  // Initialize STT service
  useEffect(() => {
    const initSTT = async () => {
      try {
        sttServiceRef.current = new STTService();
        const available = await sttServiceRef.current.checkAvailability();
        setIsAvailable(available);

        if (!available) {
          console.warn("STT service is not available");
          setError("Speech-to-Text service is not available");
        }
      } catch (error) {
        console.error("Failed to initialize STT service:", error);
        setError(error.message);
        setIsAvailable(false);
      }
    };

    initSTT();
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  useEffect(() => {
    isContinuousModeRef.current = isContinuousMode;
  }, [isContinuousMode]);

  // Setup STT callbacks
  const setupSTTCallbacks = useCallback(() => {
    if (!sttServiceRef.current) return;

    sttServiceRef.current.setCallbacks({
      onStart: () => {
        setIsListening(true);
        setConversationState("listening");
        setError(null);
        setInterimText("");
        finalTranscriptRef.current = "";
      },

      onInterimResult: (transcript, confidence) => {
        setInterimText(transcript);

        // Reset silence timer when we get new speech
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Set silence timer for auto-processing
        if (conversationConfig.autoProcessing) {
          silenceTimerRef.current = setTimeout(() => {
            if (finalTranscriptRef.current.trim()) {
              handleProcessTranscript();
            }
          }, conversationConfig.silenceThreshold);
        }
      },

      onFinalResult: (transcript, confidence, metadata = {}) => {
        console.log("📋 Final STT result:", transcript, "Confidence:", confidence);
        if (metadata.restartCount > 0) {
          console.log("🔄 Result from restarted stream:", metadata.restartCount, "restarts");
        }
        finalTranscriptRef.current = transcript;
        setInterimText("");

        // Clear silence timer since we have a final result
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Auto-process if confidence is reasonable (lowered threshold for better responsiveness)
        if (conversationConfig.autoProcessing && confidence > 0.15) {
          console.log("🎯 Auto-processing transcript with confidence:", confidence);
          handleProcessTranscript();
        } else {
          console.log("⚠️ Confidence too low for auto-processing:", confidence, "< 0.15");
        }
      },

      onError: (errorMessage) => {
        console.error("STT Error:", errorMessage);
        setError(errorMessage);
        setIsListening(false);
        setConversationState("idle");
        cleanupTimers();
      },

      onEnd: () => {
        setIsListening(false);
        if (conversationState !== "processing" && conversationState !== "responding") {
          setConversationState("idle");
        }
        cleanupTimers();
      },

      onStreamRestart: (restartCount) => {
        console.log("🔄 STT stream restarted, count:", restartCount);
        console.log("🔄 Current conversation state during restart:", conversationState);
        console.log("🔄 Is processing during restart:", isProcessing);
        console.log("🔄 Continuous mode active:", isContinuousMode);
        setStreamRestartCount(restartCount);
        setLastRestartTime(Date.now());

        // Check if restart happened during critical processing
        if (conversationState === "processing" || isProcessing) {
          console.warn(
            "⚠️ Stream restart occurred during conversation processing - resetting processing state",
          );

          // Reset processing state if stream restarts during processing
          setIsProcessing(false);
          isProcessingRef.current = false;

          // In continuous mode, go back to listening; otherwise go to idle
          if (isContinuousMode && !isPlaying) {
            console.log("🔄 Continuous mode: Returning to listening state after restart");
            setConversationState("listening");
            conversationStateRef.current = "listening";
          } else if (!isPlaying) {
            setConversationState("idle");
            conversationStateRef.current = "idle";
            console.log("🔄 Reset conversation state to idle after stream restart");
          }
        }
      },

      onAudioBridging: () => {
        console.log("🌉 Audio bridging active during stream restart");
        // Audio bridging is happening - this is normal for endless streaming
      },
    });
  }, [conversationState, conversationConfig.autoProcessing, conversationConfig.silenceThreshold]);

  // Restart listening for continuous conversation
  const restartListening = useCallback(async () => {
    if (!isContinuousModeRef.current || isProcessingRef.current) {
      console.log("🚫 Not restarting listening:", {
        continuousMode: isContinuousModeRef.current,
        isProcessing: isProcessingRef.current,
      });
      return false;
    }

    console.log("🎤 Restarting listening for continuous conversation");

    try {
      if (!sttServiceRef.current) {
        console.warn("⚠️ STT service not available for restart");
        return false;
      }

      // Check service availability before restarting
      const available = await sttServiceRef.current.checkAvailability();
      if (!available) {
        console.warn("⚠️ STT service availability check failed");
        setIsAvailable(false);
        return false;
      }

      // Update availability state
      setIsAvailable(true);

      // Ensure we're in listening state
      setConversationState("listening");
      conversationStateRef.current = "listening";

      setupSTTCallbacks();

      const success = await sttServiceRef.current.startStreaming({
        interimResults: conversationConfig.interimResultsEnabled,
        singleUtterance: false,
      });

      if (success) {
        console.log("✅ Successfully restarted listening");
      } else {
        console.warn("⚠️ Failed to restart listening, going to idle");
        setConversationState("idle");
        conversationStateRef.current = "idle";
      }

      return success;
    } catch (error) {
      console.error("❌ Error restarting listening:", error);
      setConversationState("idle");
      conversationStateRef.current = "idle";
      setIsAvailable(false);
      return false;
    }
  }, [setupSTTCallbacks, conversationConfig.interimResultsEnabled]);

  // Process the final transcript and send to dialog orchestrator
  const handleProcessTranscript = useCallback(async () => {
    const transcript = finalTranscriptRef.current.trim();

    console.log("🔄 Processing transcript:", transcript);

    if (!transcript) {
      console.warn("No transcript to process");
      return;
    }

    if (isProcessing) {
      console.warn("Already processing a transcript, ignoring duplicate:", transcript);
      return;
    }

    try {
      setIsProcessing(true);
      isProcessingRef.current = true; // Keep ref in sync
      setConversationState("processing");
      conversationStateRef.current = "processing"; // Keep ref in sync
      setInterimText("");

      console.log("🔧 Processing state set, current state:", {
        isProcessing: true,
        conversationState: "processing",
        streamRestartCount,
        timeSinceLastRestart: lastRestartTime ? Date.now() - lastRestartTime : null,
      });

      // Check if we're too close to a stream restart
      if (lastRestartTime && Date.now() - lastRestartTime < 1000) {
        console.warn(
          "⚠️ Processing started shortly after stream restart, adding delay for stability",
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Stop any current listening
      console.log("🛑 Stopping current listening...");
      await stopListening();
      console.log("✅ Listening stopped");

      // Stop any current TTS playback
      console.log("🔇 Stopping current TTS...");
      await stopSpeaking();
      console.log("✅ TTS stopped");

      console.log("Processing transcript:", transcript);

      // Set processing timeout (reduced to 15 seconds for faster recovery)
      processingTimeoutRef.current = setTimeout(() => {
        console.warn("⏰ Processing timeout reached after 15 seconds");
        setIsProcessing(false);
        setConversationState("idle");
        setError("Response timeout - please try again");
      }, 15000); // Reduced from 30 to 15 seconds

      // Send message to dialog orchestrator
      setConversationState("responding");
      console.log("📤 Sending to dialog orchestrator:", transcript);
      console.log("🕐 About to call sendUserMessage...");

      const botResponse = await sendUserMessage(transcript);

      console.log("✅ sendUserMessage completed");
      console.log("📨 Bot response received:", botResponse?.text?.substring(0, 50) + "...");

      // Clear processing timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }

      // Reset transcript
      finalTranscriptRef.current = "";

      // The TTS and avatar animation will be handled by the DialogContext
      console.log("Conversation turn completed");
    } catch (error) {
      console.error("❌ Error processing transcript:", error);
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        transcript: transcript,
      });
      setError("Failed to process your message. Please try again.");
    } finally {
      console.log("🔧 Finalizing processing, setting isProcessing to false");
      setIsProcessing(false);
      isProcessingRef.current = false; // Keep ref in sync

      // Wait for TTS to finish before allowing new input with timeout protection
      let ttsCheckCount = 0;
      const maxTtsChecks = 30; // 15 seconds max (30 * 500ms)

      const checkTTSComplete = () => {
        ttsCheckCount++;
        console.log(`🔍 Checking TTS state (${ttsCheckCount}/${maxTtsChecks}):`, {
          isPlaying,
          conversationState,
          ttsCheckCount,
          isContinuousMode: isContinuousModeRef.current,
        });

        if (!isPlaying || ttsCheckCount >= maxTtsChecks) {
          if (ttsCheckCount >= maxTtsChecks) {
            console.warn("⚠️ TTS check timeout reached, forcing conversation continuation");
          } else {
            console.log("✅ TTS completed, checking continuous mode");
          }

          // If in continuous mode, restart listening; otherwise go to idle
          if (isContinuousModeRef.current) {
            console.log("🔄 Continuous mode: Scheduling restart of listening after TTS");

            // Longer delay to ensure audio system and STT service are ready
            setTimeout(async () => {
              console.log("🔄 Attempting to restart listening...");
              const restartSuccess = await restartListening();
              if (!restartSuccess) {
                console.warn("⚠️ Failed to restart listening, disabling continuous mode");
                setIsContinuousMode(false);
                setConversationState("idle");
                conversationStateRef.current = "idle";
              }
            }, conversationConfig.restartDelay + 1000); // Extra delay for stability
          } else {
            console.log("✅ Setting conversation state to idle (continuous mode disabled)");
            setConversationState("idle");
            conversationStateRef.current = "idle";
          }
        } else {
          console.log("⏳ TTS still playing, checking again in 500ms");
          setTimeout(checkTTSComplete, 500);
        }
      };
      checkTTSComplete();

      // Backup timeout: Always reset to idle after 15 seconds regardless of TTS state
      setTimeout(() => {
        console.log("🚨 Backup timeout: Forcing conversation state to idle after 15 seconds");
        setConversationState("idle");
        conversationStateRef.current = "idle";
      }, 15000);

      // Additional safety: Reset processing state after timeout
      setTimeout(() => {
        if (isProcessingRef.current) {
          // Use ref for current value
          console.warn("🔧 Force resetting processing state after timeout");
          setIsProcessing(false);
          isProcessingRef.current = false;
          setConversationState("idle");
          conversationStateRef.current = "idle";
        }
      }, 5000); // 5 second safety timeout
    }
  }, [sendUserMessage, stopSpeaking, isPlaying, isProcessing]);

  // Start real-time conversation with optional continuous mode
  const startRealTimeConversation = useCallback(
    async (enableContinuous = false) => {
      if (!sttServiceRef.current || !isAvailable) {
        setError("Speech-to-Text service is not available");
        return false;
      }

      if (isListening) {
        console.warn("Already listening");
        return false;
      }

      console.log("🎤 Starting real-time conversation, continuous mode:", enableContinuous);

      // Set continuous mode
      setIsContinuousMode(enableContinuous);

      // Stop any current TTS playback
      await stopSpeaking();

      setupSTTCallbacks();

      const success = await sttServiceRef.current.startStreaming({
        interimResults: conversationConfig.interimResultsEnabled,
        singleUtterance: false,
      });

      if (!success) {
        setError("Failed to start real-time conversation");
        setIsContinuousMode(false);
      }

      return success;
    },
    [
      isAvailable,
      isListening,
      setupSTTCallbacks,
      stopSpeaking,
      conversationConfig.interimResultsEnabled,
    ],
  );

  // Stop listening
  const stopListening = useCallback(async () => {
    if (sttServiceRef.current) {
      await sttServiceRef.current.stopStreaming();
    }
    cleanupTimers();
  }, []);

  // Manual processing trigger
  const processCurrentTranscript = useCallback(() => {
    if (finalTranscriptRef.current.trim()) {
      handleProcessTranscript();
    }
  }, [handleProcessTranscript]);

  // Clean up timers
  const cleanupTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  }, []);

  // Debug: Force reset processing state
  const forceResetProcessing = useCallback(() => {
    console.log("🔧 Force resetting all processing states");
    setIsProcessing(false);
    setConversationState("idle");
    setError(null);
    finalTranscriptRef.current = "";
    cleanupTimers();

    // Also reset stream restart tracking to avoid interference
    setStreamRestartCount(0);
    setLastRestartTime(null);

    console.log("✅ All processing states reset");
  }, [cleanupTimers]);

  // Stop real-time conversation
  const stopRealTimeConversation = useCallback(async () => {
    console.log("🛑 Manually stopping real-time conversation");

    // Disable continuous mode
    setIsContinuousMode(false);

    await stopListening();
    await stopSpeaking();
    setConversationState("idle");
    conversationStateRef.current = "idle";
    setInterimText("");
    finalTranscriptRef.current = "";
    setError(null);

    console.log("✅ Real-time conversation stopped");
  }, [stopListening, stopSpeaking]);

  // Toggle continuous mode
  const toggleContinuousMode = useCallback(() => {
    const newMode = !isContinuousMode;
    console.log("🔄 Toggling continuous mode:", newMode);
    setIsContinuousMode(newMode);

    if (!newMode && conversationState === "listening") {
      // If disabling continuous mode while listening, stop the conversation
      stopRealTimeConversation();
    }
  }, [isContinuousMode, conversationState, stopRealTimeConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimers();
      if (sttServiceRef.current) {
        sttServiceRef.current.stopStreaming();
      }
    };
  }, [cleanupTimers]);

  // Context value
  const contextValue = {
    // State
    isListening,
    isProcessing,
    interimText,
    error,
    isAvailable,
    conversationState,
    streamRestartCount,
    lastRestartTime,
    isContinuousMode,

    // Actions
    startRealTimeConversation,
    stopRealTimeConversation,
    stopListening,
    processCurrentTranscript,
    toggleContinuousMode,

    // Debug functions
    forceResetProcessing,

    // Status
    isRealTimeActive: conversationState !== "idle",
    canStartConversation: isAvailable && conversationState === "idle",
  };

  return (
    <RealTimeConversationContext.Provider value={contextValue}>
      {children}
    </RealTimeConversationContext.Provider>
  );
};

export default RealTimeConversationProvider;
