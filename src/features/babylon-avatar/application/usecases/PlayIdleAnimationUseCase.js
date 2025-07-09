/**
 * PlayIdleAnimationUseCase - Manages character idle animations with smooth cycling
 */
export class PlayIdleAnimationUseCase {
  constructor({ animationController, morphTargetController }) {
    this.animationController = animationController;
    this.morphTargetController = morphTargetController;
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

    // Define idle animations in priority order (masculine preferred, generic fallback)
    const availableAnimations = this._getAvailableIdleAnimations(character);

    if (availableAnimations.length === 0) {
      throw new Error("No idle animations available");
    }

    const initialAnimation = availableAnimations[0];

    try {
      console.log(`[Idle Animation] Starting idle system with ${availableAnimations.length} animations`);
      console.log(`[Idle Animation] Initial animation: ${initialAnimation}`);
      
      // Start the first idle animation with smooth blending
      await this.animationController.playAnimationWithBlending(character, initialAnimation, {
        isLooping: true,
        speedRatio: 1.0,
        transitionSpeed: 0.015,
        maxWeight: 1.0
      });

      // Enable automatic facial animations for more lifelike appearance
      this.morphTargetController.startAutomaticFacialAnimations(character);

      // Set up the cycling system for variety
      this._setupIdleVariationCycling(character, availableAnimations);

      return {
        success: true,
        message: `Started idle animation system with ${availableAnimations.length} variations`,
        animations: availableAnimations
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
    const idleAnimationNames = [
      // Primary masculine idle variations (preferred)
      "M_Standing_Idle_Variations_001",
      "M_Standing_Idle_Variations_002", 
      "M_Standing_Idle_Variations_003",
      // Generic fallback idles
      "Idle_Variations_001",
      "Idle_Variations_002",
      "Idle_Variations_003",
    ];

    const available = idleAnimationNames.filter(name => character.hasAnimation(name));
    
    console.log(`[Idle Animation] Found ${available.length} available animations:`, available);
    return available;
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
      const nextIndex = this._selectNextAnimationIndex(currentAnimationIndex, availableAnimations.length);
      currentAnimationIndex = nextIndex;
      const nextAnimation = availableAnimations[nextIndex];

      console.log(`[Idle Cycling] Transitioning to: ${nextAnimation} (${nextIndex + 1}/${availableAnimations.length})`);
      
      // Perform smooth transition to next idle animation
      this.animationController.playAnimationWithBlending(character, nextAnimation, {
        isLooping: true,
        speedRatio: 1.0,
        transitionSpeed: 0.015,
        maxWeight: 1.0
      })
      .then(() => {
        console.log(`[Idle Cycling] Successfully transitioned to ${nextAnimation}`);
        isTransitioning = false;
        
        // Set up observer for the new animation after a small delay
        setTimeout(() => {
          this.animationController.setupIdleObservers(character, cycleToNextAnimation);
        }, 200);
      })
      .catch(error => {
        console.warn(`[Idle Cycling] Transition failed for ${nextAnimation}:`, error);
        isTransitioning = false;
        
        // Attempt recovery by setting up observer again
        setTimeout(() => {
          this.animationController.setupIdleObservers(character, cycleToNextAnimation);
        }, 1000);
      });
    };

    console.log(`[Idle Cycling] Initializing cycling system with ${availableAnimations.length} animations`);
    
    // Set up the initial observer with a delay to ensure animation has started
    setTimeout(() => {
      this.animationController.setupIdleObservers(character, cycleToNextAnimation);
    }, 300);
  }

  /**
   * Selects the next animation index, ensuring it's different from current
   * @param {number} currentIndex - Current animation index
   * @param {number} totalAnimations - Total number of available animations
   * @returns {number} Next animation index
   */
  _selectNextAnimationIndex(currentIndex, totalAnimations) {
    if (totalAnimations <= 1) return 0;
    
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * totalAnimations);
    } while (nextIndex === currentIndex);
    
    return nextIndex;
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
}
