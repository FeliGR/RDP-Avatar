import { AnimationCompositionRoot } from '../../infrastructure/composition/AnimationCompositionRoot.js';

/**
 * Animation Service - High-level facade for animation system
 * Provides clean API for consuming components
 */
export class AnimationService {
  constructor(scene, shadowGenerator = null) {
    this.compositionRoot = new AnimationCompositionRoot(scene, shadowGenerator);
    this.currentCharacter = null;
    this.isInitialized = false;
  }

  /**
   * Load character model with animations
   * @param {string} modelPath - Path to character model
   * @param {string[]} animationPaths - Array of animation file paths
   * @returns {Promise<{success: boolean, character?: Character, error?: string}>}
   */
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
      console.error('Error loading character:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start idle animations
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async startIdleAnimations() {
    if (!this._checkInitialized()) {
      return { success: false, error: 'Character not loaded' };
    }

    try {
      const playIdleUseCase = this.compositionRoot.getPlayIdleAnimationUseCase();
      const result = await playIdleUseCase.execute(this.currentCharacter);
      return result;
    } catch (error) {
      console.error('Error starting idle animations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start talking animations with optional audio
   * @param {BABYLON.Sound} audioSource - Optional audio source for lip-sync
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async startTalkingAnimations(audioSource = null) {
    if (!this._checkInitialized()) {
      return { success: false, error: 'Character not loaded' };
    }

    try {
      const playTalkingUseCase = this.compositionRoot.getPlayTalkingAnimationUseCase();
      
      // Initialize audio analyzer if audio source provided
      if (audioSource) {
        const audioAnalyzer = this.compositionRoot.getAudioAnalyzer();
        audioAnalyzer.initialize(audioSource);
      }
      
      const result = await playTalkingUseCase.execute(this.currentCharacter, audioSource);
      return result;
    } catch (error) {
      console.error('Error starting talking animations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop talking animations and return to idle
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async stopTalkingAnimations() {
    if (!this._checkInitialized()) {
      return { success: false, error: 'Character not loaded' };
    }

    try {
      const playTalkingUseCase = this.compositionRoot.getPlayTalkingAnimationUseCase();
      const result = await playTalkingUseCase.stop(this.currentCharacter);
      
      if (result.success) {
        // Restart idle animations
        await this.startIdleAnimations();
      }
      
      return result;
    } catch (error) {
      console.error('Error stopping talking animations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Play a specific animation
   * @param {string} animationName - Name of animation to play
   * @param {Object} options - Animation options
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async playAnimation(animationName, options = {}) {
    if (!this._checkInitialized()) {
      return { success: false, error: 'Character not loaded' };
    }

    try {
      const animationController = this.compositionRoot.getAnimationController();
      await animationController.playAnimation(this.currentCharacter, animationName, options);
      
      return { success: true };
    } catch (error) {
      console.error('Error playing animation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set morph target value
   * @param {string} morphName - Name of morph target
   * @param {number} value - Target value (0-1)
   * @param {number} duration - Animation duration in ms
   * @returns {{success: boolean, error?: string}}
   */
  setMorphTarget(morphName, value, duration = 0) {
    if (!this._checkInitialized()) {
      return { success: false, error: 'Character not loaded' };
    }

    try {
      const morphController = this.compositionRoot.getMorphTargetController();
      morphController.animateMorphTarget(this.currentCharacter, morphName, value, duration);
      
      return { success: true };
    } catch (error) {
      console.error('Error setting morph target:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current character
   * @returns {Character|null}
   */
  getCurrentCharacter() {
    return this.currentCharacter;
  }

  /**
   * Check if service is initialized with a character
   * @returns {boolean}
   */
  isReady() {
    return this.isInitialized && this.currentCharacter !== null;
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    if (this.compositionRoot) {
      this.compositionRoot.dispose();
    }
    
    this.currentCharacter = null;
    this.isInitialized = false;
  }

  // Private helper methods
  _checkInitialized() {
    return this.isInitialized && this.currentCharacter !== null;
  }
}
