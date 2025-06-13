import { LoadCharacterUseCase } from "../../application/usecases/LoadCharacterUseCase.js";
import { PlayIdleAnimationUseCase } from "../../application/usecases/PlayIdleAnimationUseCase.js";
import { PlayTalkingAnimationUseCase } from "../../application/usecases/PlayTalkingAnimationUseCase.js";

import { BabylonAnimationRepository } from "../repositories/BabylonAnimationRepository.js";
import { BabylonAnimationController } from "../controllers/BabylonAnimationController.js";
import { BabylonMorphTargetController } from "../controllers/BabylonMorphTargetController.js";
import { BabylonSceneManager } from "../services/BabylonSceneManager.js";
import { AudioAnalyzer } from "../services/AudioAnalyzer.js";

/**
 * Composition Root - Dependency Injection Container
 * Sets up all dependencies and provides configured use cases
 */
export class AnimationCompositionRoot {
  constructor(scene, shadowGenerator = null) {
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;

    this._setupInfrastructure();

    this._setupUseCases();
  }

  _setupInfrastructure() {
    this.sceneManager = new BabylonSceneManager(this.scene, this.shadowGenerator);
    this.audioAnalyzer = new AudioAnalyzer(this.scene);

    this.animationRepository = new BabylonAnimationRepository(this.scene);

    this.animationController = new BabylonAnimationController(this.scene);
    this.morphTargetController = new BabylonMorphTargetController(this.scene);
  }

  _setupUseCases() {
    this.loadCharacterUseCase = new LoadCharacterUseCase({
      animationRepository: this.animationRepository,
      sceneManager: this.sceneManager,
    });

    this.playIdleAnimationUseCase = new PlayIdleAnimationUseCase({
      animationController: this.animationController,
      morphTargetController: this.morphTargetController,
    });

    this.playTalkingAnimationUseCase = new PlayTalkingAnimationUseCase({
      animationController: this.animationController,
      morphTargetController: this.morphTargetController,
      audioAnalyzer: this.audioAnalyzer,
    });
  }

  getLoadCharacterUseCase() {
    return this.loadCharacterUseCase;
  }

  getPlayIdleAnimationUseCase() {
    return this.playIdleAnimationUseCase;
  }

  getPlayTalkingAnimationUseCase() {
    return this.playTalkingAnimationUseCase;
  }

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

  dispose() {
    if (this.audioAnalyzer) {
      this.audioAnalyzer.stop();
    }

    if (this.sceneManager) {
      this.sceneManager.dispose();
    }

    this.scene = null;
    this.shadowGenerator = null;
  }
}
