import { AnimationBlend } from '../../domain/entities/Animation.js';

/**
 * Play Idle Animation Use Case
 * Handles the business logic for playing idle animations
 */
export class PlayIdleAnimationUseCase {
  constructor({
    animationController,
    morphTargetController
  }) {
    this.animationController = animationController;
    this.morphTargetController = morphTargetController;
  }

  async execute(character) {
    if (!character.canPlayAnimation('idle')) {
      throw new Error('Character cannot play idle animations');
    }

    // Get available idle animations - check both original and cloned versions
    const idleAnimationNames = [
      'M_Standing_Idle_Variations_001',
      'M_Standing_Idle_Variations_002', 
      'M_Standing_Idle_Variations_003',
      // Also check for names without the 'M_Standing_' prefix (after cloning)
      'Idle_Variations_001',
      'Idle_Variations_002',
      'Idle_Variations_003'
    ];
    
    let availableAnimations = [];
    
    // Check for available animations
    idleAnimationNames.forEach(name => {
      if (character.hasAnimation(name)) {
        availableAnimations.push(name);
      }
    });

    if (availableAnimations.length === 0) {
      throw new Error('No idle animations available');
    }

    // Play first available idle animation with looping
    const selectedAnimation = availableAnimations[0];
    
    try {
      await this.animationController.playAnimation(character, selectedAnimation, {
        isLooping: true,
        speedRatio: 1.0
      });

      // Start automatic facial animations for more lifelike idle state
      this.morphTargetController.startAutomaticFacialAnimations(character);

      // Setup observers to cycle through idle variations
      this._setupIdleVariationCycling(character, availableAnimations);

      return {
        success: true,
        message: `Started idle animation: ${selectedAnimation}`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Setup cycling between different idle animation variations
   * @private
   */
  _setupIdleVariationCycling(character, availableAnimations) {
    if (availableAnimations.length <= 1) {
      return; // No variations to cycle through
    }

    let currentIndex = 0;

    // Setup observer to switch to next animation when current one ends
    this.animationController.setupIdleObservers(character, () => {
      // Move to next animation
      currentIndex = (currentIndex + 1) % availableAnimations.length;
      const nextAnimation = availableAnimations[currentIndex];
      
      this.animationController.playAnimation(character, nextAnimation, {
        isLooping: true,
        speedRatio: 1.0
      });
    });
  }

  /**
   * Stop idle animations
   */
  stop(character) {
    try {
      this.animationController.removeObservers(character);
      this.animationController.stopAnimation(character);
      this.morphTargetController.stopAutomaticFacialAnimations(character);

      return {
        success: true,
        message: 'Idle animations stopped'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
