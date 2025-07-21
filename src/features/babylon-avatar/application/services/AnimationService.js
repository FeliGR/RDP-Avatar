import { AnimationCompositionRoot } from "../../infrastructure/composition/AnimationCompositionRoot.js";
import { getAnimationsByCategory } from "../../../../shared/config/glbAssets.js";

export class AnimationService {
  constructor(scene, shadowGenerator = null) {
    this.compositionRoot = new AnimationCompositionRoot(scene, shadowGenerator);
    this.currentCharacter = null;
    this.isInitialized = false;
  }

  async loadCharacter(modelPath, animationPaths = []) {
    try {
      const loadCharacterUseCase = this.compositionRoot.getLoadCharacterUseCase();
      const result = await loadCharacterUseCase.execute(modelPath, animationPaths);

      if (result.success) {
        this.currentCharacter = result.character;
        this.isInitialized = true;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async startIdleAnimations() {
    if (!this._checkInitialized()) {
      console.warn("[Animation Service] Character not loaded for starting idle animations");
      return { success: false, error: "Character not loaded" };
    }

    try {
      console.log("[Animation Service] Starting idle animations...");
      const playIdleUseCase = this.compositionRoot.getPlayIdleAnimationUseCase();
      
      // Check if idle system already exists, if so resume instead of execute
      const existingSystem = playIdleUseCase.activeIdleSystems?.get(this.currentCharacter.id);
      let result;
      
      if (existingSystem) {
        console.log("[Animation Service] Resuming existing idle system...");
        result = await playIdleUseCase.resume(this.currentCharacter);
      } else {
        console.log("[Animation Service] Creating new idle system...");
        result = await playIdleUseCase.execute(this.currentCharacter);
      }
      
      console.log("[Animation Service] Idle animations result:", result);
      return result;
    } catch (error) {
      console.error("[Animation Service] Error starting idle animations:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async startTalkingAnimations(audioSource = null) {
    if (!this._checkInitialized()) {
      return { success: false, error: "Character not loaded" };
    }

    try {
      const playTalkingUseCase = this.compositionRoot.getPlayTalkingAnimationUseCase();

      if (audioSource) {
        const audioAnalyzer = this.compositionRoot.getAudioAnalyzer();
        audioAnalyzer.initialize(audioSource);
      }

      const result = await playTalkingUseCase.execute(this.currentCharacter, audioSource);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async stopTalkingAnimations() {
    if (!this._checkInitialized()) {
      console.warn("[Animation Service] Character not loaded for stopping talking animations");
      return { success: false, error: "Character not loaded" };
    }

    try {
      console.log("[Animation Service] Stopping talking animations...");
      const playTalkingUseCase = this.compositionRoot.getPlayTalkingAnimationUseCase();
      const result = await playTalkingUseCase.stop(this.currentCharacter);
      console.log("[Animation Service] Talking animations stopped:", result);

      if (result.success) {
        console.log("[Animation Service] Starting idle animations...");
        const idleResult = await this.startIdleAnimations();
        console.log("[Animation Service] Idle animations started:", idleResult);
      }

      return result;
    } catch (error) {
      console.error("[Animation Service] Error in stopTalkingAnimations:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async playAnimation(animationName, options = {}) {
    if (!this._checkInitialized()) {
      return { success: false, error: "Character not loaded" };
    }

    try {
      const animationController = this.compositionRoot.getAnimationController();
      await animationController.playAnimation(this.currentCharacter, animationName, options);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async playAnimationWithTransition(animationName, options = {}) {
    if (!this._checkInitialized()) {
      return { success: false, error: "Character not loaded" };
    }

    try {
      const animationController = this.compositionRoot.getAnimationController();

      const blendingOptions = {
        transitionSpeed: options.transitionDuration
          ? 1.0 / (options.transitionDuration * 60)
          : 0.02,
        maxWeight: options.maxWeight || 1.0,
        animationOffset: options.animationOffset || 0,
        ...options,
      };

      await animationController.playAnimationWithBlending(
        this.currentCharacter,
        animationName,
        blendingOptions,
      );

      return { success: true };
    } catch (error) {
      console.error(`[Animation Service] Error playing animation with blending:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  setMorphTarget(morphName, value, duration = 0) {
    if (!this._checkInitialized()) {
      return { success: false, error: "Character not loaded" };
    }

    try {
      const morphController = this.compositionRoot.getMorphTargetController();
      morphController.animateMorphTarget(this.currentCharacter, morphName, value, duration);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async initializeOfficeEnvironment() {
    try {
      const sceneManager = this.compositionRoot.getSceneManager();
      const result = await sceneManager.initializeOfficeEnvironment();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  startOfficeAnimations() {
    try {
      const sceneManager = this.compositionRoot.getSceneManager();
      sceneManager.startOfficeAnimations();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  playVideo() {
    try {
      const sceneManager = this.compositionRoot.getSceneManager();
      sceneManager.playVideo();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  pauseVideo() {
    try {
      const sceneManager = this.compositionRoot.getSceneManager();
      sceneManager.pauseVideo();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  getCurrentCharacter() {
    return this.currentCharacter;
  }

  isReady() {
    return this.isInitialized && this.currentCharacter !== null;
  }

  dispose() {
    if (this.compositionRoot) {
      this.compositionRoot.dispose();
    }

    this.currentCharacter = null;
    this.isInitialized = false;
  }

  _checkInitialized() {
    return this.isInitialized && this.currentCharacter !== null;
  }

  async playMessageResponseAnimation(options = {}) {
    if (!this._checkInitialized()) {
      console.warn("[Animation Service] Character not loaded for message response");
      return { success: false, error: "Character not loaded" };
    }

    try {
      const animationController = this.compositionRoot.getAnimationController();

      const allResponseAnimations = getAnimationsByCategory("ai_response");
      const availableAnimations = [];

      const character = this.currentCharacter;
      if (character && character.animationGroups) {
        allResponseAnimations.forEach((animPath) => {
          const animName = animPath.split("/").pop().replace(".glb", "");
          if (character.hasAnimation(animName)) {
            availableAnimations.push(animName);
          }
        });
      }

      if (availableAnimations.length === 0) {
        console.warn(
          "[Animation Service] No response animations available from config, checking character animations",
        );

        if (character && character.animationGroups && character.animationGroups.length > 0) {
          character.animationGroups.forEach((animGroup) => {
            availableAnimations.push(animGroup.name);
          });
        } else {
          return { success: false, error: "No animations available" };
        }
      }

      const selectedAnimation =
        availableAnimations[Math.floor(Math.random() * availableAnimations.length)];

      const blendingOptions = {
        isLooping: false,
        speedRatio: 1.0,
        transitionSpeed: 0.015,
        maxWeight: 0.8,
        animationOffset: 0,
        ...options,
      };

      await animationController.playAnimationWithBlending(
        this.currentCharacter,
        selectedAnimation,
        blendingOptions,
      );

      return { success: true, animation: selectedAnimation };
    } catch (error) {
      console.error("[Animation Service] Error playing message response animation:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
