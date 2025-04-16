import React, { useEffect, useRef, useState } from "react";
import { usePersonality } from "../../context/PersonalityContext";
import {
  disposeScene,
  initScene,
  loadAvatarModel,
  resetCameraPosition,
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
  const previousTraitsRef = useRef({});

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
