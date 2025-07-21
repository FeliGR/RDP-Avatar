import { getAnimationsByCategory } from "../../../../shared/config/glbAssets.js";

/**
 * PlayIdleAnimationUseCase - Manages character idle animations with smooth cycling
 */
export class PlayIdleAnimationUseCase {
  constructor({ animationController, morphTargetController }) {
    this.animationController = animationController;
    this.morphTargetController = morphTargetController;
    this.activeIdleSystems = new Map();
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

    const existingSystem = this.activeIdleSystems.get(character.id);
    if (existingSystem) {
      return {
        success: true,
        message: "Idle system already active",
        animations: existingSystem.animations,
      };
    }

    const availableAnimations = this._getAvailableIdleAnimations(character);

    if (availableAnimations.length === 0) {
      throw new Error("No idle animations available");
    }

    const initialAnimation = availableAnimations[0];

    try {
      await this.animationController.playAnimationWithBlending(character, initialAnimation, {
        isLooping: true,
        speedRatio: 0.8,
        transitionDuration: 0.4,
        maxWeight: 1.0,
      });

      this.morphTargetController.startAutomaticFacialAnimations(character);

      this._setupIdleVariationCycling(character, availableAnimations);

      this.activeIdleSystems.set(character.id, {
        animations: availableAnimations,
        startTime: Date.now(),
      });

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
    const allIdleAnimations = getAnimationsByCategory("idle");
    const availableAnimations = [];

    allIdleAnimations.forEach((animPath) => {
      const animName = animPath.split("/").pop().replace(".glb", "");
      if (character.hasAnimation(animName)) {
        availableAnimations.push(animName);
      }
    });
    return availableAnimations;
  }

  /**
   * Sets up the automatic cycling system between idle variations
   * @param {Object} character - The character to animate
   * @param {Array} availableAnimations - List of available animation names
   */
  _setupIdleVariationCycling(character, availableAnimations) {
    if (availableAnimations.length <= 1) {
      return;
    }

    let currentAnimationIndex = 0;
    let isTransitioning = false;

    /**
     * Cycles to the next random idle animation
     */
    const cycleToNextAnimation = () => {
      if (isTransitioning) {
        return;
      }

      isTransitioning = true;

      const nextIndex = this._selectNextAnimationIndex(
        currentAnimationIndex,
        availableAnimations.length,
      );
      currentAnimationIndex = nextIndex;
      const nextAnimation = availableAnimations[nextIndex];

      this.animationController
        .playAnimationWithBlending(character, nextAnimation, {
          isLooping: true,
          speedRatio: 0.8,
          transitionDuration: 0.3,
          maxWeight: 1.0,
        })
        .then(() => {
          isTransitioning = false;

          setTimeout(() => {
            this.animationController.setupIdleObservers(character, cycleToNextAnimation);
          }, 200);
        })
        .catch((error) => {
          console.warn(`[Idle Cycling] Transition failed for ${nextAnimation}:`, error);
          isTransitioning = false;

          setTimeout(() => {
            this.animationController.setupIdleObservers(character, cycleToNextAnimation);
          }, 1000);
        });
    };

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

    const recentlyUsed = this.recentAnimations || [];
    const availableIndices = [];

    for (let i = 0; i < totalAnimations; i++) {
      if (i === currentIndex) continue;

      const recentIndex = recentlyUsed.indexOf(i);
      if (recentIndex === -1) {
        availableIndices.push(i, i, i);
      } else if (recentIndex > 1) {
        availableIndices.push(i);
      }
    }

    if (availableIndices.length === 0) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * totalAnimations);
      } while (nextIndex === currentIndex);
      return nextIndex;
    }

    const selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

    if (!this.recentAnimations) this.recentAnimations = [];
    this.recentAnimations.unshift(selectedIndex);

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
      this.animationController.removeObservers(character);
      this.animationController.stopAnimation(character);
      this.morphTargetController.stopAutomaticFacialAnimations(character);

      this.activeIdleSystems.delete(character.id);

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
      return this.execute(character);
    }

    try {
      const availableAnimations = existingSystem.animations;
      const randomAnimation =
        availableAnimations[Math.floor(Math.random() * availableAnimations.length)];

      const animGroup = this.animationController.getAnimationGroup
        ? this.animationController.getAnimationGroup(character, randomAnimation)
        : null;
      let frameStart = 0;
      if (animGroup && animGroup.to && animGroup.from !== undefined) {
        frameStart = animGroup.from + Math.random() * (animGroup.to - animGroup.from);
      }

      await this.animationController.playAnimationWithBlending(character, randomAnimation, {
        isLooping: true,
        speedRatio: 0.8,
        transitionDuration: 0.5,
        maxWeight: 0.8,
        frameStart,
      });

      this.morphTargetController.startAutomaticFacialAnimations(character);

      setTimeout(() => {
        this._setupIdleVariationCycling(character, availableAnimations);
      }, 3000);

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
