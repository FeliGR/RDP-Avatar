import { useEffect, useRef, useState, useCallback } from "react";
import { AnimationService } from "../../babylon-avatar/index.js";

/**
 * React Hook for Avatar Animations
 * Provides clean integration between React components and the animation system
 */
export const useAvatarAnimations = (scene, shadowGenerator = null) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [animationState, setAnimationState] = useState("idle"); // 'idle', 'talking', 'loading'
  const [error, setError] = useState(null);

  const animationServiceRef = useRef(null);

  // Initialize animation service when scene is available
  useEffect(() => {
    console.log(
      "Animation hook effect triggered, scene:",
      !!scene,
      "service:",
      !!animationServiceRef.current
    );
    if (scene && !animationServiceRef.current) {
      console.log("Initializing animation service...");
      animationServiceRef.current = new AnimationService(scene, shadowGenerator);
      setIsInitialized(true);
      console.log("Animation service initialized");
    }

    return () => {
      if (animationServiceRef.current) {
        animationServiceRef.current.dispose();
        animationServiceRef.current = null;
      }
    };
  }, [scene, shadowGenerator]);

  /**
   * Load character with animations from Ready Player Me avatar
   * @param {string} avatarUrl - Ready Player Me avatar URL
   * @param {Object} options - Loading options
   */
  const loadAvatarAnimations = useCallback(async (avatarUrl, options = {}) => {
    if (!animationServiceRef.current) {
      setError("Animation service not initialized");
      return { success: false, error: "Animation service not initialized" };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Default animation paths - usando tus archivos reales
      const defaultAnimations = [
        // Idle animations
        "/animations/masculine/idle/M_Standing_Idle_Variations_001.glb",
        "/animations/masculine/idle/M_Standing_Idle_Variations_002.glb",
        "/animations/masculine/idle/M_Standing_Idle_Variations_003.glb",
        // Talking animations
        "/animations/masculine/expression/M_Talking_Variations_005.glb",
        "/animations/masculine/expression/M_Talking_Variations_006.glb",
        "/animations/masculine/expression/M_Talking_Variations_007.glb",
        // Expression animation
        "/animations/masculine/expression/M_Standing_Expressions_013.glb",
      ];

      const animationPaths = options.animationPaths || defaultAnimations;

      // Load character with animations
      const result = await animationServiceRef.current.loadCharacter(avatarUrl, animationPaths);

      if (result.success) {
        setCurrentCharacter(result.character);
        setAnimationState("idle");

        // Start idle animations automatically
        setTimeout(async () => {
          try {
            const idleResult = await animationServiceRef.current.startIdleAnimations();
            if (idleResult.success) {
              console.log("Idle animations started successfully");

              // Clean up any remaining animation meshes after everything is loaded
              setTimeout(() => {
                _cleanupDuplicateAvatars();
              }, 500); // Reduced delay since duplicates are prevented at source
            } else {
              console.warn("Failed to start idle animations:", idleResult.error);
            }
          } catch (error) {
            console.error("Error starting idle animations:", error);
          }
        }, 100);
      } else {
        setError(result.error || "Failed to load character");
      }

      setIsLoading(false);
      return result;
    } catch (error) {
      console.error("Error loading avatar animations:", error);
      setError(error.message);
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Start idle animations
   */
  const startIdleAnimations = useCallback(async () => {
    if (!animationServiceRef.current || !currentCharacter) {
      return { success: false, error: "Service or character not available" };
    }

    try {
      const result = await animationServiceRef.current.startIdleAnimations();
      if (result.success) {
        setAnimationState("idle");
      }
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, [currentCharacter]);

  /**
   * Start talking animations with optional audio
   * @param {BABYLON.Sound} audioSource - Optional audio for lip-sync
   */
  const startTalkingAnimations = useCallback(
    async (audioSource = null) => {
      if (!animationServiceRef.current || !currentCharacter) {
        return { success: false, error: "Service or character not available" };
      }

      try {
        const result = await animationServiceRef.current.startTalkingAnimations(audioSource);
        if (result.success) {
          setAnimationState("talking");
        }
        return result;
      } catch (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
    },
    [currentCharacter]
  );

  /**
   * Stop talking animations and return to idle
   */
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

  /**
   * Clean up duplicate avatar meshes from the scene
   */
  const _cleanupDuplicateAvatars = useCallback(() => {
    if (!scene) return;

    const meshes = scene.meshes.slice();
    let cleanedCount = 0;

    // Look for meshes that might be duplicates
    meshes.forEach((mesh) => {
      // Check if mesh is hidden, very far away, or scaled down (likely animation mesh)
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
          cleanedCount++;
        } catch (error) {
          // Silently handle cleanup errors
        }
      }
    });
  }, [scene]);

  /**
   * Play a specific animation
   * @param {string} animationName - Name of animation
   * @param {Object} options - Animation options
   */
  const playAnimation = useCallback(
    async (animationName, options = {}) => {
      if (!animationServiceRef.current || !currentCharacter) {
        return { success: false, error: "Service or character not available" };
      }

      try {
        const result = await animationServiceRef.current.playAnimation(animationName, options);
        return result;
      } catch (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
    },
    [currentCharacter]
  );

  /**
   * Set morph target value
   * @param {string} morphName - Morph target name
   * @param {number} value - Target value (0-1)
   * @param {number} duration - Animation duration
   */
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
    [currentCharacter]
  );

  /**
   * Clear any errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isInitialized,
    isLoading,
    currentCharacter,
    animationState,
    error,
    isReady: isInitialized && currentCharacter !== null,

    // Actions
    loadAvatarAnimations,
    startIdleAnimations,
    startTalkingAnimations,
    stopTalkingAnimations,
    playAnimation,
    setMorphTarget,
    clearError,

    // Direct service access (for advanced usage)
    animationService: animationServiceRef.current,
  };
};
