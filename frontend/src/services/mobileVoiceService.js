/**
 * Mobile Voice Service
 * Lightweight voice service for mobile devices with memory constraints
 * Uses browser's native speech recognition as fallback
 */

class MobileVoiceService {
  constructor() {
    this.isInitialized = false;
    this.isListening = false;
    this.recognition = null;
    this.callbacks = {
      onWakeWordDetected: null,
      onAudioLevelChange: null,
      onError: null,
      onStatusChange: null
    };
    this.wakeWord = 'hey buddy';
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Initialize the mobile voice service
   */
  async initialize() {
    if (!this.isSupported) {
      throw new Error('Speech recognition not supported on this device');
    }

    try {
      // Create speech recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      // Configure for continuous listening
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      // Set up event handlers
      this.setupEventHandlers();

      this.isInitialized = true;
      console.log('Mobile voice service initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize mobile voice service:', error);
      throw error;
    }
  }

  /**
   * Set up speech recognition event handlers
   */
  setupEventHandlers() {
    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      this.isListening = true;
      this.notifyStatusChange('listening');
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Check for wake word in final transcript
      if (finalTranscript.toLowerCase().includes(this.wakeWord)) {
        console.log('Wake word detected:', finalTranscript);
        this.notifyWakeWordDetected(finalTranscript);
      }

      // Simulate audio level changes
      this.simulateAudioLevel();
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.notifyError(`Speech recognition error: ${event.error}`);
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      this.isListening = false;
      this.notifyStatusChange('ready');
    };
  }

  /**
   * Start listening for voice commands
   */
  async startListening() {
    if (!this.isInitialized || this.isListening) {
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.notifyError(`Failed to start listening: ${error.message}`);
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
   * Simulate audio level monitoring
   */
  simulateAudioLevel() {
    const simulateLevel = () => {
      if (this.isListening) {
        const level = Math.random() * 0.5 + 0.3; // Random level between 0.3-0.8
        this.notifyAudioLevelChange(level);
        setTimeout(simulateLevel, 100);
      }
    };
    simulateLevel();
  }

  /**
   * Transcribe audio using browser's native speech recognition
   */
  async transcribeAudio(audioBlob) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(audioBlob);
      
      audio.src = url;
      audio.onloadeddata = () => {
        // Create a temporary recognition instance for transcription
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const tempRecognition = new SpeechRecognition();
        
        tempRecognition.continuous = false;
        tempRecognition.interimResults = false;
        tempRecognition.lang = 'en-US';
        
        tempRecognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          URL.revokeObjectURL(url);
          resolve(transcript);
        };
        
        tempRecognition.onerror = (event) => {
          URL.revokeObjectURL(url);
          reject(new Error(`Transcription failed: ${event.error}`));
        };
        
        tempRecognition.start();
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio'));
      };
    });
  }

  /**
   * Check if wake word is present in text
   */
  checkWakeWord(text) {
    return text.toLowerCase().includes(this.wakeWord);
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Notify callbacks
   */
  notifyWakeWordDetected(transcript) {
    if (this.callbacks.onWakeWordDetected) {
      this.callbacks.onWakeWordDetected(transcript);
    }
  }

  notifyAudioLevelChange(level) {
    if (this.callbacks.onAudioLevelChange) {
      this.callbacks.onAudioLevelChange(level);
    }
  }

  notifyError(error) {
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  notifyStatusChange(status) {
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(status);
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopListening();
    this.isInitialized = false;
  }
}

export default MobileVoiceService;
