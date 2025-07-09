import { getAnimationsByCategory } from "../../../../shared/config/glbAssets.js";

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

    
    const allTalkingAnimations = getAnimationsByCategory("talking");
    const talkingAnimations = allTalkingAnimations
      .map((path) => path.split("/").pop().replace(".glb", ""))
      .filter((name) => character.hasAnimation(name));

    if (talkingAnimations.length === 0) {
      throw new Error("No talking animations available");
    }

    console.log(
      `[Talking Animation] Found ${talkingAnimations.length} talking animations for variety`,
    );

    this.animationController.removeObservers(character);

    await this._playRandomTalkingAnimation(character, talkingAnimations);

    if (audioSource && this.audioAnalyzer) {
      this._setupAudioMorphTargets(character, audioSource);
    }

    this._setupTalkingLoop(character, talkingAnimations);

    return {
      success: true,
      message: `Started talking animations with ${talkingAnimations.length} variations`,
    };
  }

  stop(character) {
    this.isTalking = false;

    this.animationController.removeObservers(character);

    if (this.audioAnalyzer && this.audioAnalyzer.isAnalyzing()) {
      this.audioAnalyzer.stop();
    }

    if (this.morphCallback) {
      this.audioAnalyzer.removeCallback(this.morphCallback);
      this.morphCallback = null;
    }

    this._resetMouthMorphTargets(character);

    return {
      success: true,
      message: "Stopped talking animations",
    };
  }

  async _playRandomTalkingAnimation(character, talkingAnimations) {
    const randomAnimation = talkingAnimations[Math.floor(Math.random() * talkingAnimations.length)];

    console.log(`[Talking Animation] Starting talking animation: ${randomAnimation}`);

    return this.animationController.playAnimationWithBlending(character, randomAnimation, {
      isLooping: false,
      speedRatio: 1.0,
      transitionSpeed: 0.02,
      maxWeight: 0.75, 
      animationOffset: 50, 
    });
  }

  _setupAudioMorphTargets(character, audioSource) {
    this.morphCallback = (frequencyData) => {
      if (!this.isTalking) return;

      const volume = this._calculateVolume(frequencyData);

      this._updateMouthMorphTargets(character, volume);
    };

    this.audioAnalyzer.addCallback(this.morphCallback);
  }

  _setupTalkingLoop(character, talkingAnimations) {
    this.animationController.setupIdleObservers(character, () => {
      if (this.isTalking) {
        console.log(`[Talking Loop] Current animation ended, playing next talking animation`);

        
        setTimeout(() => {
          if (this.isTalking) {
            
            this._playRandomTalkingAnimation(character, talkingAnimations).catch((error) => {
              console.warn(`[Talking Loop] Error playing talking animation:`, error);
            });
          }
        }, 100);
      }
    });
  }

  _calculateVolume(frequencyData) {
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i];
    }
    return sum / (frequencyData.length * 255);
  }

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
