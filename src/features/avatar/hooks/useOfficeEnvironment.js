import { useState, useEffect } from "react";

export const useOfficeEnvironment = (animationService) => {
  const [environmentInitialized, setEnvironmentInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);

  const initializeEnvironment = async () => {
    if (!animationService || environmentInitialized || isInitializing) {
      return;
    }
    setIsInitializing(true);
    setError(null);
    try {
      const result = await animationService.initializeOfficeEnvironment();
      if (result.success) {
        setEnvironmentInitialized(true);
      } else {
        setError(result.error || "Failed to initialize office environment");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  const startOfficeAnimations = () => {
    if (!animationService || !environmentInitialized) {
      return { success: false, error: "Environment not initialized" };
    }
    return animationService.startOfficeAnimations();
  };

  const playVideo = () => {
    if (!animationService || !environmentInitialized) {
      return { success: false, error: "Environment not initialized" };
    }
    return animationService.playVideo();
  };

  const pauseVideo = () => {
    if (!animationService || !environmentInitialized) {
      return { success: false, error: "Environment not initialized" };
    }
    return animationService.pauseVideo();
  };

  useEffect(() => {
    if (animationService && !environmentInitialized && !isInitializing) {
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
