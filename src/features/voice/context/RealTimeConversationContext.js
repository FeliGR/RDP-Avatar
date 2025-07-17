import React, { 
  createContext, 
  useContext, 
  useCallback, 
  useState, 
  useRef, 
  useEffect 
} from "react";
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
  
  const sttServiceRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const silenceTimerRef = useRef(null);
  const processingTimeoutRef = useRef(null);
  
  const { sendUserMessage } = useDialog();
  const { speak, stopSpeaking, isPlaying } = useTTS();

  // Configuration for real-time conversation
  const conversationConfig = {
    silenceThreshold: 2000, // 2 seconds of silence before processing
    maxSpeechDuration: 30000, // 30 seconds max per utterance
    interimResultsEnabled: true,
    autoProcessing: true,
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

      onFinalResult: (transcript, confidence) => {
        console.log("Final STT result:", transcript, "Confidence:", confidence);
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
      }
    });
  }, [conversationState, conversationConfig.autoProcessing, conversationConfig.silenceThreshold]);

  // Process the final transcript and send to dialog orchestrator
  const handleProcessTranscript = useCallback(async () => {
    const transcript = finalTranscriptRef.current.trim();
    
    console.log("🔄 Processing transcript:", transcript);
    
    if (!transcript) {
      console.warn("No transcript to process");
      return;
    }

    if (isProcessing) {
      console.warn("Already processing a transcript");
      return;
    }

    try {
      setIsProcessing(true);
      setConversationState("processing");
      setInterimText("");

      // Stop any current listening
      await stopListening();

      // Stop any current TTS playback
      await stopSpeaking();

      console.log("Processing transcript:", transcript);

      // Set processing timeout
      processingTimeoutRef.current = setTimeout(() => {
        console.warn("Processing timeout reached");
        setIsProcessing(false);
        setConversationState("idle");
        setError("Response timeout - please try again");
      }, 30000); // 30 second timeout

      // Send message to dialog orchestrator
      setConversationState("responding");
      console.log("📤 Sending to dialog orchestrator:", transcript);
      const botResponse = await sendUserMessage(transcript);
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
      console.error("Error processing transcript:", error);
      setError("Failed to process your message. Please try again.");
    } finally {
      setIsProcessing(false);
      
      // Wait for TTS to finish before allowing new input
      const checkTTSComplete = () => {
        if (!isPlaying) {
          setConversationState("idle");
        } else {
          setTimeout(checkTTSComplete, 500);
        }
      };
      checkTTSComplete();
    }
  }, [sendUserMessage, stopSpeaking, isPlaying, isProcessing]);

  // Start real-time conversation
  const startRealTimeConversation = useCallback(async () => {
    if (!sttServiceRef.current || !isAvailable) {
      setError("Speech-to-Text service is not available");
      return false;
    }

    if (isListening) {
      console.warn("Already listening");
      return false;
    }

    // Stop any current TTS playback
    await stopSpeaking();

    setupSTTCallbacks();

    const success = await sttServiceRef.current.startStreaming({
      interimResults: conversationConfig.interimResultsEnabled,
      singleUtterance: false,
    });

    if (!success) {
      setError("Failed to start real-time conversation");
    }

    return success;
  }, [isAvailable, isListening, setupSTTCallbacks, stopSpeaking, conversationConfig.interimResultsEnabled]);

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

  // Stop real-time conversation
  const stopRealTimeConversation = useCallback(async () => {
    await stopListening();
    await stopSpeaking();
    setConversationState("idle");
    setInterimText("");
    finalTranscriptRef.current = "";
    setError(null);
  }, [stopListening, stopSpeaking]);

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
    
    // Actions
    startRealTimeConversation,
    stopRealTimeConversation,
    stopListening,
    processCurrentTranscript,
    
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
