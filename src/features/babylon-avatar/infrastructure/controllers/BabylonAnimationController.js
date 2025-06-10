import { IAnimationController } from '../../domain/interfaces/index.js';

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
    console.log('BabylonAnimationController.playAnimation called:', { animationName, options });
    
    const animationGroup = character.getAnimationGroup(animationName);
    if (!animationGroup) {
      console.error(`Animation '${animationName}' not found in character`);
      throw new Error(`Animation '${animationName}' not found`);
    }

    console.log('Found animation group:', animationGroup.name, 'targetedAnimations:', animationGroup.targetedAnimations.length);

    const { 
      isLooping = false, 
      speedRatio = 1.0,
      frameStart = 0,
      frameEnd = null
    } = options;

    animationGroup.speedRatio = speedRatio;
    console.log('Starting animation with params:', { isLooping, speedRatio, frameStart, frameEnd: frameEnd || animationGroup.duration });
    
    animationGroup.start(
      isLooping, 
      speedRatio, 
      frameStart, 
      frameEnd || animationGroup.duration, 
      false
    );

    console.log('Animation started, isPlaying:', animationGroup.isPlaying);
    console.log('Animation weight:', animationGroup.weight);
    console.log('Animation speed ratio:', animationGroup.speedRatio);
    console.log('Animation duration:', animationGroup.duration);
    console.log('Animation from/to frames:', animationGroup.from, 'to', animationGroup.to);
    
    // Log each targeted animation status
    animationGroup.targetedAnimations.forEach((ta, index) => {
      console.log(`TargetedAnimation ${index}:`, {
        target: ta.target?.name || 'no target',
        targetType: ta.target?.constructor?.name,
        animationName: ta.animation?.name,
        isRunning: ta.animation?.isRunning,
        currentFrame: ta.animation?.currentFrame,
        targetProperty: ta.animation?.targetProperty,
        dataType: ta.animation?.dataType
      });
    });
    
    // Debug: Log animation keys for first animation
    if (animationGroup.targetedAnimations.length > 0) {
      const firstAnim = animationGroup.targetedAnimations[0].animation;
      console.log('First animation keys sample:', firstAnim.getKeys()?.slice(0, 3));
    }
    
    character.setCurrentAnimation(animationGroup);

    // Debug: Set up a frame observer to verify animation is actually running
    if (animationGroup.isPlaying) {
      let frameCount = 0;
      const observer = this.scene.onBeforeRenderObservable.add(() => {
        frameCount++;
        if (frameCount % 60 === 0) { // Log every 60 frames (roughly every second at 60fps)
          const firstAnim = animationGroup.targetedAnimations[0];
          console.log(`Animation ${animationGroup.name} frame check:`, {
            isPlaying: animationGroup.isPlaying,
            currentFrame: firstAnim?.animation?.currentFrame,
            weight: animationGroup.weight,
            targetName: firstAnim?.target?.name,
            targetPosition: firstAnim?.target?.position,
            targetRotation: firstAnim?.target?.rotation
          });
        }
        if (frameCount > 180) { // Stop logging after 3 seconds
          this.scene.onBeforeRenderObservable.remove(observer);
        }
      });
    }

    return Promise.resolve();
  }

  async blendAnimations(character, blendConfig) {
    const { 
      fromAnimation, 
      toAnimation, 
      blendSpeed, 
      maxWeight,
      frameRange 
    } = blendConfig;

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

  * _animationBlendingCoroutine(
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
      'M_Standing_Idle_Variations_001',
      'M_Standing_Idle_Variations_002', 
      'M_Standing_Idle_Variations_003'
    ];

    const observers = [];

    idleAnimations.forEach(animName => {
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
