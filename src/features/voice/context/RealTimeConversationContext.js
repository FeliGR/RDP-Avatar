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
  const [conversationState, setConversationState] = useState("idle");
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
  const { stopSpeaking, isPlaying } = useTTS();

  const conversationConfig = {
    silenceThreshold: 2000,
    maxSpeechDuration: 30000,
    interimResultsEnabled: true,
    autoProcessing: true,
    restartDelay: 1000,
  };

  useEffect(() => {
    const initSTT = async () => {
      try {
        sttServiceRef.current = new STTService();
        const available = await sttServiceRef.current.checkAvailability();
        setIsAvailable(available);

        if (!available) {
          setError("Speech-to-Text service is not available");
        }
      } catch (error) {
        setError(error.message);
        setIsAvailable(false);
      }
    };

    initSTT();
  }, []);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  useEffect(() => {
    isContinuousModeRef.current = isContinuousMode;
  }, [isContinuousMode]);

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

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        if (conversationConfig.autoProcessing) {
          silenceTimerRef.current = setTimeout(() => {
            if (finalTranscriptRef.current.trim()) {
              handleProcessTranscript();
            }
          }, conversationConfig.silenceThreshold);
        }
      },

      onFinalResult: (transcript, confidence, metadata = {}) => {
        finalTranscriptRef.current = transcript;
        setInterimText("");

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        if (conversationConfig.autoProcessing && confidence > 0.15) {
          handleProcessTranscript();
        }
      },

      onError: (errorMessage) => {
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
        setStreamRestartCount(restartCount);
        setLastRestartTime(Date.now());

        if (conversationState === "processing" || isProcessing) {
          setIsProcessing(false);
          isProcessingRef.current = false;

          if (isContinuousMode && !isPlaying) {
            setConversationState("listening");
            conversationStateRef.current = "listening";
          } else if (!isPlaying) {
            setConversationState("idle");
            conversationStateRef.current = "idle";
          }
        }
      },

      onAudioBridging: () => {},
    });
  }, [
    conversationState,
    conversationConfig.autoProcessing,
    conversationConfig.silenceThreshold,
    cleanupTimers,
    isContinuousMode,
    isPlaying,
    isProcessing,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // handleProcessTranscript creates circular dependency, using refs instead
  ]);

  const handleProcessTranscript = useCallback(async () => {
    const transcript = finalTranscriptRef.current.trim();

    if (!transcript) {
      return;
    }

    if (isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      isProcessingRef.current = true;
      setConversationState("processing");
      conversationStateRef.current = "processing";
      setInterimText("");

      if (lastRestartTime && Date.now() - lastRestartTime < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await stopListening();

      await stopSpeaking();

      processingTimeoutRef.current = setTimeout(() => {
        setIsProcessing(false);
        setConversationState("idle");
        setError("Response timeout - please try again");
      }, 15000);

      setConversationState("responding");

      await sendUserMessage(transcript);

      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }

      finalTranscriptRef.current = "";
    } catch (error) {
      setError("Failed to process your message. Please try again.");
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;

      let ttsCheckCount = 0;
      const maxTtsChecks = 30;

      const checkTTSComplete = () => {
        ttsCheckCount++;

        if (!isPlaying || ttsCheckCount >= maxTtsChecks) {
          if (isContinuousModeRef.current) {
            setTimeout(async () => {
              const restartSuccess = await restartListening();
              if (!restartSuccess) {
                setIsContinuousMode(false);
                setConversationState("idle");
                conversationStateRef.current = "idle";
              }
            }, conversationConfig.restartDelay + 1000);
          } else {
            setConversationState("idle");
            conversationStateRef.current = "idle";
          }
        } else {
          setTimeout(checkTTSComplete, 500);
        }
      };
      checkTTSComplete();

      setTimeout(() => {
        setConversationState("idle");
        conversationStateRef.current = "idle";
      }, 15000);

      setTimeout(() => {
        if (isProcessingRef.current) {
          setIsProcessing(false);
          isProcessingRef.current = false;
          setConversationState("idle");
          conversationStateRef.current = "idle";
        }
      }, 5000);
    }
  }, [
    sendUserMessage,
    stopSpeaking,
    isPlaying,
    isProcessing,
    lastRestartTime,
    conversationConfig.restartDelay,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // stopListening and restartListening create circular dependencies, using refs instead
  ]);

  const restartListening = useCallback(async () => {
    if (!isContinuousModeRef.current || isProcessingRef.current) {
      return false;
    }

    try {
      if (!sttServiceRef.current) {
        return false;
      }

      const available = await sttServiceRef.current.checkAvailability();
      if (!available) {
        setIsAvailable(false);
        return false;
      }

      setIsAvailable(true);

      setConversationState("listening");
      conversationStateRef.current = "listening";

      setupSTTCallbacks();

      const success = await sttServiceRef.current.startStreaming({
        interimResults: conversationConfig.interimResultsEnabled,
        singleUtterance: false,
      });

      if (!success) {
        setConversationState("idle");
        conversationStateRef.current = "idle";
      }

      return success;
    } catch (error) {
      setConversationState("idle");
      conversationStateRef.current = "idle";
      setIsAvailable(false);
      return false;
    }
  }, [setupSTTCallbacks, conversationConfig.interimResultsEnabled]);

  const stopListening = useCallback(async () => {
    if (sttServiceRef.current) {
      await sttServiceRef.current.stopStreaming();
    }
    cleanupTimers();
  }, [cleanupTimers]);

  const startRealTimeConversation = useCallback(
    async (enableContinuous = false) => {
      if (!sttServiceRef.current || !isAvailable) {
        setError("Speech-to-Text service is not available");
        return false;
      }

      if (isListening) {
        return false;
      }

      setIsContinuousMode(enableContinuous);

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

  const processCurrentTranscript = useCallback(() => {
    if (finalTranscriptRef.current.trim()) {
      handleProcessTranscript();
    }
  }, [handleProcessTranscript]);

  const forceResetProcessing = useCallback(() => {
    setIsProcessing(false);
    setConversationState("idle");
    setError(null);
    finalTranscriptRef.current = "";
    cleanupTimers();

    setStreamRestartCount(0);
    setLastRestartTime(null);
  }, [cleanupTimers]);

  const stopRealTimeConversation = useCallback(async () => {
    setIsContinuousMode(false);

    await stopListening();
    await stopSpeaking();
    setConversationState("idle");
    conversationStateRef.current = "idle";
    setInterimText("");
    finalTranscriptRef.current = "";
    setError(null);
  }, [stopListening, stopSpeaking]);

  const toggleContinuousMode = useCallback(() => {
    const newMode = !isContinuousMode;
    setIsContinuousMode(newMode);

    if (!newMode && conversationState === "listening") {
      stopRealTimeConversation();
    }
  }, [isContinuousMode, conversationState, stopRealTimeConversation]);

  useEffect(() => {
    return () => {
      cleanupTimers();
      if (sttServiceRef.current) {
        sttServiceRef.current.stopStreaming();
      }
    };
  }, [cleanupTimers]);

  const contextValue = {
    isListening,
    isProcessing,
    interimText,
    error,
    isAvailable,
    conversationState,
    streamRestartCount,
    lastRestartTime,
    isContinuousMode,

    startRealTimeConversation,
    stopRealTimeConversation,
    stopListening,
    processCurrentTranscript,
    toggleContinuousMode,

    forceResetProcessing,

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
