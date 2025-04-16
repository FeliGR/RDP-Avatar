import React, { useEffect, useRef } from 'react';
import { disposeScene, initScene, loadAvatarModel, updateAvatarBasedOnPersonality } from '../babylon/avatarScene';
import { usePersonality } from '../context/PersonalityContext';
import './AvatarViewer.css';

const AvatarViewer = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const avatarRef = useRef(null);
  const { personalityTraits, isLoading } = usePersonality();

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
        } catch (error) {
          console.error('Failed to load avatar:', error);
        }
      };

      loadAvatar();

      // Cleanup on component unmount
      return () => {
        if (sceneRef.current) {
          const { engine, scene } = sceneRef.current;
          disposeScene(engine, scene);
        }
      };
    }
  }, []);

  // Update avatar when personality traits change
  useEffect(() => {
    if (avatarRef.current) {
      updateAvatarBasedOnPersonality(avatarRef.current, personalityTraits);
    }
  }, [personalityTraits]);

  return (
    <div className="avatar-viewer">
      <div className="avatar-viewer-header">
        <h2>AR Avatar</h2>
      </div>
      <div className="avatar-canvas-container">
        {isLoading && <div className="avatar-loading">Updating avatar...</div>}
        <canvas ref={canvasRef} className="avatar-canvas" />
        <div className="avatar-instructions">
          <p>Drag to rotate • Scroll to zoom</p>
        </div>
      </div>
    </div>
  );
};

export default AvatarViewer;