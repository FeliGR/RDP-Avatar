import { ISceneManager } from "../../domain/interfaces/index.js";
import { OfficeEnvironmentService } from "./OfficeEnvironmentService.js";

/**
 * Babylon.js implementation of Scene Manager
 */
export class BabylonSceneManager extends ISceneManager {
  constructor(scene, shadowGenerator = null) {
    super();
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;
    this.beforeRenderCallbacks = new Set();
    this.officeEnvironment = new OfficeEnvironmentService(scene, shadowGenerator);
    this.environmentInitialized = false;
  }

  getScene() {
    return this.scene;
  }

  /**
   * Initialize office environment
   */
  async initializeOfficeEnvironment() {
    if (!this.environmentInitialized) {
      const result = await this.officeEnvironment.initializeEnvironment();
      if (result.success) {
        this.environmentInitialized = true;
      }
      return result;
    }
    return { success: true };
  }

  /**
   * Start office environment animations
   */
  startOfficeAnimations() {
    if (this.environmentInitialized) {
      this.officeEnvironment.startSphereAnimations();
    }
  }

  /**
   * Control video playback
   */
  playVideo() {
    if (this.environmentInitialized) {
      this.officeEnvironment.playVideo();
    }
  }

  pauseVideo() {
    if (this.environmentInitialized) {
      this.officeEnvironment.pauseVideo();
    }
  }

  addShadowCaster(mesh) {
    if (this.shadowGenerator && mesh) {
      this.shadowGenerator.addShadowCaster(mesh);
    }
  }

  registerBeforeRender(callback) {
    if (callback && typeof callback === "function") {
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
    // Dispose office environment
    if (this.officeEnvironment) {
      this.officeEnvironment.dispose();
    }

    this.beforeRenderCallbacks.forEach((callback) => {
      this.scene.unregisterBeforeRender(callback);
    });
    this.beforeRenderCallbacks.clear();
  }
}
