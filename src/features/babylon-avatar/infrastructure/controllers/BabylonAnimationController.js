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
   * Animation blending coroutine similar to the JavaScript example
   * This provides smooth transitions between animations
   */
  *animationBlendingCoroutine(
    fromAnim,
    fromAnimSpeedRatio,
    toAnim,
    toAnimSpeedRatio,
    repeat,
    speed,
    toAnimFrameIn,
    toAnimFrameOut,
    maxWeight,
    character,
  ) {
    console.log(
      `[Animation Blending] Starting transition from ${fromAnim?.name || "none"} to ${toAnim?.name} with speed: ${speed}`,
    );

    if (!toAnimFrameIn) toAnimFrameIn = 0;
    if (!toAnimFrameOut) toAnimFrameOut = toAnim.to || toAnim.duration;
    if (!maxWeight) maxWeight = 1;

    let currentWeight = fromAnim ? 1 : 0; 
    let newWeight = 0;
    let blendSteps = 0;

    try {
      
      if (fromAnim) {
        fromAnim.stop();
        fromAnim.speedRatio = fromAnimSpeedRatio;
      }

      toAnim.start(repeat, toAnimSpeedRatio, toAnimFrameIn, toAnimFrameOut, false);
      toAnim.speedRatio = toAnimSpeedRatio;

      
      if (fromAnim) {
        fromAnim.setWeightForAllAnimatables(currentWeight);
      }
      toAnim.setWeightForAllAnimatables(newWeight);

      
      while (newWeight < maxWeight) {
        newWeight += speed;
        if (fromAnim) {
          currentWeight -= speed;
        }
        blendSteps++;

        
        newWeight = Math.min(newWeight, maxWeight);
        currentWeight = Math.max(currentWeight, 0);

        try {
          toAnim.setWeightForAllAnimatables(newWeight);
          if (fromAnim) {
            fromAnim.setWeightForAllAnimatables(currentWeight);
          }

          
          if (blendSteps % 20 === 0) {
            console.log(
              `[Animation Blending] Step ${blendSteps}: new weight: ${newWeight.toFixed(3)}${fromAnim ? `, old weight: ${currentWeight.toFixed(3)}` : ""}`,
            );
          }
        } catch (error) {
          console.warn("[Animation Blending] Error setting animation weights:", error);
          break;
        }

        yield;
      }

      console.log(`[Animation Blending] Completed in ${blendSteps} steps`);

      
      try {
        toAnim.setWeightForAllAnimatables(maxWeight);
        if (fromAnim) {
          fromAnim.setWeightForAllAnimatables(0);
        }
      } catch (error) {
        console.warn("[Animation Blending] Error setting final weights:", error);
      }

      
      if (character) {
        character.setCurrentAnimation(toAnim);
      }

      console.log(`[Animation Blending] Transition complete to ${toAnim?.name}`);
    } catch (error) {
      console.error("[Animation Blending] Critical error during blending:", error);
      
      try {
        toAnim.start(repeat, toAnimSpeedRatio, toAnimFrameIn, toAnimFrameOut, false);
        toAnim.setWeightForAllAnimatables(maxWeight);
        if (character) {
          character.setCurrentAnimation(toAnim);
        }
      } catch (fallbackError) {
        console.error("[Animation Blending] Fallback failed:", fallbackError);
      }
    }
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
      console.log(`[Animation] Already blending to ${animationName}, skipping duplicate request`);
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

    
    console.log(
      `[Animation] Blending to ${animationName} from ${currentAnimation?.name || "none"}`,
    );

    
    if (currentAnimation === targetAnimationGroup) {
      console.log(`[Animation] Animation ${animationName} is already playing`);
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
          this.animationBlendingCoroutine(
            currentAnimation, 
            speedRatio,
            targetAnimationGroup,
            speedRatio,
            isLooping,
            transitionSpeed,
            adjustedFrameStart,
            adjustedFrameEnd,
            maxWeight,
            character,
          ),
        )
        .then(() => {
          
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
        console.log(
          `[Idle Observer] Animation changed before observer setup (${currentAnimation.name} -> ${character.currentAnimation?.name}), skipping`,
        );
        return;
      }

      try {
        const observer = currentAnimation.onAnimationEndObservable.add(() => {
          
          if (character.currentAnimation === currentAnimation) {
            console.log(
              `[Idle Observer] Current animation ${currentAnimation.name} ended, triggering callback`,
            );
            
            currentAnimation.onAnimationEndObservable.remove(observer);
            onIdleEnd(currentAnimation);
          } else {
            console.log(
              `[Idle Observer] Old animation ${currentAnimation.name} ended, but it's no longer current (${character.currentAnimation?.name}) - ignoring`,
            );
            
            currentAnimation.onAnimationEndObservable.remove(observer);
          }
        });

        this.observers.set(character.id, [{ animGroup: currentAnimation, observer }]);
        console.log(
          `[Idle Observer] Set up observer for current animation: ${currentAnimation.name}`,
        );
      } catch (error) {
        console.warn("[Idle Observer] Error setting up observer:", error);
      }
    }, 100);
  }

  removeObservers(character) {
    const characterObservers = this.observers.get(character.id);
    if (characterObservers) {
      console.log(
        `[Idle Observer] Removing ${characterObservers.length} observers for character ${character.id}`,
      );
      characterObservers.forEach(({ animGroup, observer }) => {
        try {
          if (animGroup && observer) {
            animGroup.onAnimationEndObservable.remove(observer);
            console.log(`[Idle Observer] Removed observer for ${animGroup.name}`);
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
