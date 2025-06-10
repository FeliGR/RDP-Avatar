import { AnimationBlend } from '../../domain/entities/Animation.js';

/**
 * Play Talking Animation Use Case
 * Handles the business logic for playing talking animations with morph target sync
 */
export class PlayTalkingAnimationUseCase {
  constructor({
    animationController,
    morphTargetController,
    audioAnalyzer
  }) {
    this.animationController = animationController;
    this.morphTargetController = morphTargetController;
    this.audioAnalyzer = audioAnalyzer;
    this.isTalking = false;
    this.morphCallback = null;
  }

  async execute(character, audioSource = null) {
    if (!character.canPlayAnimation('talking')) {
      throw new Error('Character cannot play talking animations');
    }

    this.isTalking = true;

    // Get available talking animations
    const talkingAnimations = [
      'M_Talking_Variations_005',
      'M_Talking_Variations_006',
      'M_Talking_Variations_007'
    ].filter(name => character.hasAnimation(name));

    if (talkingAnimations.length === 0) {
      throw new Error('No talking animations available');
    }

    // Stop idle animation observers
    this.animationController.removeObservers(character);

    // Start first talking animation
    await this._playRandomTalkingAnimation(character, talkingAnimations);

    // Setup audio-driven morph targets if audio source provided
    if (audioSource && this.audioAnalyzer) {
      this._setupAudioMorphTargets(character, audioSource);
    }

    // Setup talking animation loop
    this._setupTalkingLoop(character, talkingAnimations);

    return {
      success: true,
      isTalking: true
    };
  }

  async stop(character) {
    this.isTalking = false;

    // Remove audio morph callback
    if (this.morphCallback) {
      this.audioAnalyzer.removeCallback(this.morphCallback);
      this.morphCallback = null;
    }

    // Transition back to idle
    const idleAnim = character.getAnimationGroup('M_Standing_Idle_Variations_001');
    if (idleAnim) {
      const blendConfig = new AnimationBlend({
        fromAnimation: character.currentAnimation,
        toAnimation: idleAnim,
        blendSpeed: 0.02,
        maxWeight: 0.7
      });

      await this.animationController.blendAnimations(character, blendConfig);
    }

    return {
      success: true,
      isTalking: false
    };
  }

  async _playRandomTalkingAnimation(character, availableAnimations) {
    // Choose random animation different from current
    let randomAnim;
    do {
      const randomIndex = Math.floor(Math.random() * availableAnimations.length);
      randomAnim = availableAnimations[randomIndex];
    } while (character.currentAnimation?.name.includes(randomAnim));

    const animationGroup = character.getAnimationGroup(randomAnim);
    const animationOffset = 50; // Frame offset from your original code

    const blendConfig = new AnimationBlend({
      fromAnimation: character.currentAnimation,
      toAnimation: animationGroup,
      blendSpeed: 0.02,
      maxWeight: 0.75,
      frameRange: {
        start: animationOffset,
        end: animationGroup.duration - animationOffset
      }
    });

    await this.animationController.blendAnimations(character, blendConfig);
  }

  _setupAudioMorphTargets(character, audioSource) {
    const morphMultiplier = 0.65; // From your original code

    this.morphCallback = (frequencyData) => {
      if (!this.isTalking) return;

      // Calculate jaw movement based on audio frequency
      const jawValue = (frequencyData[5] / 512) * morphMultiplier;

      // Apply morph targets for mouth movement
      this.morphTargetController.animateMorphTarget(character, 'jawOpen', jawValue * 2, 0);
      this.morphTargetController.animateMorphTarget(character, 'mouthOpen', jawValue, 0);
    };

    this.audioAnalyzer.addCallback(this.morphCallback);
  }

  _setupTalkingLoop(character, availableAnimations) {
    const checkAndPlayNext = () => {
      if (!this.isTalking) return;

      if (!character.currentAnimation?.isPlaying) {
        this._playRandomTalkingAnimation(character, availableAnimations)
          .then(() => {
            // Schedule next check
            setTimeout(checkAndPlayNext, 100);
          });
      } else {
        // Check again soon
        setTimeout(checkAndPlayNext, 100);
      }
    };

    // Start the loop
    setTimeout(checkAndPlayNext, 100);
  }
}
