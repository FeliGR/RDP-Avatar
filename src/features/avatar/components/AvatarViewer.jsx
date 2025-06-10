import React, { useEffect, useRef, useState } from "react";
import { usePersonality } from "../../personality/context/PersonalityContext";
import "./AvatarViewer.css";
import ReadyPlayerMeAvatar from "./ReadyPlayerMeAvatar";

const AvatarViewer = () => {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const { personalityTraits, isLoading: isPersonalityLoading } =
    usePersonality();

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
      };
    }
  }, [hasInteracted]);

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
