import { LoadCharacterUseCase } from '../../application/usecases/LoadCharacterUseCase.js';
import { PlayIdleAnimationUseCase } from '../../application/usecases/PlayIdleAnimationUseCase.js';
import { PlayTalkingAnimationUseCase } from '../../application/usecases/PlayTalkingAnimationUseCase.js';

import { BabylonAnimationRepository } from '../repositories/BabylonAnimationRepository.js';
import { BabylonAnimationController } from '../controllers/BabylonAnimationController.js';
import { BabylonMorphTargetController } from '../controllers/BabylonMorphTargetController.js';
import { BabylonSceneManager } from '../services/BabylonSceneManager.js';
import { AudioAnalyzer } from '../services/AudioAnalyzer.js';

/**
 * Composition Root - Dependency Injection Container
 * Sets up all dependencies and provides configured use cases
 */
export class AnimationCompositionRoot {
  constructor(scene, shadowGenerator = null) {
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;
    
    // Initialize infrastructure services
    this._setupInfrastructure();
    
    // Initialize use cases
    this._setupUseCases();
  }

  _setupInfrastructure() {
    // Core services
    this.sceneManager = new BabylonSceneManager(this.scene, this.shadowGenerator);
    this.audioAnalyzer = new AudioAnalyzer(this.scene);
    
    // Repositories
    this.animationRepository = new BabylonAnimationRepository(this.scene);
    
    // Controllers
    this.animationController = new BabylonAnimationController(this.scene);
    this.morphTargetController = new BabylonMorphTargetController(this.scene);
  }

  _setupUseCases() {
    // Load Character Use Case
    this.loadCharacterUseCase = new LoadCharacterUseCase({
      animationRepository: this.animationRepository,
      sceneManager: this.sceneManager
    });

    // Play Idle Animation Use Case
    this.playIdleAnimationUseCase = new PlayIdleAnimationUseCase({
      animationController: this.animationController,
      morphTargetController: this.morphTargetController
    });

    // Play Talking Animation Use Case
    this.playTalkingAnimationUseCase = new PlayTalkingAnimationUseCase({
      animationController: this.animationController,
      morphTargetController: this.morphTargetController,
      audioAnalyzer: this.audioAnalyzer
    });
  }

  // Public API - Use Case accessors
  getLoadCharacterUseCase() {
    return this.loadCharacterUseCase;
  }

  getPlayIdleAnimationUseCase() {
    return this.playIdleAnimationUseCase;
  }

  getPlayTalkingAnimationUseCase() {
    return this.playTalkingAnimationUseCase;
  }

  // Infrastructure accessors (for advanced usage)
  getSceneManager() {
    return this.sceneManager;
  }

  getAudioAnalyzer() {
    return this.audioAnalyzer;
  }

  getAnimationController() {
    return this.animationController;
  }

  getMorphTargetController() {
    return this.morphTargetController;
  }

  // Cleanup
  dispose() {
    // Stop audio analysis
    if (this.audioAnalyzer) {
      this.audioAnalyzer.stop();
    }

    // Clean up scene manager
    if (this.sceneManager) {
      this.sceneManager.dispose();
    }

    // Clear references
    this.scene = null;
    this.shadowGenerator = null;
  }
}
