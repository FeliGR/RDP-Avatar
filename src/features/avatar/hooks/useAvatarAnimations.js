import { useEffect, useRef, useState, useCallback } from "react";
import { AnimationService } from "../../babylon-avatar/index.js";
import { useAvatarAnimationContext } from "../context/AvatarAnimationContext";

/**
 * React Hook for Avatar Animations
 * Provides clean integration between React components and the animation system
 */
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

  /**
   * Clean up duplicate avatar meshes from the scene
   */
  const _cleanupDuplicateAvatars = useCallback(() => {
    if (!scene) return;

    console.log("[useAvatarAnimations] Starting _cleanupDuplicateAvatars");
    const meshes = scene.meshes.slice();
    console.log(`[useAvatarAnimations] Total meshes in scene: ${meshes.length}`);

    let skippedCount = 0;
    let disposedCount = 0;

    meshes.forEach((mesh) => {
      // Skip office environment meshes
      if (mesh._isOfficeEnvironment) {
        console.log(`[useAvatarAnimations] Skipping office environment mesh: ${mesh.name}`);
        skippedCount++;
        return;
      }

      // Check if any child meshes are office environment meshes
      const hasOfficeEnvironmentChildren = mesh.getChildMeshes && 
        mesh.getChildMeshes().some(child => child._isOfficeEnvironment);
      
      if (hasOfficeEnvironmentChildren) {
        console.log(`[useAvatarAnimations] Skipping mesh with office environment children: ${mesh.name}`);
        skippedCount++;
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
        console.log(`[useAvatarAnimations] Disposing mesh: ${mesh.name} (hidden: ${isHidden}, farAway: ${isFarAway}, scaledDown: ${isScaledDown})`);
        try {
          if (mesh.material) {
            mesh.material.dispose();
          }
          mesh.dispose();
          disposedCount++;
        } catch (error) {
          console.error(`[useAvatarAnimations] Error disposing mesh ${mesh.name}:`, error);
        }
      }
    });

    console.log(`[useAvatarAnimations] Cleanup complete - Skipped: ${skippedCount}, Disposed: ${disposedCount}`);
  }, [scene]);

  /**
   * Start specific idle animation with smooth transition
   */
  const startSpecificIdleAnimation = useCallback(
    async (animationName = "F_Standing_Idle_Variations_002", options = {}) => {
      if (!animationServiceRef.current) {
        return { success: false, error: "Animation service not available" };
      }

      if (!animationServiceRef.current.isReady()) {
        return { success: false, error: "Animation service not ready" };
      }

      const character = animationServiceRef.current.getCurrentCharacter();
      if (!character) {
        return { success: false, error: "Character not available" };
      }

      try {
        // Use longer transition for returning to idle for smoother transitions
        const transitionDuration = options.transitionDuration || 0.8;

        const result = await animationServiceRef.current.playAnimationWithTransition(
          animationName,
          {
            isLooping: true,
            speedRatio: 1.0,
            transitionDuration,
            ...options,
          }
        );

        if (result.success) {
          setAnimationState("idle");
        }
        return result;
      } catch (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
    },
    []
  );

  /**
   * Load character with animations from Ready Player Me avatar
   * @param {string} avatarUrl - Ready Player Me avatar URL
   * @param {Object} options - Loading options
   */
  const loadAvatarAnimations = useCallback(
    async (avatarUrl, options = {}) => {
      if (!animationServiceRef.current) {
        setError("Animation service not initialized");
        return { success: false, error: "Animation service not initialized" };
      }

      setIsLoading(true);
      setError(null);

      try {
        const defaultAnimations = [
          "/animations/masculine/idle/M_Standing_Idle_Variations_001.glb",
          "/animations/masculine/idle/M_Standing_Idle_Variations_002.glb",
          "/animations/masculine/idle/M_Standing_Idle_Variations_003.glb",
          "/animations/feminine/idle/F_Standing_Idle_Variations_002.glb",

          "/animations/masculine/expression/M_Talking_Variations_005.glb",
          "/animations/masculine/expression/M_Talking_Variations_006.glb",
          "/animations/masculine/expression/M_Talking_Variations_007.glb",

          "/animations/masculine/expression/M_Standing_Expressions_001.glb",
          "/animations/masculine/expression/M_Standing_Expressions_002.glb",
          "/animations/masculine/expression/M_Standing_Expressions_004.glb",
          "/animations/masculine/expression/M_Standing_Expressions_005.glb",
          "/animations/masculine/expression/M_Standing_Expressions_006.glb",
          "/animations/masculine/expression/M_Standing_Expressions_007.glb",
          "/animations/masculine/expression/M_Standing_Expressions_008.glb",
          "/animations/masculine/expression/M_Standing_Expressions_013.glb",

          "/animations/masculine/dance/M_Dances_001.glb",
          "/animations/masculine/dance/M_Dances_002.glb",
          "/animations/masculine/dance/M_Dances_003.glb",
          "/animations/masculine/dance/M_Dances_004.glb",
          "/animations/masculine/dance/M_Dances_005.glb",

          "/animations/masculine/expression/M_Talking_Variations_001.glb",
          "/animations/masculine/expression/M_Talking_Variations_002.glb",
          "/animations/masculine/expression/M_Talking_Variations_003.glb",
          "/animations/masculine/expression/M_Talking_Variations_004.glb",
        ];

        const animationPaths = options.animationPaths || defaultAnimations;

        const result = await animationServiceRef.current.loadCharacter(avatarUrl, animationPaths);

        if (result.success) {
          setCurrentCharacter(result.character);
          setAnimationState("idle");

          registerAnimationService(animationServiceRef.current);
          setAnimations(animationPaths);

          setTimeout(async () => {
            try {
              const idleResult = await animationServiceRef.current.playAnimationWithTransition(
                "F_Standing_Idle_Variations_002",
                {
                  isLooping: true,
                  speedRatio: 1.0,
                  transitionDuration: 0.3,
                }
              );
              if (idleResult.success) {
                setAnimationState("idle");

                setTimeout(() => {
                  _cleanupDuplicateAvatars();
                }, 300);
              } else {
                console.warn("Failed to start idle animations:", idleResult.error);
              }
            } catch (error) {
              console.error("Error starting idle animations:", error);
            }
          }, 50);
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
    },
    [_cleanupDuplicateAvatars, registerAnimationService, setAnimations]
  );

  /**
   * Start idle animations (now uses specific idle animation)
   */
  const startIdleAnimations = useCallback(async () => {
    return await startSpecificIdleAnimation();
  }, [startSpecificIdleAnimation]);

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
   * Play a specific animation with smooth transitions
   * @param {string} animationName - Name of animation
   * @param {Object} options - Animation options
   */
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
          }
        );
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
  };
};
