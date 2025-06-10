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
    console.log('PlayIdleAnimationUseCase.execute called');
    
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
        console.log('Found idle animation:', name);
      }
    });

    console.log('Available idle animations:', availableAnimations);
    console.log('All character animations:', character.animationGroups.map(ag => ag.name));

    if (availableAnimations.length === 0) {
      throw new Error('No idle animations available');
    }

    // Play first available idle animation with looping
    const firstIdle = availableAnimations[0];
    console.log('Playing first idle animation:', firstIdle);
    
    await this.animationController.playAnimation(character, firstIdle, {
      isLooping: true,  // Changed to true for continuous idle
      speedRatio: 1.0
    });

    // Setup idle chain observers
    this.animationController.setupIdleObservers(character, (currentAnim) => {
      this._handleIdleTransition(character, currentAnim, availableAnimations);
    });

    // Start automatic facial animations
    this.morphTargetController.startAutomaticFacialAnimations(character);

    return {
      success: true,
      currentAnimation: firstIdle
    };
  }

  async _handleIdleTransition(character, currentAnim, availableIdles) {
    // Find next idle animation (cycle through them)
    const currentIndex = availableIdles.findIndex(name => 
      currentAnim.name.includes(name)
    );
    const nextIndex = (currentIndex + 1) % availableIdles.length;
    const nextIdle = availableIdles[nextIndex];

    // Create blend configuration
    const blendConfig = new AnimationBlend({
      fromAnimation: currentAnim,
      toAnimation: character.getAnimationGroup(nextIdle),
      blendSpeed: 0.02,
      maxWeight: 0.8
    });

    await this.animationController.blendAnimations(character, blendConfig);
  }
}
