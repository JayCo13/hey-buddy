/**
 * WhisperService - Speech-to-Text service using Whisper model via Transformers.js
 * Provides offline speech recognition capabilities
 */

class WhisperService {
  constructor() {
    this.model = null;
    this.processor = null;
    this.isInitialized = false;
    this.isLoading = false;
    this.audioContext = null;
    this.sampleRate = 16000; // Whisper expects 16kHz audio
  }

  /**
   * Initialize the Whisper model using Transformers.js
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

      // Import Transformers.js with error handling
      let AutoProcessor, AutoModelForSpeechSeq2Seq;
      try {
        // Try @xenova/transformers first (more stable)
        const transformers = await import('@xenova/transformers');
        AutoProcessor = transformers.AutoProcessor;
        AutoModelForSpeechSeq2Seq = transformers.AutoModelForSpeechSeq2Seq;
        console.log('Using @xenova/transformers');
      } catch (importError) {
        console.warn('Failed to import @xenova/transformers, trying @huggingface/transformers:', importError);
        try {
          // Fallback to @huggingface/transformers
          const transformers = await import('@huggingface/transformers');
          AutoProcessor = transformers.AutoProcessor;
          AutoModelForSpeechSeq2Seq = transformers.AutoModelForSpeechSeq2Seq;
          console.log('Using @huggingface/transformers');
        } catch (fallbackError) {
          console.error('Failed to import both transformers libraries:', fallbackError);
          throw new Error('Transformers.js library failed to load. Please refresh the page.');
        }
      }

      if (onProgress) {
        onProgress({ stage: 'loading_processor', message: 'Loading Whisper processor...' });
      }

      // Load processor - use tiny model for faster response
      console.log('Loading Whisper processor...');
      try {
        this.processor = await AutoProcessor.from_pretrained('Xenova/whisper-tiny.en');
        console.log('Whisper processor loaded successfully');
      } catch (processorError) {
        console.error('Failed to load Whisper processor:', processorError);
        throw new Error(`Whisper processor failed to load: ${processorError.message}`);
      }

      if (onProgress) {
        onProgress({ stage: 'loading_model', message: 'Loading Whisper model...' });
      }

      // Load model - use tiny model for faster response
      console.log('Loading Whisper model...');
      try {
        this.model = await AutoModelForSpeechSeq2Seq.from_pretrained('Xenova/whisper-tiny.en', {
          dtype: 'q4', // Use q4 for faster processing
          device: 'wasm'
        });
        console.log('Whisper model loaded successfully');
      } catch (modelError) {
        console.warn('Failed to load model with q4 dtype, trying without quantization:', modelError);
        // Fallback: try without quantization
        this.model = await AutoModelForSpeechSeq2Seq.from_pretrained('Xenova/whisper-tiny.en', {
          device: 'wasm'
        });
        console.log('Whisper model loaded successfully (without quantization)');
      }

      // Initialize audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.sampleRate
      });

      this.isInitialized = true;
      console.log('Whisper model initialized successfully with Transformers.js');
      
      if (onProgress) {
        onProgress({ stage: 'complete', message: 'Whisper ready!' });
      }
      
      return true;

    } catch (error) {
      console.error('Failed to initialize Whisper model:', error);
      this.isInitialized = false;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Convert audio file to text
   * @param {File|Blob} audioFile - Audio file to transcribe
   * @param {Object} options - Transcription options
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribeAudio(audioFile, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Whisper service not initialized');
    }

    try {
      // Process audio file
      const audioBuffer = await this.processAudioFile(audioFile);
      
      // Transcribe using the audio buffer
      return await this.transcribeAudioBuffer(audioBuffer);

    } catch (error) {
      console.error('Audio transcription failed:', error);
      throw new Error(`Audio transcription failed: ${error.message}`);
    }
  }

  /**
   * Transcribe audio stream in real-time
   * @param {MediaStream} stream - Audio stream to transcribe
   * @param {Object} options - Transcription options
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribeStream(stream, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Whisper service not initialized');
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      let audioData = [];

      processor.onaudioprocess = async (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        audioData = audioData.concat(Array.from(inputData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Wait for enough audio data
      await new Promise(resolve => setTimeout(resolve, 3000));

      processor.disconnect();
      source.disconnect();
      audioContext.close();

      // Convert to AudioBuffer
      const audioBuffer = audioContext.createBuffer(1, audioData.length, audioContext.sampleRate);
      audioBuffer.getChannelData(0).set(audioData);

      return await this.transcribeAudioBuffer(audioBuffer);

    } catch (error) {
      console.error('Stream transcription failed:', error);
      throw new Error(`Stream transcription failed: ${error.message}`);
    }
  }

  /**
   * Process audio file to AudioBuffer
   * @param {File|Blob} audioFile - Audio file to process
   * @returns {Promise<AudioBuffer>} - Processed audio buffer
   */
  async processAudioFile(audioFile) {
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioContext.close();
      return audioBuffer;

    } catch (error) {
      console.error('Audio processing failed:', error);
      throw new Error(`Audio processing failed: ${error.message}`);
    }
  }

  /**
   * Transcribe audio buffer directly using Transformers.js
   * @param {AudioBuffer} audioBuffer - Audio buffer to transcribe
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribeAudioBuffer(audioBuffer) {
    if (!this.isInitialized) {
      throw new Error('Whisper service not initialized');
    }

    try {
      // Convert AudioBuffer to Float32Array
      let audioData = audioBuffer.getChannelData(0);
      
      // Check audio length - skip if too long (avoid the 30-second warning)
      const audioLengthSeconds = audioData.length / audioBuffer.sampleRate;
      if (audioLengthSeconds > 25) {
        console.warn(`Audio chunk too long (${audioLengthSeconds.toFixed(1)}s), skipping transcription`);
        return '';
      }
      
      // Normalize audio for better recognition (avoid stack overflow with large arrays)
      let maxVal = 0;
      for (let i = 0; i < audioData.length; i++) {
        const abs = Math.abs(audioData[i]);
        if (abs > maxVal) maxVal = abs;
      }
      
      if (maxVal > 0) {
        for (let i = 0; i < audioData.length; i++) {
          audioData[i] = audioData[i] / maxVal;
        }
      }
      
      console.log(`Audio length: ${audioLengthSeconds.toFixed(2)}s, Max amplitude: ${maxVal.toFixed(4)}`);
      
      // Prepare inputs with optimized configuration for faster processing
      const inputs = await this.processor(audioData, {
        chunk_length_s: 15, // Shorter chunks for faster processing
        stride_length_s: 2,  // Smaller stride for better wake word detection
        return_tensors: 'pt'
      });
      
      // Generate transcription with optimized parameters for speed
      const outputs = await this.model.generate({
        ...inputs,
        max_new_tokens: 64,    // Reduced for faster processing (wake words are short)
        do_sample: false,
        num_beams: 1,          // Single beam for speed
        early_stopping: true,  // Stop early when possible
        pad_token_id: this.processor.tokenizer.eos_token_id
      });

      // Decode the output
      const transcription = this.processor.tokenizer.decode(outputs[0], {
        skip_special_tokens: true
      });
      
      return transcription.trim();

    } catch (error) {
      console.error('Audio buffer transcription failed:', error);
      throw new Error(`Audio buffer transcription failed: ${error.message}`);
    }
  }

  /**
   * Convert stereo audio to mono
   * @param {AudioBuffer} audioBuffer - Input audio buffer
   * @returns {Float32Array} - Mono audio data
   */
  convertToMono(audioBuffer) {
    if (audioBuffer.numberOfChannels === 1) {
      return audioBuffer.getChannelData(0);
    }

    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.getChannelData(1);
    const monoData = new Float32Array(leftChannel.length);

    for (let i = 0; i < leftChannel.length; i++) {
      monoData[i] = (leftChannel[i] + rightChannel[i]) / 2;
    }

    return monoData;
  }

  /**
   * Resample audio to target sample rate
   * @param {Float32Array} audioData - Input audio data
   * @param {number} fromSampleRate - Source sample rate
   * @param {number} toSampleRate - Target sample rate
   * @returns {Float32Array} - Resampled audio data
   */
  resampleAudio(audioData, fromSampleRate, toSampleRate) {
    if (fromSampleRate === toSampleRate) {
      return audioData;
    }

    const ratio = fromSampleRate / toSampleRate;
    const newLength = Math.floor(audioData.length / ratio);
    const resampledData = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const sourceIndex = Math.floor(i * ratio);
      resampledData[i] = audioData[sourceIndex];
    }

    return resampledData;
  }

  /**
   * Get microphone stream
   * @returns {Promise<MediaStream>} - Microphone stream
   */
  async getMicrophoneStream() {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.sampleRate
        }
      });
    } catch (error) {
      console.error('Failed to get microphone access:', error);
      throw new Error(`Failed to get microphone access: ${error.message}`);
    }
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
      sampleRate: this.sampleRate
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
const whisperService = new WhisperService();

export default whisperService;