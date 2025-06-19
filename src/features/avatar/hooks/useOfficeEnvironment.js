import { useState, useEffect } from "react";

/**
 * Hook to manage office environment
 * Provides functionality to initialize and control the office background
 */
export const useOfficeEnvironment = (animationService) => {
  const [environmentInitialized, setEnvironmentInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initialize the office environment
   */
  const initializeEnvironment = async () => {
    console.log("useOfficeEnvironment: Checking initialization conditions...");
    console.log("useOfficeEnvironment: animationService:", !!animationService);
    console.log("useOfficeEnvironment: environmentInitialized:", environmentInitialized);
    console.log("useOfficeEnvironment: isInitializing:", isInitializing);
    
    if (!animationService || environmentInitialized || isInitializing) {
      return;
    }

    console.log("useOfficeEnvironment: Starting initialization...");
    setIsInitializing(true);
    setError(null);

    try {
      const result = await animationService.initializeOfficeEnvironment();
      console.log("useOfficeEnvironment: Initialization result:", result);
      
      if (result.success) {
        setEnvironmentInitialized(true);
        console.log("useOfficeEnvironment: Environment initialized successfully");
      } else {
        setError(result.error || "Failed to initialize office environment");
        console.error("useOfficeEnvironment: Initialization failed:", result.error);
      }
    } catch (err) {
      console.error("useOfficeEnvironment: Initialization error:", err);
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Start office animations (spheres, etc.)
   */
  const startOfficeAnimations = () => {
    if (!animationService || !environmentInitialized) {
      return { success: false, error: "Environment not initialized" };
    }

    return animationService.startOfficeAnimations();
  };

  /**
   * Play video on office TV
   */
  const playVideo = () => {
    if (!animationService || !environmentInitialized) {
      return { success: false, error: "Environment not initialized" };
    }

    return animationService.playVideo();
  };

  /**
   * Pause video on office TV
   */
  const pauseVideo = () => {
    if (!animationService || !environmentInitialized) {
      return { success: false, error: "Environment not initialized" };
    }

    return animationService.pauseVideo();
  };

  /**
   * Auto-initialize environment when animation service is available
   */
  useEffect(() => {
    if (animationService && !environmentInitialized && !isInitializing) {
      // Small delay to ensure scene is ready
      const timer = setTimeout(() => {
        initializeEnvironment();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [animationService, environmentInitialized, isInitializing]);

  return {
    environmentInitialized,
    isInitializing,
    error,
    initializeEnvironment,
    startOfficeAnimations,
    playVideo,
    pauseVideo,
  };
};
