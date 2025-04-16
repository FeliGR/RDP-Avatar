import React, { useEffect, useRef, useState } from "react";
import { TYPING_EVENTS } from "../../components/DialogBox/DialogBox";
import { useDialog } from "../../context/DialogContext";
import { usePersonality } from "../../context/PersonalityContext";
import {
  AVATAR_STATES,
  detectSentiment,
  disposeScene,
  initScene,
  loadAvatarModel,
  resetCameraPosition,
  setAvatarState,
  updateAvatarBasedOnPersonality,
  updateSingleTrait,
} from "../../features/babylon/avatarScene";
import "./AvatarViewer.css";

const AvatarViewer = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const avatarRef = useRef(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [initialTraitsSet, setInitialTraitsSet] = useState(false);
  const { personalityTraits, isLoading } = usePersonality();
  const { messages, isLoading: isMessageLoading } = useDialog();
  const previousTraitsRef = useRef({});
  const previousMessagesLengthRef = useRef(0);
  const typingTimeoutRef = useRef(null);

  // Initialize Babylon.js scene
  useEffect(() => {
    if (canvasRef.current) {
      const { scene, engine } = initScene(canvasRef.current);
      sceneRef.current = { scene, engine };

      // Load the avatar model
      const loadAvatar = async () => {
        try {
          const avatar = await loadAvatarModel(scene);
          avatarRef.current = avatar;

          // Update avatar based on initial personality traits
          updateAvatarBasedOnPersonality(avatar, personalityTraits);
          setInitialTraitsSet(true);
          previousTraitsRef.current = { ...personalityTraits };
        } catch (error) {
          console.error("Failed to load avatar:", error);
        }
      };

      loadAvatar();

      // Add interaction listeners for tooltip
      const canvas = canvasRef.current;
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

      canvas.addEventListener("pointerdown", handleInteraction);
      canvas.addEventListener("wheel", handleInteraction);

      // Cleanup on component unmount
      return () => {
        if (sceneRef.current) {
          const { engine, scene } = sceneRef.current;
          disposeScene(engine, scene);
        }

        canvas.removeEventListener("pointerdown", handleInteraction);
        canvas.removeEventListener("wheel", handleInteraction);
        clearTimeout(interactionTimeout);
        
        // Clear any pending animation timeouts
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, []);

  // Handle personality trait changes
  useEffect(() => {
    if (avatarRef.current && initialTraitsSet) {
      // For each trait change, use updateSingleTrait to avoid styling changes
      for (const [trait, value] of Object.entries(personalityTraits)) {
        if (previousTraitsRef.current[trait] !== value) {
          updateSingleTrait(avatarRef.current, trait, value);
        }
      }

      // Update our reference to the current traits
      previousTraitsRef.current = { ...personalityTraits };
    }
  }, [personalityTraits, initialTraitsSet]);

  // Handle chat message changes to trigger avatar animations
  useEffect(() => {
    if (!avatarRef.current || !initialTraitsSet) return;

    // Check if new message was added
    if (messages.length > previousMessagesLengthRef.current) {
      // Get the latest message
      const latestMessage = messages[messages.length - 1];
      
      if (latestMessage.sender === 'bot') {
        // Bot is speaking - animate avatar with appropriate sentiment
        const sentiment = detectSentiment(latestMessage.text);
        setAvatarState(avatarRef.current, AVATAR_STATES.SPEAKING, sentiment);
        
        // Calculate speaking duration based on message length (100ms per character, min 1s, max 10s)
        const speakingDuration = Math.min(Math.max(latestMessage.text.length * 100, 1000), 10000);
        
        // Return to idle after speaking
        typingTimeoutRef.current = setTimeout(() => {
          setAvatarState(avatarRef.current, AVATAR_STATES.IDLE);
        }, speakingDuration);
      } else {
        // User sent a message - avatar should return to idle
        // This could happen when transitioning from listening to idle
        setAvatarState(avatarRef.current, AVATAR_STATES.IDLE);
      }
      
      // Update ref to current message count
      previousMessagesLengthRef.current = messages.length;
    }
  }, [messages, initialTraitsSet]);

  // Handle message loading state to show "listening" animation
  useEffect(() => {
    if (!avatarRef.current || !initialTraitsSet) return;
    
    if (isMessageLoading) {
      // When waiting for bot response, show listening state
      setAvatarState(avatarRef.current, AVATAR_STATES.LISTENING);
    }
  }, [isMessageLoading, initialTraitsSet]);

  // Listen for custom typing events from DialogBox
  useEffect(() => {
    if (!avatarRef.current || !initialTraitsSet) return;
    
    const handleTypingStart = () => {
      setAvatarState(avatarRef.current, AVATAR_STATES.LISTENING);
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
    
    const handleTypingStop = () => {
      // Return to idle state
      setAvatarState(avatarRef.current, AVATAR_STATES.IDLE);
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
  }, [initialTraitsSet]);

  // Handle reset camera button
  const handleResetCamera = () => {
    if (sceneRef.current) {
      resetCameraPosition(sceneRef.current.scene);
    }
  };

  return (
    <div className="avatar-viewer">
      <div className="avatar-canvas-container">
        {isLoading && <div className="avatar-loading">Updating avatar...</div>}
        <canvas ref={canvasRef} className="avatar-canvas" />

        {/* Replace static instructions with tooltip */}
        <div className={`avatar-tooltip ${tooltipVisible ? "visible" : ""}`}>
          <p>Drag to rotate • Scroll to zoom</p>
        </div>

        {/* Reset camera button */}
        <button className="reset-camera-button" onClick={handleResetCamera}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5V2L8 6l4 4V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
          Reset Camera
        </button>
      </div>
    </div>
  );
};

export default AvatarViewer;
