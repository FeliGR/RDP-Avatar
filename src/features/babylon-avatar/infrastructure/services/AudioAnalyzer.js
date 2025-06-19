import * as BABYLON from "babylonjs";

export class AudioAnalyzer {
  constructor(scene) {
    this.scene = scene;
    this.analyser = null;
    this.soundTrack = null;
    this.callbacks = new Set();
    this.isActive = false;
  }

  initialize(sound) {
    if (!sound) {
      throw new Error("Sound object is required");
    }
    this.soundTrack = new BABYLON.SoundTrack(this.scene);
    this.soundTrack.addSound(sound);
    this.analyser = new BABYLON.Analyser(this.scene);
    this.soundTrack.connectToAnalyser(this.analyser);
    this.analyser.FFT_SIZE = 64;
    this.analyser.SMOOTHING = 0.03;
    this.isActive = true;
    this._startAnalysis();
  }

  addCallback(callback) {
    if (typeof callback === "function") {
      this.callbacks.add(callback);
    }
  }

  removeCallback(callback) {
    this.callbacks.delete(callback);
  }

  _startAnalysis() {
    if (!this.analyser || !this.isActive) return;
    const analysisLoop = () => {
      if (!this.isActive || !this.analyser) return;
      try {
        const frequencyData = this.analyser.getByteFrequencyData();
        this.callbacks.forEach((callback) => {
          try {
            callback(frequencyData);
          } catch (error) {}
        });
        requestAnimationFrame(analysisLoop);
      } catch (error) {}
    };
    requestAnimationFrame(analysisLoop);
  }

  stop() {
    this.isActive = false;
    this.callbacks.clear();
    if (this.soundTrack) {
      this.soundTrack.dispose();
      this.soundTrack = null;
    }
    if (this.analyser) {
      this.analyser = null;
    }
  }

  isAnalyzing() {
    return this.isActive;
  }
}
