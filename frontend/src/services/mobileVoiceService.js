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
   * Transcribe audio buffer (compatibility with voiceActivationService)
   */
  async transcribeAudioBuffer(audioBuffer) {
    try {
      // Convert AudioBuffer to Blob
      const audioBlob = await this.audioBufferToBlob(audioBuffer);
      
      // Use the existing transcribeAudio method
      return await this.transcribeAudio(audioBlob);
    } catch (error) {
      console.error('Mobile transcription failed:', error);
      throw error;
    }
  }

  /**
   * Convert AudioBuffer to Blob
   */
  async audioBufferToBlob(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    // Create a temporary AudioContext to encode the buffer
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);
    
    // Copy the buffer
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    // Render to get the processed buffer
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert to WAV
    const wavBlob = this.bufferToWav(renderedBuffer);
    return wavBlob;
  }

  /**
   * Convert AudioBuffer to WAV Blob
   */
  bufferToWav(buffer) {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    
    // Create WAV header
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
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
   * Check if the service is ready
   */
  isReady() {
    return this.isInitialized && this.recognition;
  }

  /**
   * Check if transcription service is available (for compatibility)
   */
  hasTranscriptionService() {
    return this.isInitialized && this.isSupported;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isListening: this.isListening,
      isReady: this.isReady(),
      isSupported: this.isSupported
    };
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopListening();
    this.isInitialized = false;
  }
}

// Create singleton instance
const mobileVoiceService = new MobileVoiceService();

export default mobileVoiceService;
