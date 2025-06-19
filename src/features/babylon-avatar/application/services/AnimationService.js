import { AnimationCompositionRoot } from "../../infrastructure/composition/AnimationCompositionRoot.js";

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
      return { success: false, error: "Character not loaded" };
    }

    try {
      const playIdleUseCase = this.compositionRoot.getPlayIdleAnimationUseCase();
      const result = await playIdleUseCase.execute(this.currentCharacter);
      return result;
    } catch (error) {
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
      return { success: false, error: "Character not loaded" };
    }

    try {
      const playTalkingUseCase = this.compositionRoot.getPlayTalkingAnimationUseCase();
      const result = await playTalkingUseCase.stop(this.currentCharacter);

      if (result.success) {
        await this.startIdleAnimations();
      }

      return result;
    } catch (error) {
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

      const transitionOptions = {
        transitionDuration: options.transitionDuration || 0.3,
        blendMode: options.blendMode || "add",
        ...options,
      };

      await animationController.playAnimationWithTransition(
        this.currentCharacter,
        animationName,
        transitionOptions
      );

      return { success: true };
    } catch (error) {
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
}
