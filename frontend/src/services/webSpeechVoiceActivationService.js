/**
 * Web Speech Voice Activation Service
 * Uses Web Speech API for wake word detection on mobile devices
 * This is the same approach used successfully in RecordScreen
 */

class WebSpeechVoiceActivationService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isProcessing = false;
    this.callbacks = {
      onWakeWordDetected: null,
      onAudioLevelChange: null,
      onError: null,
      onStatusChange: null
    };
    this.wakeWord = 'hey buddy';
    this.isSupported = this.checkSupport();
    this.shouldRestart = false;
  }

  /**
   * Check if Web Speech API is supported
   * @returns {boolean} - True if supported
   */
  checkSupport() {
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    console.log('Web Speech API support check:', {
      webkitSpeechRecognition: 'webkitSpeechRecognition' in window,
      SpeechRecognition: 'SpeechRecognition' in window,
      isSupported: isSupported,
      userAgent: navigator.userAgent
    });
    return isSupported;
  }

  /**
   * Initialize the Web Speech voice activation service
   * @returns {Promise<boolean>} - True if initialization successful
   */
  async initialize() {
    console.log('Web Speech voice activation service initialization started...');
    
    if (!this.isSupported) {
      const error = new Error('Web Speech API not supported on this device');
      console.error('Web Speech API not supported:', error);
      throw error;
    }

    try {
      // First, request microphone permission (same as RecordScreen)
      console.log('Requesting microphone permission for Web Speech API...');
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000
          }
        });
        
        // Test the stream and then stop it
        if (stream && stream.getAudioTracks().length > 0) {
          console.log('Microphone permission granted for Web Speech API');
          stream.getTracks().forEach(track => track.stop());
        } else {
          throw new Error('No audio tracks available');
        }
      } else {
        throw new Error('Microphone API not available');
      }

      console.log('Creating SpeechRecognition instance...');
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      console.log('Configuring recognition settings...');
      // Configure recognition for wake word detection
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      console.log('Setting up event handlers...');
      // Set up event handlers
      this.recognition.onstart = () => {
        console.log('Web Speech recognition started');
        this.isListening = true;
        this.notifyStatusChange('listening');
      };

      this.recognition.onresult = (event) => {
        this.handleRecognitionResult(event);
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle specific mobile errors
        if (event.error === 'not-allowed') {
          this.notifyError('Microphone permission denied. Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected, continuing to listen...');
          // Don't treat this as an error, just restart
          if (this.shouldRestart) {
            setTimeout(() => {
              try {
                this.recognition.start();
              } catch (e) {
                console.warn('Auto-restart after no-speech failed:', e);
              }
            }, 100);
          }
        } else {
          this.notifyError(`Speech recognition error: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        console.log('Web Speech recognition ended');
        this.isListening = false;
        this.notifyStatusChange('ready');
        
        // Auto-restart if we should be listening
        if (this.shouldRestart) {
          setTimeout(() => {
            try {
              this.recognition.start();
            } catch (e) {
              console.warn('Auto-restart failed:', e);
            }
          }, 50);
        }
      };

      this.notifyStatusChange('ready');
      console.log('Web Speech voice activation service initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize Web Speech voice activation:', error);
      this.notifyError(`Failed to initialize Web Speech voice activation: ${error.message}`);
      return false;
    }
  }

  /**
   * Start listening for wake words
   * @returns {Promise<boolean>} - True if started successfully
   */
  async startListening() {
    if (!this.recognition || this.isListening) {
      return false;
    }

    try {
      this.shouldRestart = true;
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start Web Speech voice activation:', error);
      this.notifyError(`Failed to start Web Speech voice activation: ${error.message}`);
      return false;
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.shouldRestart = false;
      this.recognition.stop();
    }
    this.isListening = false;
    this.notifyStatusChange('ready');
  }

  /**
   * Handle speech recognition results
   * @param {SpeechRecognitionEvent} event - Recognition event
   */
  handleRecognitionResult(event) {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.toLowerCase().trim();
      
      if (result.isFinal) {
        console.log('Web Speech voice activation - Final transcript:', transcript);
        
        // Check for wake word variations (more sensitive for mobile)
        const wakeWordVariations = [
          'hey buddy',
          'hey bud',
          'buddy',
          'hey',
          'buddy hey',
          'hay buddy', // Common mispronunciation
          'hi buddy',
          'hey body', // Common mispronunciation
          'buddy hey'
        ];
        
        const detectedVariation = wakeWordVariations.find(variation => 
          transcript.includes(variation) || 
          transcript.includes(variation.replace(' ', '')) // Check without spaces
        );
        
        if (detectedVariation) {
          console.log(`🎤 Web Speech wake word detected! Variation: "${detectedVariation}" in "${transcript}"`);
          this.notifyStatusChange('wake_word_detected');
          this.notifyWakeWordDetected('Hey Buddy', transcript);
        }
      }
    }
  }

  /**
   * Set callback for wake word detection
   * @param {Function} callback - Callback function
   */
  setWakeWordCallback(callback) {
    this.callbacks.onWakeWordDetected = callback;
  }

  /**
   * Set callback for audio level changes (simulated for Web Speech API)
   * @param {Function} callback - Callback function
   */
  setAudioLevelCallback(callback) {
    // Web Speech API doesn't provide audio level data
    // Simulate audio level for UI compatibility
    if (callback) {
      this.audioLevelInterval = setInterval(() => {
        if (this.isListening) {
          // Simulate realistic audio level changes
          const baseLevel = 0.1;
          const variation = Math.random() * 0.3;
          const level = baseLevel + variation;
          callback(level);
        }
      }, 100);
    }
  }

  /**
   * Set callback for errors
   * @param {Function} callback - Callback function
   */
  setErrorCallback(callback) {
    this.callbacks.onError = callback;
  }

  /**
   * Set callback for status changes
   * @param {Function} callback - Callback function
   */
  setStatusCallback(callback) {
    this.callbacks.onStatusChange = callback;
  }

  /**
   * Notify wake word detected
   * @param {string} wakeWord - Detected wake word
   * @param {string} transcription - Full transcription
   */
  notifyWakeWordDetected(wakeWord, transcription) {
    if (this.callbacks.onWakeWordDetected) {
      this.callbacks.onWakeWordDetected(wakeWord, transcription);
    }
  }

  /**
   * Notify audio level change
   * @param {number} level - Audio level
   */
  notifyAudioLevelChange(level) {
    if (this.callbacks.onAudioLevelChange) {
      this.callbacks.onAudioLevelChange(level);
    }
  }

  /**
   * Notify error
   * @param {string} error - Error message
   */
  notifyError(error) {
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  /**
   * Notify status change
   * @param {string} status - Status
   */
  notifyStatusChange(status) {
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(status);
    }
  }

  /**
   * Temporarily pause voice activation (for TTS playback)
   */
  pauseVoiceActivation() {
    if (this.isListening) {
      console.log('Pausing Web Speech voice activation for TTS playback');
      this.stopListening();
    }
  }

  /**
   * Resume voice activation after TTS playback
   */
  resumeVoiceActivation() {
    if (!this.isListening) {
      console.log('Resuming Web Speech voice activation after TTS playback');
      this.startListening();
    }
  }

  /**
   * Get current status
   * @returns {Object} - Status object
   */
  getStatus() {
    return {
      isListening: this.isListening,
      isProcessing: this.isProcessing,
      isReady: !!this.recognition,
      isSupported: this.isSupported,
      useWebSpeech: true
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopListening();
    
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
    
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
  }
}

// Create singleton instance
const webSpeechVoiceActivationService = new WebSpeechVoiceActivationService();

export default webSpeechVoiceActivationService;
