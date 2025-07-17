/**
 * Speech-to-Text Service for Real-time Streaming Recognition
 * Handles communication with Socket.IO backend for streaming recognition
 */
import { io } from 'socket.io-client';

class STTService {
  constructor() {
    this.serverUrl = 'http://localhost:5003';
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
      model: 'latest_long'
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
        // Connect to Socket.IO server with STT namespace
        this.socket = io(`${this.serverUrl}/api/stt/stream`, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true
        });

        this.socket.on('connect', () => {
          console.log('✅ Connected to STT streaming server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.socket.on('disconnect', () => {
          console.log('❌ Disconnected from STT server');
          this.isConnected = false;
        });

        this.socket.on('ready', (data) => {
          console.log('📡 Server says:', data.message);
        });

        this.socket.on('interim_result', (data) => {
          console.log('📊 Interim result:', data.transcript || data.text || '', 'Confidence:', data.confidence);
          if (this.callbacks.onInterimResult) {
            this.callbacks.onInterimResult(data.transcript || data.text || '', data.confidence);
          }
        });

        this.socket.on('final_result', (data) => {
          console.log('📋 Final result:', {
            transcript: data.transcript || data.text || '',
            confidence: data.confidence,
            restartCount: data.restart_count,
            correctedTime: data.corrected_time
          });
          if (this.callbacks.onFinalResult) {
            this.callbacks.onFinalResult(
              data.transcript || data.text || '', 
              data.confidence,
              {
                restartCount: data.restart_count,
                correctedTime: data.corrected_time,
                wordTimestamps: data.wordTimestamps
              }
            );
          }
        });

        this.socket.on('end_of_utterance', () => {
          console.log('🔚 End of utterance');
          if (this.callbacks.onEnd) {
            this.callbacks.onEnd();
          }
        });

        this.socket.on('error', (data) => {
          console.error('❌ STT Error:', data.message);
          if (this.callbacks.onError) {
            this.callbacks.onError(data.message);
          }
        });

        this.socket.on('stopped', (data) => {
          console.log('⏹️ Streaming stopped:', data.message);
          this.isStreaming = false;
        });

        // Handle endless streaming events
        this.socket.on('stream_restart', (data) => {
          console.log('🔄 Stream restarted:', data.message, 'Restart count:', data.restart_count);
          if (this.callbacks.onStreamRestart) {
            this.callbacks.onStreamRestart(data.restart_count);
          }
          // Don't treat stream restarts as errors - they're normal behavior
          // Continue streaming seamlessly
        });

        this.socket.on('audio_bridging', (data) => {
          console.log('🌉 Audio bridging active:', data.message);
          if (this.callbacks.onAudioBridging) {
            this.callbacks.onAudioBridging();
          }
          // Audio bridging is happening to maintain context during restart
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
      throw new Error('Not connected to server');
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    this.socket.emit('config', { config: finalConfig });
    console.log('⚙️ Configuration sent to server');
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
      // Connect to server first
      if (!this.isConnected) {
        await this.connect();
      }

      // Configure the streaming
      this.configure(config);

      // Get microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.defaultConfig.sampleRateHertz,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('🎤 Audio stream obtained:', {
        tracks: this.audioStream.getTracks().length,
        trackSettings: this.audioStream.getTracks()[0]?.getSettings()
      });

      // Setup audio recording
      await this._setupAudioRecording();

      // Send start signal to server
      this.socket.emit('start');

      this.isStreaming = true;
      this.reconnectAttempts = 0;

      if (this.callbacks.onStart) {
        this.callbacks.onStart();
      }

      console.log("STT streaming started successfully");
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

    // Stop audio recording
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    // Stop audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    // Send stop signal to server
    if (this.isConnected && this.socket) {
      this.socket.emit('stop');
    }

    if (this.callbacks.onEnd) {
      this.callbacks.onEnd();
    }

    console.log("STT streaming stopped");
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
      // Create MediaRecorder with WebM Opus format
      const mimeType = 'audio/webm;codecs=opus';
      console.log('🎙️ Setting up MediaRecorder with:', mimeType);
      console.log('🎙️ MediaRecorder.isTypeSupported:', MediaRecorder.isTypeSupported(mimeType));
      
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: mimeType,
        audioBitsPerSecond: 16000
      });

      console.log('🎙️ MediaRecorder created:', {
        mimeType: this.mediaRecorder.mimeType,
        state: this.mediaRecorder.state
      });

      // Handle audio data chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.isStreaming && this.isConnected) {
          // Convert blob to array buffer and send to server
          event.data.arrayBuffer().then(arrayBuffer => {
            const audioArray = Array.from(new Uint8Array(arrayBuffer));
            this.socket.emit('audio', { data: audioArray });
          }).catch(error => {
            console.error('Error converting audio data:', error);
          });
        } else {
          console.warn('⚠️ Audio data not sent:', {
            size: event.data.size,
            isStreaming: this.isStreaming,
            isConnected: this.isConnected
          });
        }
      };

      this.mediaRecorder.onstart = () => {
        console.log('🎤 Recording started');
        this.isStreaming = true;
      };

      this.mediaRecorder.onstop = () => {
        console.log('🎤 Recording stopped');
        this.isStreaming = false;
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        if (this.callbacks.onError) {
          this.callbacks.onError(`Recording error: ${event.error.message}`);
        }
      };

      // Start recording with 100ms chunks
      this.mediaRecorder.start(100);

    } catch (error) {
      console.error('Failed to setup audio recording:', error);
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
      socketConnected: this.socket?.connected || false
    };
  }
}

export default STTService;
