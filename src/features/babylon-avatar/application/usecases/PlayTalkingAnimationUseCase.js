import { AnimationBlend } from "../../domain/entities/Animation.js";

/**
 * Play Talking Animation Use Case
 * Handles the business logic for playing talking animations with morph target sync
 */
export class PlayTalkingAnimationUseCase {
  constructor({ animationController, morphTargetController, audioAnalyzer }) {
    this.animationController = animationController;
    this.morphTargetController = morphTargetController;
    this.audioAnalyzer = audioAnalyzer;
    this.isTalking = false;
    this.morphCallback = null;
  }

  async execute(character, audioSource = null) {
    if (!character.canPlayAnimation("talking")) {
      throw new Error("Character cannot play talking animations");
    }

    this.isTalking = true;

    // Get available talking animations
    const talkingAnimations = [
      "M_Talking_Variations_005",
      "M_Talking_Variations_006",
      "M_Talking_Variations_007",
    ].filter((name) => character.hasAnimation(name));

    if (talkingAnimations.length === 0) {
      throw new Error("No talking animations available");
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
      message: "Started talking animations",
    };
  }

  /**
   * Stop talking animations
   */
  stop(character) {
    this.isTalking = false;

    // Remove animation observers
    this.animationController.removeObservers(character);

    // Stop audio analysis
    if (this.audioAnalyzer && this.audioAnalyzer.isAnalyzing()) {
      this.audioAnalyzer.stop();
    }

    // Remove morph callback
    if (this.morphCallback) {
      this.audioAnalyzer.removeCallback(this.morphCallback);
      this.morphCallback = null;
    }

    // Reset mouth morph targets
    this._resetMouthMorphTargets(character);

    return {
      success: true,
      message: "Stopped talking animations",
    };
  }

  /**
   * Play random talking animation
   * @private
   */
  async _playRandomTalkingAnimation(character, talkingAnimations) {
    const randomAnimation = talkingAnimations[Math.floor(Math.random() * talkingAnimations.length)];

    return this.animationController.playAnimation(character, randomAnimation, {
      isLooping: false,
      speedRatio: 1.0,
    });
  }

  /**
   * Setup audio-driven morph targets
   * @private
   */
  _setupAudioMorphTargets(character, audioSource) {
    this.morphCallback = (frequencyData) => {
      if (!this.isTalking) return;

      // Calculate volume from frequency data
      const volume = this._calculateVolume(frequencyData);

      // Map volume to mouth movements
      this._updateMouthMorphTargets(character, volume);
    };

    this.audioAnalyzer.addCallback(this.morphCallback);
  }

  /**
   * Setup talking animation loop
   * @private
   */
  _setupTalkingLoop(character, talkingAnimations) {
    this.animationController.setupIdleObservers(character, () => {
      if (this.isTalking) {
        // Play next random talking animation
        this._playRandomTalkingAnimation(character, talkingAnimations);
      }
    });
  }

  /**
   * Calculate volume from frequency data
   * @private
   */
  _calculateVolume(frequencyData) {
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i];
    }
    return sum / (frequencyData.length * 255); // Normalize to 0-1
  }

  /**
   * Update mouth morph targets based on audio volume
   * @private
   */
  _updateMouthMorphTargets(character, volume) {
    const jawOpen = character.getMorphTarget("jawOpen");
    const mouthOpen = character.getMorphTarget("mouthOpen");
    const teethMouthOpen = character.getMorphTarget("teethMouthOpen");

    if (jawOpen) {
      jawOpen.influence = Math.min(1, volume * 2.5);
    }

    if (mouthOpen) {
      mouthOpen.influence = Math.min(1, volume * 2.0);
    }

    if (teethMouthOpen) {
      teethMouthOpen.influence = Math.min(1, volume * 1.5);
    }
  }

  /**
   * Reset mouth morph targets to default
   * @private
   */
  _resetMouthMorphTargets(character) {
    const jawOpen = character.getMorphTarget("jawOpen");
    const mouthOpen = character.getMorphTarget("mouthOpen");
    const teethMouthOpen = character.getMorphTarget("teethMouthOpen");

    if (jawOpen) {
      jawOpen.influence = 0;
    }

    if (mouthOpen) {
      mouthOpen.influence = 0;
    }

    if (teethMouthOpen) {
      teethMouthOpen.influence = 0;
    }
  }
}
