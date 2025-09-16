/**
 * PiperService - Text-to-Speech service with true offline capability
 * Uses @realtimex/piper-tts-web for offline TTS, falls back to Web Speech API
 * Provides reliable speech synthesis that works in PWAs offline
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
    this.modelName = null;
    this.useWebSpeech = false;
    this.useOfflinePiper = false;
    this.piperSession = null;
    this.piperTTS = null;
    this.voices = [];
    this.selectedVoice = null;
    this.currentAudio = null; // Track current audio for smooth playback
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

    try {
      // Ultra-fast initialization - minimal steps
      // Import and setup in one go
      const piperTTS = await import('@realtimex/piper-tts-web');
      
      this.useOfflinePiper = true;
      this.modelName = 'Piper TTS';
      this.piperTTS = piperTTS;
      this.isInitialized = true;
      
      return true;

    } catch (error) {
      console.error('Piper TTS initialization failed:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Load available voices for Web Speech API
   */
  async loadVoices() {
    return new Promise((resolve) => {
      if (this.voices.length > 0) {
        resolve(this.voices);
        return;
      }

      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max

      const loadVoices = () => {
        this.voices = speechSynthesis.getVoices();
        console.log(`Voice loading attempt ${attempts + 1}: ${this.voices.length} voices found`);
        
        if (this.voices.length > 0) {
          resolve(this.voices);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(loadVoices, 100);
        } else {
          console.warn('No voices loaded after maximum attempts, proceeding with default');
          resolve([]);
        }
      };

      loadVoices();
    });
  }

  /**
   * Select a good default voice
   */
  selectDefaultVoice() {
    if (this.voices.length === 0) {
      console.warn('No voices available, will use browser default');
      this.selectedVoice = null;
      return;
    }

    // Prefer energetic, natural-sounding voices
    const energeticVoiceNames = [
      'Alex', 'Victoria', 'Daniel', 'Fiona', 'Karen', 'Moira', 'Tessa',
      'Veena', 'Rishi', 'Google UK English Female', 'Google UK English Male',
      'Microsoft Zira Desktop', 'Microsoft David Desktop', 'Microsoft Mark Desktop',
      'Microsoft Hazel Desktop', 'Microsoft Susan Desktop', 'Microsoft Catherine Desktop',
      'Google US English Female', 'Google US English Male', 'Google Australian English Female',
      'Google Australian English Male', 'Google Indian English Female', 'Google Indian English Male'
    ];

    // First try to find energetic voices
    let selectedVoice = this.voices.find(voice => 
      voice.lang.startsWith('en') && 
      energeticVoiceNames.some(name => voice.name.includes(name))
    );

    // If no energetic voice found, try default English voices
    if (!selectedVoice) {
      const englishVoices = this.voices.filter(voice => 
        voice.lang.startsWith('en') && voice.default
      );
      selectedVoice = englishVoices.length > 0 ? englishVoices[0] : null;
    }

    // Final fallback to any English voice
    if (!selectedVoice) {
      selectedVoice = this.voices.find(voice => voice.lang.startsWith('en')) || this.voices[0];
    }

    this.selectedVoice = selectedVoice;
    console.log('Selected voice:', this.selectedVoice?.name || 'Browser default');
  }

  /**
   * Convert text to speech using Web Speech API
   * @param {string} text - Text to convert to speech
   * @param {Object} options - Speech options
   * @returns {Promise<AudioBuffer>} - Generated audio buffer (simulated)
   */
  async textToSpeech(text, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const speed = options.speed || options.rate || 1.0;
      
      console.log(`Generating speech for: "${text}"`);
      console.log(`Options: speed=${speed}`);
      
      // For Web Speech API, we'll create a simulated audio buffer
      // The actual speech will be handled by speakText method
      const duration = text.length * 0.1; // Estimate duration
      const sampleCount = Math.floor(duration * this.sampleRate);
      
      // Create a silent audio buffer as placeholder
      const audioBuffer = this.audioContext.createBuffer(1, sampleCount, this.sampleRate);
      
      console.log(`Audio buffer created: ${sampleCount} samples at ${this.sampleRate}Hz`);
      
      return audioBuffer;

    } catch (error) {
      console.error('Text-to-speech generation failed:', error);
      throw new Error(`Text-to-speech generation failed: ${error.message}`);
    }
  }

  /**
   * Speak text and play audio using offline Piper TTS or Web Speech API
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   * @returns {Promise<void>}
   */
  async speakText(text, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Ultra-fast direct speech
    await this.speakWithOfflinePiper(text, options);
  }

  /**
   * Speak text using offline Piper TTS
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   * @returns {Promise<void>}
   */
  async speakWithOfflinePiper(text, options = {}) {
    try {
      // Speech generation with slower rate
      const wavBlob = await this.piperTTS.predict({
        text: text,
        voiceId: 'en_US-hfc_female-medium',
        speed: 0.5  // Slower speech rate (0.5 = very slow, 1.0 = normal, 1.5 = fast)
      });
      
      // Stop any current audio silently
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        if (this.currentAudio.src.startsWith('blob:')) {
          URL.revokeObjectURL(this.currentAudio.src);
        }
        this.currentAudio = null;
      }
      
      // Create optimized audio element with slower playback
      const audio = new Audio();
      audio.src = URL.createObjectURL(wavBlob);
      audio.playbackRate = 0.8; // Slower audio playback (0.5 = very slow, 1.0 = normal, 2.0 = fast)
      audio.preload = 'auto'; // Preload for faster playback
      audio.crossOrigin = 'anonymous'; // Avoid CORS issues
      this.currentAudio = audio;
      
      return new Promise((resolve, reject) => {
        // Ultra-fast playback - play as soon as possible
        const playAudio = () => {
          audio.play().then(() => {
            // Audio started successfully
          }).catch(reject);
        };
        
        // Try to play immediately
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
          playAudio();
        } else {
          // Wait for data to be available
          audio.addEventListener('canplay', playAudio, { once: true });
        }
        
        // Clean up when done
        audio.addEventListener('ended', () => {
          URL.revokeObjectURL(audio.src);
          this.currentAudio = null;
          resolve();
        }, { once: true });
        
        audio.addEventListener('error', (error) => {
          URL.revokeObjectURL(audio.src);
          this.currentAudio = null;
          reject(error);
        }, { once: true });
        
        // Start loading immediately
        audio.load();
      });

    } catch (error) {
      console.error('Piper TTS failed:', error);
      throw error;
    }
  }

  /**
   * Speak text using Web Speech API
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   * @returns {Promise<void>}
   */
  async speakWithWebSpeech(text, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        
        // Stop any current speech to prevent overlap
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice if available
        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }

        // Set options with smooth defaults
        utterance.rate = options.rate || options.speed || 1.0; // Normal rate for smoothness
        utterance.pitch = options.pitch || 1.0; // Normal pitch for clarity
        utterance.volume = options.volume || 1.0;
        utterance.lang = options.lang || 'en-US';

        // Set up event handlers
        utterance.onstart = () => {
          console.log('Web Speech: Speech started');
        };

        utterance.onend = () => {
          console.log('Web Speech: Speech ended');
          
          
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('Web Speech: Speech error:', event.error);
          
          
          reject(new Error(`Speech error: ${event.error}`));
        };

        utterance.onpause = () => {
          console.log('Web Speech: Speech paused');
        };

        utterance.onresume = () => {
          console.log('Web Speech: Speech resumed');
        };

        // Small delay to ensure speech synthesis is ready
        setTimeout(() => {
          speechSynthesis.speak(utterance);
        }, 50);

      } catch (error) {
        console.error('Web Speech: Failed to create utterance:', error);
        
        // Resume voice activation on error
        if (this.voiceActivationService) {
          this.voiceActivationService.resumeVoiceActivation();
        }
        
        reject(error);
      }
    });
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
    if (this.useOfflinePiper) {
      return this.isInitialized && this.piperTTS && typeof this.piperTTS.predict === 'function';
    } else if (this.useWebSpeech) {
      return this.isInitialized && this.voices.length > 0;
    } else {
      return this.isInitialized && this.model && this.processor;
    }
  }

  /**
   * Stop current speech
   */
  stop() {
    if (this.useOfflinePiper) {
      // Stop offline Piper TTS (if session has stop method)
      if (this.piperSession && this.piperSession.stop) {
        this.piperSession.stop();
      }
    } else if (this.useWebSpeech) {
      // Stop Web Speech API
      speechSynthesis.cancel();
    }
    
    // Stop any current audio playback
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      if (this.currentAudio.src.startsWith('blob:')) {
        URL.revokeObjectURL(this.currentAudio.src);
      }
      this.currentAudio = null;
    }
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
      speakerId: this.speakerId,
      modelName: this.modelName,
      audioContextState: this.audioContext?.state || 'not_initialized',
      useWebSpeech: this.useWebSpeech,
      useOfflinePiper: this.useOfflinePiper,
      voicesCount: this.voices.length,
      selectedVoice: this.selectedVoice?.name || 'Browser default',
      offlineCapable: this.useOfflinePiper
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