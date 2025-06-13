import * as BABYLON from "babylonjs";

/**
 * Audio Analyzer for real-time audio processing
 * Used for lip-sync and audio-reactive animations
 */
export class AudioAnalyzer {
  constructor(scene) {
    this.scene = scene;
    this.analyser = null;
    this.soundTrack = null;
    this.callbacks = new Set();
    this.isActive = false;
  }

  /**
   * Initialize audio analyzer with a sound source
   * @param {BABYLON.Sound} sound - Babylon sound object
   */
  initialize(sound) {
    if (!sound) {
      throw new Error("Sound object is required");
    }

    // Create sound track and connect to analyzer
    this.soundTrack = new BABYLON.SoundTrack(this.scene);
    this.soundTrack.addSound(sound);

    // Create analyzer
    this.analyser = new BABYLON.Analyser(this.scene);
    this.soundTrack.connectToAnalyser(this.analyser);

    // Configure analyzer settings
    this.analyser.FFT_SIZE = 64;
    this.analyser.SMOOTHING = 0.03;

    this.isActive = true;
    this._startAnalysis();
  }

  /**
   * Add callback for frequency data updates
   * @param {Function} callback - Function to call with frequency data
   */
  addCallback(callback) {
    if (typeof callback === "function") {
      this.callbacks.add(callback);
    }
  }

  /**
   * Remove callback
   * @param {Function} callback - Callback to remove
   */
  removeCallback(callback) {
    this.callbacks.delete(callback);
  }

  /**
   * Start frequency analysis loop
   */
  _startAnalysis() {
    if (!this.analyser || !this.isActive) return;

    const analysisLoop = () => {
      if (!this.isActive || !this.analyser) return;

      try {
        const frequencyData = this.analyser.getByteFrequencyData();

        // Notify all callbacks
        this.callbacks.forEach((callback) => {
          try {
            callback(frequencyData);
          } catch (error) {
            // Silently handle callback errors
          }
        });

        // Schedule next analysis
        requestAnimationFrame(analysisLoop);
      } catch (error) {
        // Silently handle analysis errors
      }
    };

    // Start the loop
    requestAnimationFrame(analysisLoop);
  }

  /**
   * Stop audio analysis
   */
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

  /**
   * Check if analyzer is currently active
   */
  isAnalyzing() {
    return this.isActive;
  }
}
