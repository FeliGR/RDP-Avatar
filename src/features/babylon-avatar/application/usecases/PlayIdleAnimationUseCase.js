import { getAnimationsByCategory } from "../../../../shared/config/glbAssets.js";

/**
 * PlayIdleAnimationUseCase - Manages character idle animations with smooth cycling
 */
export class PlayIdleAnimationUseCase {
  constructor({ animationController, morphTargetController }) {
    this.animationController = animationController;
    this.morphTargetController = morphTargetController;
    this.activeIdleSystems = new Map(); // Track active idle systems by character ID
  }

  /**
   * Starts the idle animation system
   * @param {Object} character - The character to animate
   * @returns {Object} Success/error result
   */
  async execute(character) {
    if (!character.canPlayAnimation("idle")) {
      throw new Error("Character cannot play idle animations");
    }

    // Check if idle system is already running for this character
    const existingSystem = this.activeIdleSystems.get(character.id);
    if (existingSystem) {
      console.log(
        `[Idle Animation] Idle system already running for character ${character.id}, not restarting`,
      );
      return {
        success: true,
        message: "Idle system already active",
        animations: existingSystem.animations,
      };
    }

    // Get ALL available idle animations for maximum variety
    const availableAnimations = this._getAvailableIdleAnimations(character);

    if (availableAnimations.length === 0) {
      throw new Error("No idle animations available");
    }

    const initialAnimation = availableAnimations[0];

    try {
      console.log(
        `[Idle Animation] Starting idle system with ${availableAnimations.length} animations`,
      );
      console.log(`[Idle Animation] Initial animation: ${initialAnimation}`);

      // Start the first idle animation with smooth blending
      await this.animationController.playAnimationWithBlending(character, initialAnimation, {
        isLooping: true,
        speedRatio: 1.0,
        transitionSpeed: 0.015,
        maxWeight: 1.0,
      });

      // Enable automatic facial animations for more lifelike appearance
      this.morphTargetController.startAutomaticFacialAnimations(character);

      // Set up the cycling system for variety
      this._setupIdleVariationCycling(character, availableAnimations);

      // Mark this character as having an active idle system
      this.activeIdleSystems.set(character.id, {
        animations: availableAnimations,
        startTime: Date.now(),
      });

      // Reset recent animations history for fresh start
      this.recentAnimations = [];

      return {
        success: true,
        message: `Started idle animation system with ${availableAnimations.length} variations`,
        animations: availableAnimations,
      };
    } catch (error) {
      console.error(`[Idle Animation] Error starting idle system:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Gets all available idle animations for the character
   * @param {Object} character - The character to check
   * @returns {Array} List of available animation names
   */
  _getAvailableIdleAnimations(character) {
    // Get ALL idle animations for maximum variety
    const allIdleAnimations = getAnimationsByCategory("idle");
    const availableAnimations = [];

    // Check what animations are actually available on the character
    allIdleAnimations.forEach((animPath) => {
      const animName = animPath.split("/").pop().replace(".glb", "");
      if (character.hasAnimation(animName)) {
        availableAnimations.push(animName);
      }
    });

    console.log(
      `[Idle Animation] Found ${availableAnimations.length} available idle animations:`,
      availableAnimations,
    );
    return availableAnimations;
  }

  /**
   * Sets up the automatic cycling system between idle variations
   * @param {Object} character - The character to animate
   * @param {Array} availableAnimations - List of available animation names
   */
  _setupIdleVariationCycling(character, availableAnimations) {
    // No cycling needed if only one animation
    if (availableAnimations.length <= 1) {
      console.log("[Idle Cycling] Single animation mode - no cycling needed");
      return;
    }

    let currentAnimationIndex = 0;
    let isTransitioning = false;

    /**
     * Cycles to the next random idle animation
     */
    const cycleToNextAnimation = () => {
      // Prevent overlapping transitions
      if (isTransitioning) {
        console.log("[Idle Cycling] Transition in progress - skipping cycle");
        return;
      }

      isTransitioning = true;

      // Select a different animation randomly to avoid immediate repetition
      const nextIndex = this._selectNextAnimationIndex(
        currentAnimationIndex,
        availableAnimations.length,
      );
      currentAnimationIndex = nextIndex;
      const nextAnimation = availableAnimations[nextIndex];

      console.log(
        `[Idle Cycling] Transitioning to: ${nextAnimation} (${nextIndex + 1}/${availableAnimations.length})`,
      );

      // Perform smooth transition to next idle animation
      this.animationController
        .playAnimationWithBlending(character, nextAnimation, {
          isLooping: true,
          speedRatio: 1.0,
          transitionSpeed: 0.015,
          maxWeight: 1.0,
        })
        .then(() => {
          console.log(`[Idle Cycling] Successfully transitioned to ${nextAnimation}`);
          isTransitioning = false;

          // Set up observer for the new animation after a small delay
          setTimeout(() => {
            this.animationController.setupIdleObservers(character, cycleToNextAnimation);
          }, 200);
        })
        .catch((error) => {
          console.warn(`[Idle Cycling] Transition failed for ${nextAnimation}:`, error);
          isTransitioning = false;

          // Attempt recovery by setting up observer again
          setTimeout(() => {
            this.animationController.setupIdleObservers(character, cycleToNextAnimation);
          }, 1000);
        });
    };

    console.log(
      `[Idle Cycling] Initializing cycling system with ${availableAnimations.length} animations`,
    );

    // Set up the initial observer with a delay to ensure animation has started
    setTimeout(() => {
      this.animationController.setupIdleObservers(character, cycleToNextAnimation);
    }, 300);
  }

  /**
   * Selects the next animation index, ensuring it's different from current
   * @param {number} currentIndex - Current animation index
   * @param {number} totalAnimations - Total number of animations
   * @returns {number} Next animation index
   */
  _selectNextAnimationIndex(currentIndex, totalAnimations) {
    if (totalAnimations <= 1) return 0;

    // For better variety, create a weighted selection that avoids recent animations
    const recentlyUsed = this.recentAnimations || [];
    const availableIndices = [];

    // Add all indices, but weight them based on how recently they were used
    for (let i = 0; i < totalAnimations; i++) {
      if (i === currentIndex) continue; // Never select current animation

      const recentIndex = recentlyUsed.indexOf(i);
      if (recentIndex === -1) {
        // Not recently used, add multiple times for higher probability
        availableIndices.push(i, i, i);
      } else if (recentIndex > 1) {
        // Used but not too recently, add once
        availableIndices.push(i);
      }
      // If used very recently (index 0 or 1), don't add at all
    }

    // If no good candidates, fall back to any non-current animation
    if (availableIndices.length === 0) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * totalAnimations);
      } while (nextIndex === currentIndex);
      return nextIndex;
    }

    // Select from weighted available indices
    const selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

    // Update recent animations history
    if (!this.recentAnimations) this.recentAnimations = [];
    this.recentAnimations.unshift(selectedIndex);

    // Keep only the last 3 animations in history
    if (this.recentAnimations.length > 3) {
      this.recentAnimations = this.recentAnimations.slice(0, 3);
    }

    return selectedIndex;
  }

  /**
   * Stops the idle animation system
   * @param {Object} character - The character to stop
   * @returns {Object} Success/error result
   */
  stop(character) {
    try {
      console.log("[Idle Animation] Stopping idle animation system");

      // Clean up observers and stop animations
      this.animationController.removeObservers(character);
      this.animationController.stopAnimation(character);
      this.morphTargetController.stopAutomaticFacialAnimations(character);

      // Remove from active systems
      this.activeIdleSystems.delete(character.id);

      // Reset recent animations history
      this.recentAnimations = [];

      return {
        success: true,
        message: "Idle animation system stopped",
      };
    } catch (error) {
      console.error("[Idle Animation] Error stopping idle system:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Checks if an idle system is running for the character
   * @param {Object} character - The character to check
   * @returns {boolean} True if idle system is active
   */
  isIdleSystemActive(character) {
    return this.activeIdleSystems.has(character.id);
  }

  /**
   * Resumes idle cycling without restarting the system
   * @param {Object} character - The character to resume
   * @returns {Object} Success/error result
   */
  async resume(character) {
    const existingSystem = this.activeIdleSystems.get(character.id);
    if (!existingSystem) {
      console.log("[Idle Animation] No idle system to resume, starting new one");
      return this.execute(character);
    }

    try {
      console.log("[Idle Animation] Resuming idle animation cycling");

      // Get a random idle animation to transition to
      const availableAnimations = existingSystem.animations;
      const randomAnimation =
        availableAnimations[Math.floor(Math.random() * availableAnimations.length)];

      // Play the random idle animation
      await this.animationController.playAnimationWithBlending(character, randomAnimation, {
        isLooping: true,
        speedRatio: 1.0,
        transitionSpeed: 0.015,
        maxWeight: 1.0,
      });

      // Re-enable automatic facial animations
      this.morphTargetController.startAutomaticFacialAnimations(character);

      // Resume the cycling system
      this._setupIdleVariationCycling(character, availableAnimations);

      return {
        success: true,
        message: "Idle animation system resumed",
      };
    } catch (error) {
      console.error("[Idle Animation] Error resuming idle system:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
