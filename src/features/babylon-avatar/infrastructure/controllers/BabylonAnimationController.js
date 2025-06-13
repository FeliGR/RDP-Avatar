import { IAnimationController } from "../../domain/interfaces/index.js";

/**
 * Babylon.js implementation of Animation Controller
 */
export class BabylonAnimationController extends IAnimationController {
  constructor(scene) {
    super();
    this.scene = scene;
    this.observers = new Map(); // Store observers by character
  }

  playAnimation(character, animationName, options = {}) {
    const animationGroup = character.getAnimationGroup(animationName);
    if (!animationGroup) {
      throw new Error(`Animation '${animationName}' not found`);
    }

    const { isLooping = false, speedRatio = 1.0, frameStart = 0, frameEnd = null } = options;

    animationGroup.speedRatio = speedRatio;

    animationGroup.start(
      isLooping,
      speedRatio,
      frameStart,
      frameEnd || animationGroup.duration,
      false
    );

    character.setCurrentAnimation(animationGroup);

    return Promise.resolve();
  }

  async blendAnimations(character, blendConfig) {
    const { fromAnimation, toAnimation, blendSpeed, maxWeight, frameRange } = blendConfig;

    return new Promise((resolve) => {
      // Start the blend coroutine
      this.scene.onBeforeRenderObservable.runCoroutineAsync(
        this._animationBlendingCoroutine(
          fromAnimation,
          toAnimation,
          blendSpeed,
          maxWeight,
          frameRange,
          character,
          resolve
        )
      );
    });
  }

  *_animationBlendingCoroutine(
    fromAnim,
    toAnim,
    speed,
    maxWeight = 1,
    frameRange = null,
    character = null,
    onComplete = null
  ) {
    const frameIn = frameRange?.start || 0;
    const frameOut = frameRange?.end || toAnim.duration;

    let currentWeight = 1;
    let newWeight = 0;

    // Stop and restart animations
    fromAnim.stop();
    toAnim.start(false, toAnim.speedRatio, frameIn, frameOut, false);

    while (newWeight < maxWeight) {
      newWeight += speed;
      currentWeight -= speed;

      toAnim.setWeightForAllAnimatables(newWeight);
      fromAnim.setWeightForAllAnimatables(currentWeight);

      yield;
    }

    // Update character state
    if (character) {
      character.setCurrentAnimation(toAnim);
    }

    // Call completion callback
    if (onComplete) {
      onComplete();
    }
  }

  stopAnimation(character) {
    if (character.currentAnimation) {
      character.currentAnimation.stop();
      character.setCurrentAnimation(null);
    }
  }

  setupIdleObservers(character, onIdleEnd) {
    // Remove existing observers first
    this.removeObservers(character);

    const idleAnimations = [
      "M_Standing_Idle_Variations_001",
      "M_Standing_Idle_Variations_002",
      "M_Standing_Idle_Variations_003",
    ];

    const observers = [];

    idleAnimations.forEach((animName) => {
      const animGroup = character.getAnimationGroup(animName);
      if (animGroup) {
        const observer = animGroup.onAnimationEndObservable.add(() => {
          onIdleEnd(animGroup);
        });
        observers.push({ animGroup, observer });
      }
    });

    // Store observers for later cleanup
    this.observers.set(character.id, observers);
  }

  removeObservers(character) {
    const characterObservers = this.observers.get(character.id);
    if (characterObservers) {
      characterObservers.forEach(({ animGroup, observer }) => {
        animGroup.onAnimationEndObservable.remove(observer);
        animGroup.stop();
      });
      this.observers.delete(character.id);
    }
  }
}
