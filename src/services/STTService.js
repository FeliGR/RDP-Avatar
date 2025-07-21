/**
 * Speech-to-Text Service for Real-time Streaming Recognition
 * Handles communication with Socket.IO backend for streaming recognition
 */
import { io } from "socket.io-client";

class STTService {
  constructor() {
    this.serverUrl = "http://localhost:5003";
    this.socket = null;
    this.isConnected = false;
    this.isStreaming = false;
    this.mediaRecorder = null;
    this.audioStream = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.callbacks = {
      onInterimResult: null,
      onFinalResult: null,
      onError: null,
      onEnd: null,
      onStart: null,
      onStreamRestart: null,
      onAudioBridging: null,
    };

    this.defaultConfig = {
      encoding: "WEBM_OPUS",
      sampleRateHertz: 48000,
      languageCode: "en-US",
      interimResults: true,
      singleUtterance: false,
      enableWordTimeOffsets: false,
      maxAlternatives: 1,
      enableAutomaticPunctuation: true,
      model: "latest_long",
    };
  }

  /**
   * Set callback functions for streaming events
   * @param {Object} callbacks - Object containing callback functions
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Check if Speech-to-Text service is available
   * @returns {Promise<boolean>} Service availability status
   */
  async checkAvailability() {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error("STT Service not available:", error);
      return false;
    }
  }

  /**
   * Connect to STT streaming server
   * @returns {Promise<boolean>} Connection success status
   */
  async connect() {
    if (this.isConnected) {
      return true;
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(`${this.serverUrl}/api/stt/stream`, {
          transports: ["websocket", "polling"],
          timeout: 10000,
          forceNew: true,
        });

        this.socket.on("connect", () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.socket.on("disconnect", () => {
          this.isConnected = false;
        });

        this.socket.on("interim_result", (data) => {
          if (this.callbacks.onInterimResult) {
            this.callbacks.onInterimResult(data.transcript || data.text || "", data.confidence);
          }
        });

        this.socket.on("final_result", (data) => {
          if (this.callbacks.onFinalResult) {
            this.callbacks.onFinalResult(data.transcript || data.text || "", data.confidence, {
              restartCount: data.restart_count,
              correctedTime: data.corrected_time,
              wordTimestamps: data.wordTimestamps,
            });
          }
        });

        this.socket.on("end_of_utterance", () => {
          if (this.callbacks.onEnd) {
            this.callbacks.onEnd();
          }
        });

        this.socket.on("error", (data) => {
          console.error("❌ STT Error:", data.message);
          if (this.callbacks.onError) {
            this.callbacks.onError(data.message);
          }
        });

        this.socket.on("stopped", (data) => {
          this.isStreaming = false;
        });

        this.socket.on("stream_restart", (data) => {
          if (this.callbacks.onStreamRestart) {
            this.callbacks.onStreamRestart(data.restart_count);
          }
        });

        this.socket.on("audio_bridging", (data) => {
          if (this.callbacks.onAudioBridging) {
            this.callbacks.onAudioBridging();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Configure streaming parameters
   * @param {Object} config - Configuration object
   */
  configure(config = {}) {
    if (!this.isConnected) {
      throw new Error("Not connected to server");
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    this.socket.emit("config", { config: finalConfig });
  }

  /**
   * Start real-time speech recognition streaming
   * @param {Object} config - Configuration object for recognition
   * @returns {Promise<boolean>} Success status
   */
  async startStreaming(config = {}) {
    if (this.isStreaming) {
      console.warn("STT streaming is already active");
      return false;
    }

    try {
      if (!this.isConnected) {
        await this.connect();
      }

      this.configure(config);

      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.defaultConfig.sampleRateHertz,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      await this._setupAudioRecording();

      this.socket.emit("start");

      this.isStreaming = true;
      this.reconnectAttempts = 0;

      if (this.callbacks.onStart) {
        this.callbacks.onStart();
      }

      return true;
    } catch (error) {
      console.error("Failed to start STT streaming:", error);
      await this.stopStreaming();

      if (this.callbacks.onError) {
        this.callbacks.onError(error.message);
      }

      return false;
    }
  }

  /**
   * Stop real-time speech recognition streaming
   */
  async stopStreaming() {
    if (!this.isStreaming) {
      return;
    }

    this.isStreaming = false;

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    if (this.isConnected && this.socket) {
      this.socket.emit("stop");
    }

    if (this.callbacks.onEnd) {
      this.callbacks.onEnd();
    }
  }

  /**
   * Disconnect from the STT server
   */
  disconnect() {
    this.stopStreaming();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
  }

  /**
   * Setup audio recording for streaming
   * @private
   */
  async _setupAudioRecording() {
    try {
      const mimeType = "audio/webm;codecs=opus";

      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: mimeType,
        audioBitsPerSecond: 16000,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.isStreaming && this.isConnected) {
          event.data
            .arrayBuffer()
            .then((arrayBuffer) => {
              const audioArray = Array.from(new Uint8Array(arrayBuffer));
              this.socket.emit("audio", { data: audioArray });
            })
            .catch((error) => {
              console.error("Error converting audio data:", error);
            });
        }
      };

      this.mediaRecorder.onstart = () => {
        this.isStreaming = true;
      };

      this.mediaRecorder.onstop = () => {
        this.isStreaming = false;
      };

      this.mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        if (this.callbacks.onError) {
          this.callbacks.onError(`Recording error: ${event.error.message}`);
        }
      };

      this.mediaRecorder.start(100);
    } catch (error) {
      console.error("Failed to setup audio recording:", error);
      throw error;
    }
  }

  /**
   * Check if currently streaming
   * @returns {boolean} Streaming status
   */
  isCurrentlyStreaming() {
    return this.isStreaming;
  }

  /**
   * Get current stream status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isStreaming: this.isStreaming,
      isConnected: this.isConnected,
      hasAudioStream: !!this.audioStream,
      socketConnected: this.socket?.connected || false,
    };
  }
}

export default STTService;
