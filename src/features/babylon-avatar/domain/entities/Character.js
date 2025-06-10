/**
 * Character Entity - Core domain model
 * Represents a 3D character with animation capabilities
 */
export class Character {
  constructor({
    id,
    name,
    meshes = [],
    animationGroups = [],
    morphTargets = new Map(),
    isLoaded = false,
    isAnimating = false
  }) {
    this.id = id;
    this.name = name;
    this.meshes = meshes;
    this.animationGroups = animationGroups;
    this.morphTargets = morphTargets;
    this.isLoaded = isLoaded;
    this.isAnimating = isAnimating;
    this.currentAnimation = null;
  }

  // Domain business rules
  canPlayAnimation(animationName) {
    return this.isLoaded && this.hasAnimation(animationName);
  }

  hasAnimation(animationName) {
    // Make case-insensitive search
    const lowerAnimationName = animationName.toLowerCase();
    return this.animationGroups.some(group => 
      group.name.toLowerCase().includes(lowerAnimationName)
    );
  }

  hasMorphTarget(morphName) {
    return this.morphTargets.has(morphName);
  }

  getAnimationGroup(animationName) {
    const lowerAnimationName = animationName.toLowerCase();
    return this.animationGroups.find(group => 
      group.name.toLowerCase().includes(lowerAnimationName)
    );
  }

  getMorphTarget(morphName) {
    return this.morphTargets.get(morphName);
  }

  setCurrentAnimation(animation) {
    this.currentAnimation = animation;
    this.isAnimating = animation ? animation.isPlaying : false;
  }

  markAsLoaded() {
    this.isLoaded = true;
  }

  addAnimationGroup(animationGroup) {
    this.animationGroups.push(animationGroup);
  }

  addMorphTarget(name, morphTarget) {
    this.morphTargets.set(name, morphTarget);
  }
}
