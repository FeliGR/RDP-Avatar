import { useEffect, useRef, useState, useCallback } from "react";
import { AnimationService } from "../../babylon-avatar/index.js";
import { useAvatarAnimationContext } from "../context/AvatarAnimationContext";
import { getAnimationArrays, ANIMATION_NAMES } from "../../../shared/config/glbAssets";

export const useAvatarAnimations = (scene, shadowGenerator = null) => {
  const { registerAnimationService, setAnimations } = useAvatarAnimationContext();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [animationState, setAnimationState] = useState("idle");
  const [error, setError] = useState(null);
  const animationServiceRef = useRef(null);

  useEffect(() => {
    if (scene && !animationServiceRef.current) {
      animationServiceRef.current = new AnimationService(scene, shadowGenerator);
      setIsInitialized(true);
    }
    return () => {
      if (animationServiceRef.current) {
        animationServiceRef.current.dispose();
        animationServiceRef.current = null;
      }
    };
  }, [scene, shadowGenerator]);

  const _cleanupDuplicateAvatars = useCallback(() => {
    if (!scene) return;
    const meshes = scene.meshes.slice();
    meshes.forEach((mesh) => {
      if (mesh._isOfficeEnvironment) {
        return;
      }
      const hasOfficeEnvironmentChildren =
        mesh.getChildMeshes && mesh.getChildMeshes().some((child) => child._isOfficeEnvironment);
      if (hasOfficeEnvironmentChildren) {
        return;
      }
      const isHidden = !mesh.isVisible || mesh.visibility === 0 || !mesh.isEnabled();
      const isFarAway =
        mesh.position &&
        (Math.abs(mesh.position.x) > 50000 ||
          Math.abs(mesh.position.y) > 50000 ||
          Math.abs(mesh.position.z) > 50000);
      const isScaledDown =
        mesh.scaling && (mesh.scaling.x < 0.01 || mesh.scaling.y < 0.01 || mesh.scaling.z < 0.01);
      if ((isHidden && isFarAway) || isScaledDown) {
        try {
          if (mesh.material) {
            mesh.material.dispose();
          }
          mesh.dispose();
        } catch (error) {}
      }
    });
  }, [scene]);

  const startSpecificIdleAnimation = useCallback(
    async (animationName = ANIMATION_NAMES.DEFAULT_FEMININE_IDLE, options = {}) => {
      if (!animationServiceRef.current) {
        console.warn("[Avatar Animations] Animation service not available");
        return { success: false, error: "Animation service not available" };
      }
      if (!animationServiceRef.current.isReady()) {
        console.warn("[Avatar Animations] Animation service not ready");
        return { success: false, error: "Animation service not ready" };
      }
      const character = animationServiceRef.current.getCurrentCharacter();
      if (!character) {
        console.warn("[Avatar Animations] Character not available");
        return { success: false, error: "Character not available" };
      }
      try {
        const transitionDuration = options.transitionDuration || 0.8;
        console.log(
          `[Avatar Animations] Starting idle animation: ${animationName} with transition duration: ${transitionDuration}`,
        );

        // Check if we're already in an idle state to prevent conflicts
        if (animationState === "idle" && !options.force) {
          console.log(
            `[Avatar Animations] Already in idle state, skipping duplicate idle animation: ${animationName}`,
          );
          return { success: true, message: "Already in idle state" };
        }

        const result = await animationServiceRef.current.playAnimationWithTransition(
          animationName,
          {
            isLooping: true,
            speedRatio: 1.0,
            transitionDuration,
            maxWeight: 1.0,
            ...options,
          },
        );
        if (result.success) {
          setAnimationState("idle");
          console.log(`[Avatar Animations] Successfully started idle animation: ${animationName}`);
        } else {
          console.error(`[Avatar Animations] Failed to start idle animation: ${result.error}`);
        }
        return result;
      } catch (error) {
        console.error(`[Avatar Animations] Error starting idle animation:`, error);
        setError(error.message);
        return { success: false, error: error.message };
      }
    },
    [],
  );

  const loadAvatarAnimations = useCallback(
    async (avatarUrl, options = {}) => {
      if (!animationServiceRef.current) {
        setError("Animation service not initialized");
        return { success: false, error: "Animation service not initialized" };
      }
      setIsLoading(true);
      setError(null);
      try {
        const { DEFAULT_ANIMATIONS } = getAnimationArrays();
        const animationPaths = options.animationPaths || DEFAULT_ANIMATIONS;
        const result = await animationServiceRef.current.loadCharacter(avatarUrl, animationPaths);
        if (result.success) {
          setCurrentCharacter(result.character);
          setAnimationState("idle");
          registerAnimationService(animationServiceRef.current);
          setAnimations(animationPaths);
          setTimeout(async () => {
            try {
              // Use the idle animation use case for proper setup
              const idleResult = await animationServiceRef.current.startIdleAnimations();
              if (idleResult.success) {
                setAnimationState("idle");
                setTimeout(() => {
                  _cleanupDuplicateAvatars();
                }, 300);
              } else {
                console.warn(
                  "[Avatar Animations] Failed to start idle animations:",
                  idleResult.error,
                );
              }
            } catch (error) {
              console.error("[Avatar Animations] Error starting idle animations:", error);
            }
          }, 50);
        } else {
          setError(result.error || "Failed to load character");
        }
        setIsLoading(false);
        return result;
      } catch (error) {
        setError(error.message);
        setIsLoading(false);
        return { success: false, error: error.message };
      }
    },
    [_cleanupDuplicateAvatars, registerAnimationService, setAnimations],
  );

  const startIdleAnimations = useCallback(async () => {
    return await startSpecificIdleAnimation();
  }, [startSpecificIdleAnimation]);

  const startTalkingAnimations = useCallback(
    async (audioSource = null) => {
      if (!animationServiceRef.current || !currentCharacter) {
        console.warn("[Avatar Animations] Service or character not available for talking");
        return { success: false, error: "Service or character not available" };
      }
      try {
        console.log(
          "[Avatar Animations] Starting talking animations",
          audioSource ? "with audio source" : "without audio source",
        );
        const result = await animationServiceRef.current.startTalkingAnimations(audioSource);
        if (result.success) {
          setAnimationState("talking");
          console.log("[Avatar Animations] Successfully started talking animations");
        } else {
          console.error("[Avatar Animations] Failed to start talking animations:", result.error);
        }
        return result;
      } catch (error) {
        console.error("[Avatar Animations] Error starting talking animations:", error);
        setError(error.message);
        return { success: false, error: error.message };
      }
    },
    [currentCharacter],
  );

  const stopTalkingAnimations = useCallback(async () => {
    if (!animationServiceRef.current || !currentCharacter) {
      return { success: false, error: "Service or character not available" };
    }
    try {
      const result = await animationServiceRef.current.stopTalkingAnimations();
      if (result.success) {
        setAnimationState("idle");
      }
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, [currentCharacter]);

  const playAnimation = useCallback(
    async (animationName, options = {}) => {
      if (!animationServiceRef.current || !currentCharacter) {
        return { success: false, error: "Service or character not available" };
      }
      try {
        const result = await animationServiceRef.current.playAnimationWithTransition(
          animationName,
          {
            transitionDuration: 0.3,
            ...options,
          },
        );
        return result;
      } catch (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
    },
    [currentCharacter],
  );

  const setMorphTarget = useCallback(
    (morphName, value, duration = 0) => {
      if (!animationServiceRef.current || !currentCharacter) {
        return { success: false, error: "Service or character not available" };
      }
      try {
        const result = animationServiceRef.current.setMorphTarget(morphName, value, duration);
        return result;
      } catch (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
    },
    [currentCharacter],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const playMessageResponseAnimation = useCallback(
    async (options = {}) => {
      if (!animationServiceRef.current) {
        console.warn("[Avatar Animations] Animation service not available for message response");
        return { success: false, error: "Animation service not available" };
      }

      // Check if the animation service is ready (has character loaded)
      if (!animationServiceRef.current.isReady()) {
        console.warn("[Avatar Animations] Animation service not ready for message response");
        return { success: false, error: "Animation service not ready" };
      }

      try {
        console.log("[Avatar Animations] Playing message response animation");
        const result = await animationServiceRef.current.playMessageResponseAnimation(options);
        if (result.success) {
          setAnimationState("talking");
          console.log(
            `[Avatar Animations] Successfully played message response animation: ${result.animation}`,
          );
        } else {
          console.error(
            "[Avatar Animations] Failed to play message response animation:",
            result.error,
          );
        }
        return result;
      } catch (error) {
        console.error("[Avatar Animations] Error playing message response animation:", error);
        setError(error.message);
        return { success: false, error: error.message };
      }
    },
    [], // Remove currentCharacter dependency as we check service readiness instead
  );

  return {
    isInitialized,
    isLoading,
    currentCharacter,
    animationState,
    error,
    isReady: isInitialized && currentCharacter !== null,
    loadAvatarAnimations,
    startIdleAnimations,
    startSpecificIdleAnimation,
    startTalkingAnimations,
    stopTalkingAnimations,
    playAnimation,
    setMorphTarget,
    clearError,
    animationService: animationServiceRef.current,
    playMessageResponseAnimation,
  };
};
