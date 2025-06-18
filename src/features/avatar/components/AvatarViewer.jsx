import React, { useEffect, useRef, useState } from "react";
import { usePersonality } from "../../personality/context/PersonalityContext";
import "./AvatarViewer.css";
import ReadyPlayerMeAvatar from "./ReadyPlayerMeAvatar";

const AvatarViewer = ({ fullscreen = false }) => {
  const canvasRef = useRef(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const { personalityTraits } = usePersonality();

  useEffect(() => {
    if (canvasRef.current) {
      let interactionTimeout;

      const handleInteraction = () => {
        if (!hasInteracted) {
          setHasInteracted(true);
          setTooltipVisible(true);

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

  return (
    <div className={`avatar-viewer ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="avatar-canvas-container">
        <canvas ref={canvasRef} className="avatar-canvas" />

        <ReadyPlayerMeAvatar 
          canvasRef={canvasRef} 
          personalityTraits={personalityTraits} 
          fullscreen={fullscreen}
        />

        {/* Tooltip for interaction instructions - only show in non-fullscreen mode */}
        {!fullscreen && (
          <div className={`avatar-tooltip ${tooltipVisible ? "visible" : ""}`}>
            <p>Drag to rotate • Scroll to zoom</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarViewer;
