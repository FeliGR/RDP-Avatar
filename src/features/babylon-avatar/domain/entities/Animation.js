/**
 * Animation Value Object - Represents animation properties and state
 */
export class Animation {
  constructor({
    name,
    type,
    duration,
    speedRatio = 1.0,
    weight = 1.0,
    isLooping = false,
    frameRange = null
  }) {
    this.name = name;
    this.type = type; // 'idle', 'talking', 'expression', 'dance', etc.
    this.duration = duration;
    this.speedRatio = speedRatio;
    this.weight = weight;
    this.isLooping = isLooping;
    this.frameRange = frameRange;
  }

  static createIdle(name, duration) {
    return new Animation({
      name,
      type: 'idle',
      duration,
      isLooping: true
    });
  }

  static createTalking(name, duration) {
    return new Animation({
      name,
      type: 'talking',
      duration,
      isLooping: false,
      weight: 0.75
    });
  }

  static createExpression(name, duration) {
    return new Animation({
      name,
      type: 'expression',
      duration,
      isLooping: false
    });
  }
}

/**
 * Animation Blending Configuration
 */
export class AnimationBlend {
  constructor({
    fromAnimation,
    toAnimation,
    blendSpeed = 0.02,
    maxWeight = 1.0,
    frameRange = null
  }) {
    this.fromAnimation = fromAnimation;
    this.toAnimation = toAnimation;
    this.blendSpeed = blendSpeed;
    this.maxWeight = maxWeight;
    this.frameRange = frameRange;
  }
}
