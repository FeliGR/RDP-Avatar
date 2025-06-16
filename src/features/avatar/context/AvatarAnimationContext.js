import React, { createContext, useContext, useRef, useState } from "react";

/**
 * Context for sharing avatar animation controls across the application
 */
const AvatarAnimationContext = createContext();

/**
 * Custom hook for accessing avatar animation context
 * @returns {Object} Avatar animation context values and methods
 */
export const useAvatarAnimation = () => {
  const context = useContext(AvatarAnimationContext);
  if (!context) {
    throw new Error("useAvatarAnimation must be used within an AvatarAnimationProvider");
  }
  return context;
};

/**
 * Custom hook for accessing avatar animation context (alias for compatibility)
 * @returns {Object} Avatar animation context values and methods
 */
export const useAvatarAnimationContext = () => {
  return useAvatarAnimation();
};

/**
 * Provider component for Avatar Animation context
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AvatarAnimationProvider = ({ children }) => {
  const [animationService, setAnimationService] = useState(null);
  const [avatarType, setAvatarType] = useState("masculine"); // Default to masculine
  const [loadedAnimations, setLoadedAnimations] = useState([]);
  const animationCallbacks = useRef(new Set());

  /**
   * Register the animation service instance
   * @param {Object} service - Animation service instance
   */
  const registerAnimationService = (service) => {
    setAnimationService(service);
  };

  /**
   * Set the loaded animations list
   * @param {Array} animations - Array of animation file paths
   */
  const setAnimations = (animations) => {
    setLoadedAnimations(animations);
  };

  /**
   * Set the avatar type for animation selection
   * @param {string} type - 'masculine' or 'feminine'
   */
  const updateAvatarType = (type) => {
    setAvatarType(type);
  };

  /**
   * Register a callback for AI response events
   * @param {Function} callback - Callback function to execute on AI response
   */
  const registerAIResponseCallback = (callback) => {
    animationCallbacks.current.add(callback);
    
    // Return cleanup function
    return () => {
      animationCallbacks.current.delete(callback);
    };
  };

  /**
   * Trigger AI response animation across all registered callbacks
   * @param {Object} options - Animation options
   */
  const triggerAIResponseAnimation = (options = {}) => {
    const animationOptions = {
      avatarType,
      ...options
    };

    // Execute all registered callbacks
    animationCallbacks.current.forEach(callback => {
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
