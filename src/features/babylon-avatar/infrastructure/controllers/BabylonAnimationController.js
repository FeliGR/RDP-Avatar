import { IAnimationController } from "../../domain/interfaces/index.js";

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
   * Cross-fades two AnimationGroups over exactly transitionDuration seconds.
   * Time-based cross-fade that's frame-rate independent.
   */
  async playAnimationWithBlending(character, animationName, options = {}) {
    const target = character.getAnimationGroup(animationName);
    if (!target) {
      throw new Error(`Animation '${animationName}' not found`);
    }

    if (this.animationTransitions.has(animationName)) {
      return Promise.resolve();
    }

    const {
      isLooping = false,
      speedRatio = 1.0,
      transitionDuration = 0.4,
      maxWeight = 1.0,
      frameStart = 0,
      frameEnd = null,
    } = options;

    const from = character.currentAnimation;
    const endFrame = frameEnd ?? target.to ?? target.duration;

    if (!from || !from.isPlaying) {
      target.speedRatio = speedRatio;
      target.start(isLooping, speedRatio, frameStart, endFrame, false);
      target.setWeightForAllAnimatables(maxWeight);
      character.setCurrentAnimation(target);
      return Promise.resolve();
    }

    if (from === target) {
      return Promise.resolve();
    }

    this.removeObservers(character);

    return new Promise((resolve) => {
      this.animationTransitions.set(animationName, true);

      const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

      const startTime = performance.now();
      const durationMs = transitionDuration * 1000;

      console.log(
        `[Time-Based Blend] ${from?.name || "none"} → ${target.name} (${transitionDuration}s)`,
      );

      from.setWeightForAllAnimatables(1);
      target.speedRatio = speedRatio;
      target.start(isLooping, speedRatio, frameStart, endFrame, false);
      target.setWeightForAllAnimatables(0);

      const onFrame = () => {
        const now = performance.now();
        const tRaw = Math.min(1, (now - startTime) / durationMs);
        const tEased = easeInOutCubic(tRaw);

        try {
          target.setWeightForAllAnimatables(maxWeight * tEased);
          from.setWeightForAllAnimatables(1 - tEased);
        } catch (error) {
          console.warn("[Time-Based Blend] Error setting weights:", error);
          this.scene.onBeforeRenderObservable.removeCallback(onFrame);
          this.animationTransitions.delete(animationName);
          resolve();
          return;
        }

        if (tRaw >= 1) {
          this.scene.onBeforeRenderObservable.removeCallback(onFrame);
          try {
            from.stop();
            target.setWeightForAllAnimatables(maxWeight);
            character.setCurrentAnimation(target);
            console.log(`[Time-Based Blend] Completed transition to ${target.name}`);
          } catch (error) {
            console.warn("[Time-Based Blend] Error in cleanup:", error);
          }

          this.animationTransitions.delete(animationName);
          resolve();
        }
      };

      this.scene.onBeforeRenderObservable.add(onFrame);
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
