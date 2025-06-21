import { IAnimationController } from "../../domain/interfaces/index.js";

export class BabylonAnimationController extends IAnimationController {
  constructor(scene) {
    super();
    this.scene = scene;
    this.observers = new Map();
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
      false,
    );
    character.setCurrentAnimation(animationGroup);
    return Promise.resolve();
  }

  async playAnimationWithTransition(character, animationName, options = {}) {
    const targetAnimationGroup = character.getAnimationGroup(animationName);
    if (!targetAnimationGroup) {
      throw new Error(`Animation '${animationName}' not found`);
    }
    const {
      isLooping = false,
      speedRatio = 1.0,
      frameStart = 0,
      frameEnd = null,
      transitionDuration = 0.3,
    } = options;
    targetAnimationGroup.speedRatio = speedRatio;
    const endFrame = frameEnd || targetAnimationGroup.to || targetAnimationGroup.duration;
    const currentAnimation = character.currentAnimation;
    if (!currentAnimation || !currentAnimation.isPlaying) {
      this._resetAllAnimationWeights(character);
      targetAnimationGroup.start(isLooping, speedRatio, frameStart, endFrame, false);
      character.setCurrentAnimation(targetAnimationGroup);
      return Promise.resolve();
    }
    const blendSpeed = Math.max(0.008, Math.min(0.05, 1.0 / (transitionDuration * 60)));
    return new Promise((resolve) => {
      this.scene.onBeforeRenderObservable.runCoroutineAsync(
        this._smoothAnimationBlending(
          currentAnimation,
          targetAnimationGroup,
          blendSpeed,
          isLooping,
          speedRatio,
          frameStart,
          endFrame,
          character,
          resolve,
        ),
      );
    });
  }

  _resetAllAnimationWeights(character) {
    if (character.animationGroups) {
      character.animationGroups.forEach((animGroup) => {
        try {
          if (!animGroup.isPlaying) {
            animGroup.setWeightForAllAnimatables(1);
          }
        } catch (error) {
          console.warn("Error resetting animation group:", error);
        }
      });
    }
  }

  *_smoothAnimationBlending(
    fromAnim,
    toAnim,
    speed,
    isLooping,
    speedRatio,
    frameStart,
    frameEnd,
    character,
    onComplete,
  ) {
    let currentWeight = 1;
    let newWeight = 0;
    try {
      toAnim.start(isLooping, speedRatio, frameStart, frameEnd, false);
      fromAnim.speedRatio = speedRatio;
      toAnim.speedRatio = speedRatio;
      fromAnim.setWeightForAllAnimatables(1);
      toAnim.setWeightForAllAnimatables(0);
    } catch (error) {
      console.warn("Error setting up animation blending:", error);
    }
    while (newWeight < 1) {
      newWeight += speed;
      currentWeight -= speed;
      newWeight = Math.min(newWeight, 1);
      currentWeight = Math.max(currentWeight, 0);
      try {
        toAnim.setWeightForAllAnimatables(newWeight);
        fromAnim.setWeightForAllAnimatables(currentWeight);
      } catch (error) {
        console.warn("Error during animation blending:", error);
        break;
      }
      yield;
    }
    try {
      toAnim.setWeightForAllAnimatables(1);
      fromAnim.setWeightForAllAnimatables(0);
      setTimeout(() => {
        try {
          fromAnim.stop();
        } catch (error) {
          console.warn("Error stopping previous animation:", error);
        }
      }, 50);
    } catch (error) {
      console.warn("Error in final animation cleanup:", error);
    }
    character.setCurrentAnimation(toAnim);
    if (onComplete) {
      onComplete();
    }
  }

  async blendAnimations(character, blendConfig) {
    const { fromAnimation, toAnimation, blendSpeed, maxWeight, frameRange } = blendConfig;
    return new Promise((resolve) => {
      this.scene.onBeforeRenderObservable.runCoroutineAsync(
        this._animationBlendingCoroutine(
          fromAnimation,
          toAnimation,
          blendSpeed,
          maxWeight,
          frameRange,
          character,
          resolve,
        ),
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
    onComplete = null,
  ) {
    const frameIn = frameRange?.start || 0;
    const frameOut = frameRange?.end || toAnim.duration;
    let currentWeight = 1;
    let newWeight = 0;
    fromAnim.stop();
    toAnim.start(false, toAnim.speedRatio, frameIn, frameOut, false);
    while (newWeight < maxWeight) {
      newWeight += speed;
      currentWeight -= speed;
      toAnim.setWeightForAllAnimatables(newWeight);
      fromAnim.setWeightForAllAnimatables(currentWeight);
      yield;
    }
    if (character) {
      character.setCurrentAnimation(toAnim);
    }
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
