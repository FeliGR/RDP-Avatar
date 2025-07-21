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

    // 1) FIRST: Stop ALL existing animations and observers
    console.log("[Talking] Stopping all existing animations and observers");
    this.animationController.removeObservers(character);
    this.animationController.stopAnimation(character); // FORCE stop current animation

    // 2) Clear any pending animation transitions to prevent conflicts
    if (this.animationController.clearPendingTransitions) {
      this.animationController.clearPendingTransitions();
    }

    // 3) Wait longer to ensure complete cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 4) NOW: Select ONE talking animation and keep it running - NO switching
    const selectedTalkingAnimation =
      talkingAnimations[Math.floor(Math.random() * talkingAnimations.length)];
    console.log(
      `[Talking] Starting SINGLE talking animation: ${selectedTalkingAnimation} - NO looping, NO switching`,
    );

    await this.animationController.playAnimationWithBlending(character, selectedTalkingAnimation, {
      isLooping: true, // Loop the SAME talking animation during AI response
      speedRatio: 0.8, // Match reference code exactly
      transitionDuration: 0.4, // Time-based transition
      maxWeight: 0.8, // Higher weight for talking like reference code
    });

    if (audioSource && this.audioAnalyzer) {
      this._setupAudioMorphTargets(character, audioSource);
    }

    // NO additional animation logic - just let the selected animation loop

    return {
      success: true,
      message: `Started talking animation: ${selectedTalkingAnimation}`,
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

  _setupAudioMorphTargets(character, audioSource) {
    this.morphCallback = (frequencyData) => {
      if (!this.isTalking) return;

      const volume = this._calculateVolume(frequencyData);

      this._updateMouthMorphTargets(character, volume);
    };

    this.audioAnalyzer.addCallback(this.morphCallback);
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
