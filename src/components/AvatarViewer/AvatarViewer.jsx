import React, { useEffect, useRef, useState } from "react";
import { TYPING_EVENTS } from "../../components/DialogBox/DialogBox";
import { useDialog } from "../../context/DialogContext";
import { usePersonality } from "../../context/PersonalityContext";
import {
    AVATAR_STATES,
    SENTIMENTS,
    detectSentiment,
} from "../../features/babylon/avatarScene";
import ReadyPlayerMeAvatar from "../ReadyPlayerMeAvatar/ReadyPlayerMeAvatar";
import "./AvatarViewer.css";

const AvatarViewer = () => {
  const canvasRef = useRef(null);
  const [currentState, setCurrentState] = useState(AVATAR_STATES.IDLE);
  const [currentSentiment, setCurrentSentiment] = useState(SENTIMENTS.NEUTRAL);
  const [isLoading, setIsLoading] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const { personalityTraits, isLoading: isPersonalityLoading } = usePersonality();
  const { messages, isLoading: isMessageLoading } = useDialog();
  
  const previousMessagesLengthRef = useRef(0);
  const typingTimeoutRef = useRef(null);

  // Handle interaction for tooltip
  useEffect(() => {
    if (canvasRef.current) {
      let interactionTimeout;

      const handleInteraction = () => {
        if (!hasInteracted) {
          setHasInteracted(true);
          setTooltipVisible(true);

          // Hide tooltip after 5 seconds
          interactionTimeout = setTimeout(() => {
            setTooltipVisible(false);
          }, 5000);
        }
      };

      const canvas = canvasRef.current;
      canvas.addEventListener("pointerdown", handleInteraction);
      canvas.addEventListener("wheel", handleInteraction);

      return () => {
        canvas.removeEventListener("pointerdown", handleInteraction);
        canvas.removeEventListener("wheel", handleInteraction);
        clearTimeout(interactionTimeout);
        
        // Clear any pending animation timeouts
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [hasInteracted]);

  // Handle chat message changes to trigger avatar animations
  useEffect(() => {
    // Check if new message was added
    if (messages.length > previousMessagesLengthRef.current) {
      // Get the latest message
      const latestMessage = messages[messages.length - 1];
      
      if (latestMessage.sender === 'bot') {
        // Bot is speaking - animate avatar with appropriate sentiment
        const sentiment = detectSentiment(latestMessage.text);
        setCurrentState(AVATAR_STATES.SPEAKING);
        setCurrentSentiment(sentiment);
        
        // Calculate speaking duration based on message length (100ms per character, min 1s, max 10s)
        const speakingDuration = Math.min(Math.max(latestMessage.text.length * 100, 1000), 10000);
        
        // Return to idle after speaking
        typingTimeoutRef.current = setTimeout(() => {
          setCurrentState(AVATAR_STATES.IDLE);
          setCurrentSentiment(SENTIMENTS.NEUTRAL);
        }, speakingDuration);
      } else {
        // User sent a message - avatar should return to idle
        setCurrentState(AVATAR_STATES.IDLE);
        setCurrentSentiment(SENTIMENTS.NEUTRAL);
      }
      
      // Update ref to current message count
      previousMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  // Handle message loading state to show "listening" animation
  useEffect(() => {
    if (isMessageLoading) {
      // When waiting for bot response, show listening state
      setCurrentState(AVATAR_STATES.LISTENING);
    }
  }, [isMessageLoading]);

  // Listen for custom typing events from DialogBox
  useEffect(() => {
    const handleTypingStart = () => {
      setCurrentState(AVATAR_STATES.LISTENING);
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
    
    const handleTypingStop = () => {
      // Return to idle state
      setCurrentState(AVATAR_STATES.IDLE);
      setCurrentSentiment(SENTIMENTS.NEUTRAL);
    };
    
    // Add event listeners for custom typing events
    document.addEventListener(TYPING_EVENTS.START, handleTypingStart);
    document.addEventListener(TYPING_EVENTS.STOP, handleTypingStop);
    
    // Cleanup listeners
    return () => {
      document.removeEventListener(TYPING_EVENTS.START, handleTypingStart);
      document.removeEventListener(TYPING_EVENTS.STOP, handleTypingStop);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Track when the avatar is loaded
  const handleAvatarLoaded = (avatar) => {
    setIsLoading(false);
  };

  return (
    <div className="avatar-viewer">
      <div className="avatar-canvas-container">
        <canvas ref={canvasRef} className="avatar-canvas" />
        
        <ReadyPlayerMeAvatar
          canvasRef={canvasRef}
          onAvatarLoaded={handleAvatarLoaded}
          avatarState={currentState}
          sentiment={currentSentiment}
          personalityTraits={personalityTraits}
        />

        {/* Tooltip for interaction instructions */}
        <div className={`avatar-tooltip ${tooltipVisible ? "visible" : ""}`}>
          <p>Drag to rotate • Scroll to zoom</p>
        </div>
      </div>
    </div>
  );
};

export default AvatarViewer;
