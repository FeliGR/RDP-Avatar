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

    // Debug: Log character mesh structure for debugging
    this._debugCharacterStructure(character);
    
    // Debug: Log animation target details
    this._debugAnimationTargets(animationGroup);

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
    
    character.setCurrentAnimation(animationGroup);

    // Debug: Set up a frame observer to verify animation is actually running
    if (animationGroup.isPlaying) {
      let frameCount = 0;
      const observer = this.scene.onBeforeRenderObservable.add(() => {
        frameCount++;
        if (frameCount % 60 === 0) { // Log every 60 frames (roughly every second at 60fps)
          this._debugAnimationProgress(animationGroup, frameCount);
        }
        if (frameCount > 300) { // Stop logging after 5 seconds
          this.scene.onBeforeRenderObservable.remove(observer);
        }
      });
    }

    return Promise.resolve();
  }

  /**
   * Debug character mesh and skeleton structure
   */
  _debugCharacterStructure(character) {
    console.log('=== CHARACTER DEBUG INFO ===');
    console.log('Character meshes:', character.meshes.length);
    
    character.meshes.forEach((mesh, index) => {
      console.log(`Mesh ${index}:`, {
        name: mesh.name,
        isVisible: mesh.isVisible,
        position: mesh.position,
        rotation: mesh.rotation,
        scaling: mesh.scaling,
        hasSkeleton: !!mesh.skeleton,
        skeletonBones: mesh.skeleton ? mesh.skeleton.bones.length : 0,
        hasTransformNodes: mesh.getChildTransformNodes ? mesh.getChildTransformNodes().length : 0
      });
      
      // Log skeleton details for the main mesh
      if (mesh.skeleton && mesh.skeleton.bones.length > 0) {
        console.log(`Skeleton bones for ${mesh.name}:`, 
          mesh.skeleton.bones.slice(0, 10).map(bone => ({
            name: bone.name,
            hasTransformation: !!bone.getTransformMatrix,
            isLinked: !!bone.linkedTransformNode
          }))
        );
      }
      
      // Log transform nodes
      if (mesh.getChildTransformNodes) {
        const transformNodes = mesh.getChildTransformNodes();
        if (transformNodes.length > 0) {
          console.log(`Transform nodes for ${mesh.name}:`, 
            transformNodes.slice(0, 10).map(node => ({
              name: node.name,
              position: node.position,
              rotation: node.rotation
            }))
          );
        }
      }
    });
  }

  /**
   * Debug animation targets in detail
   */
  _debugAnimationTargets(animationGroup) {
    console.log('=== ANIMATION TARGETS DEBUG ===');
    console.log('Animation group:', animationGroup.name);
    
    animationGroup.targetedAnimations.forEach((ta, index) => {
      const target = ta.target;
      const animation = ta.animation;
      
      console.log(`TargetedAnimation ${index}:`, {
        targetName: target?.name || 'no target',
        targetType: target?.constructor?.name,
        targetId: target?.id,
        animationName: animation?.name,
        animationProperty: animation?.targetProperty,
        animationDataType: animation?.dataType,
        animationKeys: animation?.getKeys()?.length || 0,
        firstKey: animation?.getKeys()?.[0],
        lastKey: animation?.getKeys()?.slice(-1)[0],
        isRunning: animation?.isRunning,
        currentFrame: animation?.currentFrame
      });
      
      // Check if target is actually part of the visible scene
      if (target) {
        console.log(`Target ${target.name} scene info:`, {
          isInScene: this.scene.meshes.includes(target) || this.scene.transformNodes?.includes(target),
          parent: target.parent?.name,
          isEnabled: target.isEnabled ? target.isEnabled() : 'not a node',
          isVisible: target.isVisible !== undefined ? target.isVisible : 'not applicable'
        });
      }
    });
  }

  /**
   * Debug animation progress during runtime
   */
  _debugAnimationProgress(animationGroup, frameCount) {
    const firstTA = animationGroup.targetedAnimations[0];
    if (firstTA) {
      console.log(`Animation ${animationGroup.name} progress (frame ${frameCount}):`, {
        isPlaying: animationGroup.isPlaying,
        weight: animationGroup.weight,
        currentFrame: firstTA.animation?.currentFrame,
        targetName: firstTA.target?.name,
        targetCurrentPosition: firstTA.target?.position,
        targetCurrentRotation: firstTA.target?.rotation,
        animationValue: this._getCurrentAnimationValue(firstTA.animation)
      });
    }
  }

  /**
   * Get current animation value for debugging
   */
  _getCurrentAnimationValue(animation) {
    try {
      if (animation && animation.currentFrame !== undefined) {
        // Try to evaluate the animation at current frame
        const keys = animation.getKeys();
        if (keys && keys.length > 0) {
          const currentFrame = animation.currentFrame;
          // Find the key closest to current frame
          const closestKey = keys.reduce((prev, curr) => 
            Math.abs(curr.frame - currentFrame) < Math.abs(prev.frame - currentFrame) ? curr : prev
          );
          return closestKey.value;
        }
      }
    } catch (error) {
      return 'error getting value';
    }
    return 'no value';
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
