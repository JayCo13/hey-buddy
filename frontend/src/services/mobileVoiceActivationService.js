/**
 * Mobile Voice Activation Service
 * Provides fallback voice activation for mobile devices when WASM fails
 * Uses Web Speech API as a lightweight alternative
 */

class MobileVoiceActivationService {
  constructor() {
    this.isListening = false;
    this.isProcessing = false;
    this.recognition = null;
    this.callbacks = {
      onWakeWordDetected: null,
      onAudioLevelChange: null,
      onError: null,
      onStatusChange: null
    };
    this.wakeWord = 'hey buddy';
    this.isSupported = this.checkSupport();
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
   * Initialize the mobile voice activation service
   * @returns {Promise<boolean>} - True if initialization successful
   */
  async initialize() {
    console.log('Mobile voice activation service initialization started...');
    
    if (!this.isSupported) {
      const error = new Error('Web Speech API not supported on this device');
      console.error('Web Speech API not supported:', error);
      throw error;
    }

    try {
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
        console.log('Mobile speech recognition started');
        this.isListening = true;
        this.notifyStatusChange('listening');
      };

      this.recognition.onresult = (event) => {
        this.handleRecognitionResult(event);
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.notifyError(`Speech recognition error: ${event.error}`);
      };

      this.recognition.onend = () => {
        console.log('Mobile speech recognition ended');
        this.isListening = false;
        this.notifyStatusChange('ready');
      };

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
   * Start listening for wake words
   * @returns {Promise<boolean>} - True if started successfully
   */
  async startListening() {
    if (!this.recognition || this.isListening) {
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start mobile voice activation:', error);
      this.notifyError(`Failed to start mobile voice activation: ${error.message}`);
      return false;
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
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
        console.log('Mobile voice activation - Final transcript:', transcript);
        
        // Check for wake word variations
        const wakeWordVariations = [
          'hey buddy',
          'hey bud',
          'buddy',
          'hey',
          'buddy hey'
        ];
        
        const detectedVariation = wakeWordVariations.find(variation => 
          transcript.includes(variation)
        );
        
        if (detectedVariation) {
          console.log(`🎤 Mobile wake word detected! Variation: "${detectedVariation}" in "${transcript}"`);
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
   * Set callback for audio level changes (not applicable for Web Speech API)
   * @param {Function} callback - Callback function
   */
  setAudioLevelCallback(callback) {
    // Web Speech API doesn't provide audio level data
    // Simulate minimal audio level for UI compatibility
    if (callback) {
      setInterval(() => {
        if (this.isListening) {
          callback(0.1 + Math.random() * 0.2); // Simulate low audio level
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
      console.log('Pausing mobile voice activation for TTS playback');
      this.stopListening();
    }
  }

  /**
   * Resume voice activation after TTS playback
   */
  resumeVoiceActivation() {
    if (!this.isListening) {
      console.log('Resuming mobile voice activation after TTS playback');
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
      isSupported: this.isSupported
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopListening();
    this.recognition = null;
  }
}

// Create singleton instance
const mobileVoiceActivationService = new MobileVoiceActivationService();

export default mobileVoiceActivationService;
