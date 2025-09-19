/**
 * Mobile Voice Activation Service
 * Lightweight voice activation using Web Speech API for mobile devices
 * Fallback when WASM-based Whisper service fails due to memory constraints
 */

import { getDeviceCapabilities } from '../utils/mobileDetection';

class MobileVoiceActivationService {
  constructor() {
    this.mediaStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.isListening = false;
    this.isProcessing = false;
    this.speechRecognition = null;
    this.wakeWord = 'hey buddy';
    this.callbacks = {
      onWakeWordDetected: null,
      onAudioLevelChange: null,
      onError: null,
      onStatusChange: null
    };
    
    // Mobile-specific settings
    this.capabilities = getDeviceCapabilities();
    this.useWebSpeechAPI = this.capabilities.supportsWebSpeechAPI;
    this.useAudioLevelMonitoring = this.capabilities.supportsAudioContext;
  }

  /**
   * Initialize the mobile voice activation service
   */
  async initialize() {
    try {
      console.log('Initializing mobile voice activation service...');
      
      // Request microphone access with mobile-optimized settings
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Lower sample rate for mobile
          channelCount: 1, // Mono audio
          latency: 0.1 // Higher latency for mobile stability
        }
      });

      // Initialize Web Speech API if available
      if (this.useWebSpeechAPI) {
        await this.initializeWebSpeechAPI();
      }

      // Initialize audio context for level monitoring (if supported)
      if (this.useAudioLevelMonitoring) {
        await this.initializeAudioContext();
      }

      this.notifyStatusChange('ready');
      console.log('Mobile voice activation service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize mobile voice activation:', error);
      this.notifyError(`Failed to initialize mobile voice activation: ${error.message}`);
      return false;
    }
  }

  /**
   * Initialize Web Speech API for wake word detection
   */
  async initializeWebSpeechAPI() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error('Web Speech API not supported');
      }

      this.speechRecognition = new SpeechRecognition();
      
      // Configure for mobile optimization
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'en-US';
      this.speechRecognition.maxAlternatives = 1;
      
      // Mobile-specific optimizations
      if (this.capabilities.isMobile) {
        this.speechRecognition.maxAlternatives = 1; // Reduce processing
      }

      // Set up event handlers
      this.speechRecognition.onresult = (event) => {
        this.handleSpeechResult(event);
      };

      this.speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.notifyError(`Speech recognition error: ${event.error}`);
      };

      this.speechRecognition.onend = () => {
        // Restart recognition if we're still listening
        if (this.isListening) {
          setTimeout(() => {
            if (this.isListening && this.speechRecognition) {
              this.speechRecognition.start();
            }
          }, 100);
        }
      };

      console.log('Web Speech API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Web Speech API:', error);
      this.useWebSpeechAPI = false;
    }
  }

  /**
   * Initialize audio context for level monitoring
   */
  async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000 // Lower sample rate for mobile
      });
      
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Mobile-optimized analyser settings
      this.analyser.fftSize = 128; // Smaller FFT for mobile
      this.analyser.smoothingTimeConstant = 0.8;
      this.microphone.connect(this.analyser);

      console.log('Audio context initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      this.useAudioLevelMonitoring = false;
    }
  }

  /**
   * Start listening for wake words
   */
  async startListening() {
    if (this.isListening) return false;

    try {
      this.isListening = true;
      this.notifyStatusChange('listening');

      // Resume audio context if suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Start Web Speech API recognition
      if (this.useWebSpeechAPI && this.speechRecognition) {
        this.speechRecognition.start();
      }

      // Start audio level monitoring
      if (this.useAudioLevelMonitoring) {
        this.startAudioLevelMonitoring();
      }

      console.log('Mobile voice activation started');
      return true;
    } catch (error) {
      console.error('Failed to start mobile voice activation:', error);
      this.notifyError(`Failed to start listening: ${error.message}`);
      return false;
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    this.isListening = false;
    this.isProcessing = false;
    this.notifyStatusChange('ready');

    // Stop Web Speech API
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }

    // Stop audio level monitoring
    this.stopAudioLevelMonitoring();
  }

  /**
   * Handle speech recognition results
   */
  handleSpeechResult(event) {
    if (!this.isListening) return;

    try {
      let finalTranscript = '';
      let interimTranscript = '';

      // Process results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Check for wake word in both final and interim results
      const combinedTranscript = (finalTranscript + interimTranscript).toLowerCase();
      
      if (this.checkForWakeWord(combinedTranscript)) {
        console.log(`🎤 Mobile: Wake word detected in: "${combinedTranscript}"`);
        this.notifyStatusChange('wake_word_detected');
        this.notifyWakeWordDetected('Hey Buddy', combinedTranscript);
      }
    } catch (error) {
      console.error('Error handling speech result:', error);
    }
  }

  /**
   * Check for wake word variations
   */
  checkForWakeWord(transcript) {
    const wakeWordVariations = [
      'hey buddy',
      'hey bud',
      'buddy',
      'hey',
      'buddy hey'
    ];

    return wakeWordVariations.some(variation => 
      transcript.includes(variation)
    );
  }

  /**
   * Start audio level monitoring (mobile-optimized)
   */
  startAudioLevelMonitoring() {
    if (!this.analyser || !this.useAudioLevelMonitoring) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const timeDataArray = new Float32Array(bufferLength);
    
    // Mobile-optimized smoothing
    let smoothedLevel = 0.05;
    const smoothingFactor = 0.7; // Less smoothing for more responsive UI
    
    const monitor = () => {
      if (!this.isListening) {
        // Gradual fade when not listening
        smoothedLevel = smoothedLevel * 0.9 + 0.05 * 0.1;
        this.notifyAudioLevelChange(smoothedLevel);
        requestAnimationFrame(monitor);
        return;
      }

      try {
        this.analyser.getFloatTimeDomainData(timeDataArray);
        
        // Calculate RMS (simplified for mobile)
        let rmsSum = 0;
        for (let i = 0; i < timeDataArray.length; i++) {
          const sample = timeDataArray[i];
          rmsSum += sample * sample;
        }
        const rms = Math.sqrt(rmsSum / timeDataArray.length);
        
        // Apply smoothing
        smoothedLevel = smoothedLevel * smoothingFactor + rms * (1 - smoothingFactor);
        
        // Ensure reasonable bounds
        smoothedLevel = Math.max(0.05, Math.min(1.0, smoothedLevel));
        
        this.notifyAudioLevelChange(smoothedLevel);
        requestAnimationFrame(monitor);
      } catch (error) {
        console.error('Error in mobile audio monitoring:', error);
        requestAnimationFrame(monitor);
      }
    };

    console.log('Starting mobile audio level monitoring');
    monitor();
  }

  /**
   * Stop audio level monitoring
   */
  stopAudioLevelMonitoring() {
    // Monitoring stops automatically when isListening becomes false
  }

  /**
   * Pause voice activation (for TTS playback)
   */
  pauseVoiceActivation() {
    if (this.isListening) {
      console.log('Pausing mobile voice activation for TTS playback');
      if (this.speechRecognition) {
        this.speechRecognition.stop();
      }
    }
  }

  /**
   * Resume voice activation after TTS playback
   */
  resumeVoiceActivation() {
    if (this.isListening) {
      console.log('Resuming mobile voice activation after TTS playback');
      if (this.speechRecognition) {
        this.speechRecognition.start();
      }
    }
  }

  /**
   * Set callback for wake word detection
   */
  setWakeWordCallback(callback) {
    this.callbacks.onWakeWordDetected = callback;
  }

  /**
   * Set callback for audio level changes
   */
  setAudioLevelCallback(callback) {
    this.callbacks.onAudioLevelChange = callback;
  }

  /**
   * Set callback for errors
   */
  setErrorCallback(callback) {
    this.callbacks.onError = callback;
  }

  /**
   * Set callback for status changes
   */
  setStatusCallback(callback) {
    this.callbacks.onStatusChange = callback;
  }

  /**
   * Notify wake word detected
   */
  notifyWakeWordDetected(wakeWord, transcription) {
    if (this.callbacks.onWakeWordDetected) {
      this.callbacks.onWakeWordDetected(wakeWord, transcription);
    }
  }

  /**
   * Notify audio level change
   */
  notifyAudioLevelChange(level) {
    if (this.callbacks.onAudioLevelChange) {
      this.callbacks.onAudioLevelChange(level);
    }
  }

  /**
   * Notify error
   */
  notifyError(error) {
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  /**
   * Notify status change
   */
  notifyStatusChange(status) {
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(status);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopListening();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.microphone = null;
    this.speechRecognition = null;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      isProcessing: this.isProcessing,
      isReady: !!this.mediaStream,
      useWebSpeechAPI: this.useWebSpeechAPI,
      useAudioLevelMonitoring: this.useAudioLevelMonitoring
    };
  }
}

// Create singleton instance
const mobileVoiceActivationService = new MobileVoiceActivationService();

export default mobileVoiceActivationService;
