import { IAnimationController } from "../../domain/interfaces/index.js";

/**
 * Cross-fades two AnimationGroups using Babylon's timing system
 * Frame-rate independent and smooth
 */
function crossFadeAnimationGroups(
  scene,
  fromGroup,
  toGroup,
  duration,
  speedRatio = 1,
  onComplete = null,
  easing = null,
) {
  if (!fromGroup || !fromGroup.isPlaying) {
    toGroup.speedRatio = speedRatio;
    toGroup.start(true, speedRatio);
    toGroup.setWeightForAllAnimatables(1);
    if (onComplete) onComplete();
    return;
  }

  toGroup.speedRatio = speedRatio;
  toGroup.start(true, speedRatio);
  toGroup.setWeightForAllAnimatables(0);
  fromGroup.setWeightForAllAnimatables(1);

  const easingFunction =
    easing || ((t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2));

  const startTime = performance.now();
  const durationMs = duration * 1000;
  let observerRemoved = false;

  const onBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
    if (observerRemoved) return;

    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    const easedProgress = easingFunction(progress);

    try {
      fromGroup.setWeightForAllAnimatables(1 - easedProgress);
      toGroup.setWeightForAllAnimatables(easedProgress);

      if (progress >= 1) {
        observerRemoved = true;

        scene.onBeforeRenderObservable.remove(onBeforeRenderObserver);

        try {
          fromGroup.stop();
          toGroup.setWeightForAllAnimatables(1);
        } catch (error) {
          console.warn("[Babylon Cross-Fade] Error in final cleanup:", error);
        }

        if (onComplete) onComplete();
      }
    } catch (error) {
      console.warn("[Babylon Cross-Fade] Error updating weights:", error);

      if (!observerRemoved) {
        observerRemoved = true;
        scene.onBeforeRenderObservable.remove(onBeforeRenderObserver);
      }
      if (onComplete) onComplete();
    }
  });

  setTimeout(() => {
    if (!observerRemoved) {
      try {
        observerRemoved = true;
        scene.onBeforeRenderObservable.remove(onBeforeRenderObserver);
        fromGroup.stop();
        toGroup.setWeightForAllAnimatables(1);
        if (onComplete) onComplete();
      } catch (error) {
        console.warn("[Babylon Cross-Fade] Error in timeout cleanup:", error);
      }
    }
  }, durationMs + 100);
}

export class BabylonAnimationController extends IAnimationController {
  constructor(scene) {
    super();
    this.scene = scene;
    this.observers = new Map();
    this.animationTransitions = new Map();
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
    return this.playAnimationWithBlending(character, animationName, options);
  }

  async blendAnimations(character, blendConfig) {
    const { toAnimation, maxWeight } = blendConfig;
    return this.playAnimationWithBlending(character, toAnimation, {
      maxWeight,
      transitionDuration: 0.4,
    });
  }

  /**
   * Cross-fades two AnimationGroups using Babylon's native animation system.
   * Frame-rate independent and smooth.
   */
  async playAnimationWithBlending(character, animationName, options = {}) {
    const toGroup = character.getAnimationGroup(animationName);
    if (!toGroup) {
      throw new Error(`Animation '${animationName}' not found`);
    }

    if (this.animationTransitions.has(animationName)) {
      return Promise.resolve();
    }

    const { speedRatio = 1.0, transitionDuration = 0.4, easing = null } = options;

    const fromGroup = character.currentAnimation;

    if (fromGroup === toGroup) {
      return Promise.resolve();
    }

    this.removeObservers(character);

    this.animationTransitions.set(animationName, true);

    const easingFunction =
      easing || ((t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2));

    return new Promise((resolve) => {
      crossFadeAnimationGroups(
        this.scene,
        fromGroup,
        toGroup,
        transitionDuration,
        speedRatio,
        () => {
          character.setCurrentAnimation(toGroup);
          this.animationTransitions.delete(animationName);
          resolve();
        },
        easingFunction,
      );
    });
  }

  stopAnimation(character) {
    if (character.currentAnimation) {
      character.currentAnimation.stop();
      character.setCurrentAnimation(null);
    }
  }

  setupIdleObservers(character, onIdleEnd) {
    this.removeObservers(character);

    const currentAnimation = character.currentAnimation;
    if (!currentAnimation) {
      console.warn("[Idle Observer] No current animation to observe");
      return;
    }

    setTimeout(() => {
      if (character.currentAnimation !== currentAnimation) {
        return;
      }

      try {
        const observer = currentAnimation.onAnimationEndObservable.add(() => {
          if (character.currentAnimation === currentAnimation) {
            currentAnimation.onAnimationEndObservable.remove(observer);
            onIdleEnd(currentAnimation);
          } else {
            currentAnimation.onAnimationEndObservable.remove(observer);
          }
        });

        this.observers.set(character.id, [{ animGroup: currentAnimation, observer }]);
      } catch (error) {
        console.warn("[Idle Observer] Error setting up observer:", error);
      }
    }, 100);
  }

  removeObservers(character) {
    const characterObservers = this.observers.get(character.id);
    if (characterObservers) {
      characterObservers.forEach(({ animGroup, observer }) => {
        try {
          if (animGroup && observer) {
            animGroup.onAnimationEndObservable.remove(observer);
          }
        } catch (error) {
          console.warn(`[Idle Observer] Error removing observer:`, error);
        }
      });
      this.observers.delete(character.id);
    }
  }

  /**
   * Check if there are pending animation transitions
   */
  hasPendingTransitions() {
    return this.animationTransitions.size > 0;
  }

  /**
   * Check if an animation is currently being blended
   */
  isBlendingToAnimation(animationName) {
    return this.animationTransitions.has(animationName);
  }

  /**
   * Clear pending transitions (used in error cases)
   */
  clearPendingTransitions() {
    this.animationTransitions.clear();
  }
}
