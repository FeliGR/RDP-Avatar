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
  } /**
   * EXACT animation blending like the reference JavaScript code
   * Simple, clean, and smooth - just like the reference
   */
    /**
   * UNIFIED animation blending - this is the ONLY method used for all transitions
   * Matches the reference code behavior exactly
   */
  *animationBlending(
    fromAnim,
    fromAnimSpeedRatio,
    toAnim,
    toAnimSpeedRatio,
    repeat,
    speed,
    toAnimFrameIn,
    toAnimFrameOut,
    maxWeight
  ) {
    if (!toAnimFrameIn) toAnimFrameIn = 0;
    if (!toAnimFrameOut) toAnimFrameOut = toAnim.duration;
    if (!maxWeight) maxWeight = 1;

    console.log(`[Animation Blend] ${fromAnim?.name || 'none'} → ${toAnim.name} (speed: ${speed}, maxWeight: ${maxWeight})`);

    let currentWeight = fromAnim ? 1 : 0; // Start with full weight on fromAnim
    let newWeight = 0; // Start with zero weight on toAnim
    
    // Handle case where there's no previous animation
    if (!fromAnim) {
      toAnim.start(repeat, toAnimSpeedRatio, toAnimFrameIn, toAnimFrameOut, false);
      toAnim.speedRatio = toAnimSpeedRatio;
      toAnim.setWeightForAllAnimatables(maxWeight);
      console.log(`[Animation Blend] No previous animation, starting ${toAnim.name} directly`);
      return;
    }
    
    // TRUE CROSS-FADE: Don't stop fromAnim - let both play during transition
    // 1) Keep fromAnim playing at full weight, start toAnim at zero weight
    if (!fromAnim.isPlaying) {
      fromAnim.start(true, fromAnimSpeedRatio, 0, fromAnim.duration, false);
    }
    fromAnim.setWeightForAllAnimatables(1);
    
    toAnim.start(repeat, toAnimSpeedRatio, toAnimFrameIn, toAnimFrameOut, false);
    toAnim.setWeightForAllAnimatables(0); // Start at zero weight
    
    // 2) Cross-fade: gradually shift weights while BOTH animations play
    while (newWeight < maxWeight) {
      newWeight = Math.min(maxWeight, newWeight + speed);
      currentWeight = Math.max(0, currentWeight - speed);
      
      toAnim.setWeightForAllAnimatables(newWeight);
      fromAnim.setWeightForAllAnimatables(currentWeight);
      
      yield; // Critical: yield control to render loop each frame
    }
    
    // 3) Only NOW stop the old animation after blend is complete
    toAnim.setWeightForAllAnimatables(maxWeight);
    if (currentWeight <= 0) {
      fromAnim.setWeightForAllAnimatables(0);
      fromAnim.stop(); // Stop AFTER the blend is done
    }
    
    console.log(`[Animation Blend] Completed transition to ${toAnim.name}`);
  }

  /**
   * UNIFIED method for ALL animation transitions
   */
  async playAnimationWithBlending(character, animationName, options = {}) {
    const targetAnimationGroup = character.getAnimationGroup(animationName);
    if (!targetAnimationGroup) {
      throw new Error(`Animation '${animationName}' not found`);
    }

    // Prevent duplicate transitions
    if (this.isBlendingToAnimation(animationName)) {
      return Promise.resolve();
    }

    const {
      isLooping = false,
      speedRatio = 1.0,
      frameStart = 0,
      frameEnd = null,
      transitionSpeed = 0.02, // Use reference code speed by default
      maxWeight = 1.0,
      animationOffset = 0,
    } = options;

    const currentAnimation = character.currentAnimation;
    const endFrame = frameEnd || targetAnimationGroup.to || targetAnimationGroup.duration;
    const adjustedFrameStart = frameStart + animationOffset;
    const adjustedFrameEnd = endFrame - animationOffset;

    // Skip if same animation
    if (currentAnimation === targetAnimationGroup) {
      return Promise.resolve();
    }

    // Track transition
    this.animationTransitions.set(animationName, {
      startTime: Date.now(),
      fromAnimation: currentAnimation?.name,
      toAnimation: animationName,
    });

    // Use our unified blending method
    return new Promise((resolve) => {
      this.scene.onBeforeRenderObservable
        .runCoroutineAsync(
          this.animationBlending(
            currentAnimation,
            speedRatio,
            targetAnimationGroup,
            speedRatio,
            isLooping,
            transitionSpeed,
            adjustedFrameStart,
            adjustedFrameEnd,
            maxWeight,
          ),
        )
        .then(() => {
          // Set currentAnimation after blending completes
          character.setCurrentAnimation(targetAnimationGroup);
          this.animationTransitions.delete(animationName);
          resolve();
        })
        .catch((error) => {
          console.error("[Animation] Error in blending:", error);
          this.animationTransitions.delete(animationName);
          resolve();
        });
    });
  }

  /**
   * Play animation with smooth blending transition
   */
  async playAnimationWithBlending(character, animationName, options = {}) {
    const targetAnimationGroup = character.getAnimationGroup(animationName);
    if (!targetAnimationGroup) {
      throw new Error(`Animation '${animationName}' not found`);
    }

    if (this.isBlendingToAnimation(animationName)) {
      return Promise.resolve();
    }

    const {
      isLooping = false,
      speedRatio = 1.0,
      frameStart = 0,
      frameEnd = null,
      transitionSpeed = 0.02,
      maxWeight = 1.0,
      animationOffset = 0,
    } = options;

    const currentAnimation = character.currentAnimation;
    const endFrame = frameEnd || targetAnimationGroup.to || targetAnimationGroup.duration;
    const adjustedFrameStart = frameStart + animationOffset;
    const adjustedFrameEnd = endFrame - animationOffset;

    if (currentAnimation === targetAnimationGroup) {
      return Promise.resolve();
    }

    this.animationTransitions.set(animationName, {
      startTime: Date.now(),
      fromAnimation: currentAnimation?.name,
      toAnimation: animationName,
    });

    return new Promise((resolve) => {
      this.scene.onBeforeRenderObservable
        .runCoroutineAsync(
          this.animationBlending(
            currentAnimation,
            speedRatio,
            targetAnimationGroup,
            speedRatio,
            isLooping,
            transitionSpeed,
            adjustedFrameStart,
            adjustedFrameEnd,
            maxWeight,
          ),
        )
        .then(() => {
          // Set currentAnimation after blending completes (like reference code)
          character.setCurrentAnimation(targetAnimationGroup);
          this.animationTransitions.delete(animationName);
          resolve();
        })
        .catch((error) => {
          console.error("[Animation] Error in blending coroutine:", error);
          this.animationTransitions.delete(animationName);
          resolve();
        });
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
   * Quick blend in for animations starting from 0 weight
   */
  *_quickBlendIn(targetAnimation, speed = 0.05) {
    let weight = 0;

    while (weight < 1) {
      weight += speed;
      weight = Math.min(weight, 1);

      try {
        targetAnimation.setWeightForAllAnimatables(weight);
      } catch (error) {
        console.warn("[Quick Blend] Error setting weight:", error);
        break;
      }

      yield;
    }

    try {
      targetAnimation.setWeightForAllAnimatables(1);
    } catch (error) {
      console.warn("[Quick Blend] Error setting final weight:", error);
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
