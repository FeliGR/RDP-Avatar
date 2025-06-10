/**
 * Animation Repository Interface
 * Defines contract for loading and managing animations
 */
export class IAnimationRepository {
  /**
   * Load animations from a source
   * @param {string} animationPaths - Array of animation file paths
   * @returns {Promise<AnimationGroup[]>}
   */
  async loadAnimations(animationPaths) {
    throw new Error('Method not implemented');
  }

  /**
   * Load character model with animations
   * @param {string} modelPath - Path to character model
   * @returns {Promise<Character>}
   */
  async loadCharacterModel(modelPath) {
    throw new Error('Method not implemented');
  }

  /**
   * Dispose of loaded resources
   * @param {Character} character
   */
  dispose(character) {
    throw new Error('Method not implemented');
  }
}

/**
 * Animation Controller Interface
 * Defines contract for controlling character animations
 */
export class IAnimationController {
  /**
   * Play an animation
   * @param {Character} character
   * @param {string} animationName
   * @param {Object} options
   */
  playAnimation(character, animationName, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Blend between two animations
   * @param {Character} character
   * @param {AnimationBlend} blendConfig
   * @returns {Promise<void>}
   */
  async blendAnimations(character, blendConfig) {
    throw new Error('Method not implemented');
  }

  /**
   * Stop current animation
   * @param {Character} character
   */
  stopAnimation(character) {
    throw new Error('Method not implemented');
  }

  /**
   * Set up idle animation observers
   * @param {Character} character
   * @param {Function} onIdleEnd
   */
  setupIdleObservers(character, onIdleEnd) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove animation observers
   * @param {Character} character
   */
  removeObservers(character) {
    throw new Error('Method not implemented');
  }
}

/**
 * Morph Target Controller Interface
 * Defines contract for controlling facial animations
 */
export class IMorphTargetController {
  /**
   * Animate morph targets
   * @param {Character} character
   * @param {string} morphName
   * @param {number} targetValue
   * @param {number} duration
   */
  animateMorphTarget(character, morphName, targetValue, duration) {
    throw new Error('Method not implemented');
  }

  /**
   * Start automatic facial animations
   * @param {Character} character
   */
  startAutomaticFacialAnimations(character) {
    throw new Error('Method not implemented');
  }

  /**
   * Stop automatic facial animations
   * @param {Character} character
   */
  stopAutomaticFacialAnimations(character) {
    throw new Error('Method not implemented');
  }
}

/**
 * Scene Manager Interface
 * Defines contract for managing 3D scene
 */
export class ISceneManager {
  /**
   * Get the current scene
   * @returns {Scene}
   */
  getScene() {
    throw new Error('Method not implemented');
  }

  /**
   * Add shadow caster
   * @param {Mesh} mesh
   */
  addShadowCaster(mesh) {
    throw new Error('Method not implemented');
  }

  /**
   * Register before render callback
   * @param {Function} callback
   */
  registerBeforeRender(callback) {
    throw new Error('Method not implemented');
  }

  /**
   * Unregister before render callback
   * @param {Function} callback
   */
  unregisterBeforeRender(callback) {
    throw new Error('Method not implemented');
  }
}
