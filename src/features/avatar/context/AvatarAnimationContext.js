import React, { createContext, useContext, useRef, useState } from "react";

const AvatarAnimationContext = createContext();

export const useAvatarAnimation = () => {
  const context = useContext(AvatarAnimationContext);
  if (!context) {
    throw new Error("useAvatarAnimation must be used within an AvatarAnimationProvider");
  }
  return context;
};

export const useAvatarAnimationContext = () => {
  return useAvatarAnimation();
};

export const AvatarAnimationProvider = ({ children }) => {
  const [animationService, setAnimationService] = useState(null);
  const [avatarType, setAvatarType] = useState("masculine");
  const [loadedAnimations, setLoadedAnimations] = useState([]);
  const animationCallbacks = useRef(new Set());

  const registerAnimationService = (service) => {
    setAnimationService(service);
  };

  const setAnimations = (animations) => {
    setLoadedAnimations(animations);
  };

  const updateAvatarType = (type) => {
    setAvatarType(type);
  };

  const registerAIResponseCallback = (callback) => {
    animationCallbacks.current.add(callback);
    return () => {
      animationCallbacks.current.delete(callback);
    };
  };

  const triggerAIResponseAnimation = (options = {}) => {
    const animationOptions = {
      avatarType,
      ...options,
    };
    animationCallbacks.current.forEach((callback) => {
      try {
        callback(animationOptions);
      } catch (error) {
        console.error("Error executing AI response animation callback:", error);
      }
    });
  };

  const contextValue = {
    animationService,
    avatarType,
    loadedAnimations,
    registerAnimationService,
    setAnimations,
    updateAvatarType,
    registerAIResponseCallback,
    triggerAIResponseAnimation,
  };

  return (
    <AvatarAnimationContext.Provider value={contextValue}>
      {children}
    </AvatarAnimationContext.Provider>
  );
};
