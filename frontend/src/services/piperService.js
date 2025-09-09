/**
 * PiperService - Text-to-Speech service using Piper model via Transformers.js
 * Provides high-quality, on-device speech synthesis
 */

class PiperService {
  constructor() {
    this.model = null;
    this.processor = null;
    this.isInitialized = false;
    this.isLoading = false;
    this.audioContext = null;
    this.sampleRate = 22050; // Piper default sample rate
    this.speakerId = 0; // Default speaker
  }

  /**
   * Initialize the Piper model using Transformers.js
   * @param {Function} onProgress - Progress callback for model loading
   * @returns {Promise<boolean>} - True if initialization successful
   */
  async initialize(onProgress = null) {
    if (this.isInitialized) {
      return true;
    }

    if (this.isLoading) {
      // Wait for existing loading to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.isInitialized;
    }

    this.isLoading = true;

    try {
      if (onProgress) {
        onProgress({ stage: 'loading_transformers', message: 'Loading Transformers.js...' });
      }

      // Import Transformers.js
      const { AutoProcessor, AutoModelForTextToSpeech } = await import('@huggingface/transformers');

      if (onProgress) {
        onProgress({ stage: 'loading_processor', message: 'Loading Piper processor...' });
      }

      // Load processor
      this.processor = await AutoProcessor.from_pretrained('Xenova/piper-en_US-lessac-medium');

      if (onProgress) {
        onProgress({ stage: 'loading_model', message: 'Loading Piper model...' });
      }

      // Load model
      this.model = await AutoModelForTextToSpeech.from_pretrained('Xenova/piper-en_US-lessac-medium', {
        dtype: 'q8',
        device: 'wasm'
      });

      // Initialize audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.sampleRate
      });

      this.isInitialized = true;
      console.log('Piper model initialized successfully with Transformers.js');
      
      if (onProgress) {
        onProgress({ stage: 'complete', message: 'Piper ready!' });
      }
      
      return true;

    } catch (error) {
      console.error('Failed to initialize Piper model:', error);
      this.isInitialized = false;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Convert text to speech
   * @param {string} text - Text to convert to speech
   * @param {Object} options - Speech options
   * @returns {Promise<AudioBuffer>} - Generated audio buffer
   */
  async textToSpeech(text, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const speakerId = options.speakerId || this.speakerId;
      const speed = options.speed || 1.0;
      
      // Prepare inputs using processor
      const inputs = await this.processor(text, {
        speaker_id: speakerId,
        speed: speed
      });
      
      // Generate speech
      const outputs = await this.model.generate({
        ...inputs,
        do_sample: false
      });

      // Convert output to audio buffer
      const audioData = outputs.audio[0];
      const audioBuffer = this.audioContext.createBuffer(
        1, 
        audioData.length, 
        this.sampleRate
      );
      
      audioBuffer.getChannelData(0).set(audioData);
      
      return audioBuffer;

    } catch (error) {
      console.error('Text-to-speech generation failed:', error);
      throw new Error(`Text-to-speech generation failed: ${error.message}`);
    }
  }

  /**
   * Speak text and play audio
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   * @returns {Promise<void>}
   */
  async speakText(text, options = {}) {
    try {
      const audioBuffer = await this.textToSpeech(text, options);
      await this.playAudioBuffer(audioBuffer);
    } catch (error) {
      console.error('Speech playback failed:', error);
      throw new Error(`Speech playback failed: ${error.message}`);
    }
  }

  /**
   * Play audio buffer
   * @param {AudioBuffer} audioBuffer - Audio buffer to play
   * @returns {Promise<void>}
   */
  async playAudioBuffer(audioBuffer) {
    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create audio source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      // Play audio
      source.start();

      // Wait for audio to finish
      return new Promise((resolve) => {
        source.onended = () => resolve();
      });

    } catch (error) {
      console.error('Audio playback failed:', error);
      throw new Error(`Audio playback failed: ${error.message}`);
    }
  }

  /**
   * Generate speech and return as blob
   * @param {string} text - Text to convert to speech
   * @param {Object} options - Speech options
   * @returns {Promise<Blob>} - Audio blob
   */
  async generateSpeechBlob(text, options = {}) {
    try {
      const audioBuffer = await this.textToSpeech(text, options);
      
      // Convert AudioBuffer to WAV blob
      const wavBlob = this.audioBufferToWav(audioBuffer);
      return wavBlob;

    } catch (error) {
      console.error('Speech blob generation failed:', error);
      throw new Error(`Speech blob generation failed: ${error.message}`);
    }
  }

  /**
   * Convert AudioBuffer to WAV blob
   * @param {AudioBuffer} audioBuffer - Audio buffer to convert
   * @returns {Blob} - WAV blob
   */
  audioBufferToWav(audioBuffer) {
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    
    // Create WAV header
    const headerLength = 44;
    const dataLength = length * channels * 2; // 16-bit samples
    const totalLength = headerLength + dataLength;
    
    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Convert audio data to 16-bit PCM
    let offset = headerLength;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Set speaker ID
   * @param {number} speakerId - Speaker ID to use
   */
  setSpeaker(speakerId) {
    this.speakerId = speakerId;
  }

  /**
   * Get available speakers
   * @returns {Array} - List of available speakers
   */
  getAvailableSpeakers() {
    // This would depend on the specific Piper model
    // For now, return a default list
    return [
      { id: 0, name: 'Default Speaker', gender: 'neutral' },
      { id: 1, name: 'Male Speaker', gender: 'male' },
      { id: 2, name: 'Female Speaker', gender: 'female' }
    ];
  }

  /**
   * Check if the service is ready
   * @returns {boolean} - True if initialized and ready
   */
  isReady() {
    return this.isInitialized && this.model && this.processor;
  }

  /**
   * Get service status
   * @returns {Object} - Service status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isLoading: this.isLoading,
      isReady: this.isReady(),
      sampleRate: this.sampleRate,
      speakerId: this.speakerId
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.model = null;
    this.processor = null;
    this.isInitialized = false;
    this.isLoading = false;
  }
}

// Create singleton instance
const piperService = new PiperService();

export default piperService;