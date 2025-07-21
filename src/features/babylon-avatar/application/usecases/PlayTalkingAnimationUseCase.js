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

    console.log("[Talking] Stopping all existing animations and observers");
    this.animationController.removeObservers(character);
    this.animationController.stopAnimation(character);

    if (this.animationController.clearPendingTransitions) {
      this.animationController.clearPendingTransitions();
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const selectedTalkingAnimation =
      talkingAnimations[Math.floor(Math.random() * talkingAnimations.length)];
    console.log(
      `[Talking] Starting SINGLE talking animation: ${selectedTalkingAnimation} - NO looping, NO switching`,
    );

    await this.animationController.playAnimationWithBlending(character, selectedTalkingAnimation, {
      isLooping: true,
      speedRatio: 0.8,
      transitionDuration: 0.4,
      maxWeight: 0.8,
    });

    if (audioSource && this.audioAnalyzer) {
      this._setupAudioMorphTargets(character, audioSource);
    }

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
