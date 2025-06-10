import { ISceneManager } from '../../domain/interfaces/index.js';

/**
 * Babylon.js implementation of Scene Manager
 */
export class BabylonSceneManager extends ISceneManager {
  constructor(scene, shadowGenerator = null) {
    super();
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;
    this.beforeRenderCallbacks = new Set();
  }

  getScene() {
    return this.scene;
  }

  addShadowCaster(mesh) {
    if (this.shadowGenerator && mesh) {
      this.shadowGenerator.addShadowCaster(mesh);
    }
  }

  registerBeforeRender(callback) {
    if (callback && typeof callback === 'function') {
      this.beforeRenderCallbacks.add(callback);
      this.scene.registerBeforeRender(callback);
    }
  }

  unregisterBeforeRender(callback) {
    if (this.beforeRenderCallbacks.has(callback)) {
      this.scene.unregisterBeforeRender(callback);
      this.beforeRenderCallbacks.delete(callback);
    }
  }

  dispose() {
    // Clean up all registered callbacks
    this.beforeRenderCallbacks.forEach(callback => {
      this.scene.unregisterBeforeRender(callback);
    });
    this.beforeRenderCallbacks.clear();
  }
}
