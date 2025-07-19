export class Animation {
  constructor({
    name,
    type,
    duration,
    speedRatio = 1.0,
    weight = 1.0,
    isLooping = false,
    frameRange = null,
  }) {
    this.name = name;
    this.type = type;
    this.duration = duration;
    this.speedRatio = speedRatio;
    this.weight = weight;
    this.isLooping = isLooping;
    this.frameRange = frameRange;
  }
}
