// Babylon Avatar Feature - Main exports
export { AnimationService } from './application/services/AnimationService.js';
export { AnimationCompositionRoot } from './infrastructure/composition/AnimationCompositionRoot.js';

// Domain entities
export { Character } from './domain/entities/Character.js';
export { Animation, AnimationBlend } from './domain/entities/Animation.js';

// Use cases
export { LoadCharacterUseCase } from './application/usecases/LoadCharacterUseCase.js';
export { PlayIdleAnimationUseCase } from './application/usecases/PlayIdleAnimationUseCase.js';
export { PlayTalkingAnimationUseCase } from './application/usecases/PlayTalkingAnimationUseCase.js';

// Infrastructure services (for advanced usage)
export { BabylonAnimationRepository } from './infrastructure/repositories/BabylonAnimationRepository.js';
export { BabylonAnimationController } from './infrastructure/controllers/BabylonAnimationController.js';
export { BabylonMorphTargetController } from './infrastructure/controllers/BabylonMorphTargetController.js';
export { BabylonSceneManager } from './infrastructure/services/BabylonSceneManager.js';
export { AudioAnalyzer } from './infrastructure/services/AudioAnalyzer.js';
