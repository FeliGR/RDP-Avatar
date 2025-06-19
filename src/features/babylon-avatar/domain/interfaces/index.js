export class IAnimationRepository {
  async loadAnimations(animationPaths) {
    throw new Error("Method not implemented");
  }
  async loadCharacterModel(modelPath) {
    throw new Error("Method not implemented");
  }
  dispose(character) {
    throw new Error("Method not implemented");
  }
}

export class IAnimationController {
  playAnimation(character, animationName, options = {}) {
    throw new Error("Method not implemented");
  }
  async blendAnimations(character, blendConfig) {
    throw new Error("Method not implemented");
  }
  stopAnimation(character) {
    throw new Error("Method not implemented");
  }
  setupIdleObservers(character, onIdleEnd) {
    throw new Error("Method not implemented");
  }
  removeObservers(character) {
    throw new Error("Method not implemented");
  }
}

export class IMorphTargetController {
  animateMorphTarget(character, morphName, targetValue, duration) {
    throw new Error("Method not implemented");
  }
  startAutomaticFacialAnimations(character) {
    throw new Error("Method not implemented");
  }
  stopAutomaticFacialAnimations(character) {
    throw new Error("Method not implemented");
  }
}

export class ISceneManager {
  getScene() {
    throw new Error("Method not implemented");
  }
  addShadowCaster(mesh) {
    throw new Error("Method not implemented");
  }
  registerBeforeRender(callback) {
    throw new Error("Method not implemented");
  }
  unregisterBeforeRender(callback) {
    throw new Error("Method not implemented");
  }
}
