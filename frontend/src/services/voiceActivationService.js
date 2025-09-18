/**
 * Voice Activation Service
 * Handles microphone access, audio processing, and wake word detection using Whisper
 */

import whisperService from './whisperService';
import webSpeechVoiceActivationService from './webSpeechVoiceActivationService';

class VoiceActivationService {
  constructor() {
    this.mediaStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.isListening = false;
    this.isProcessing = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.processingInterval = null;
    this.wakeWord = 'hey buddy';
    this.useWebSpeechFallback = false;
    this.callbacks = {
      onWakeWordDetected: null,
      onAudioLevelChange: null,
      onError: null,
      onStatusChange: null
    };
  }

  /**
   * Detect if running on mobile device
   * @returns {boolean} - True if mobile device
   */
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
  }

  /**
   * Get mobile-optimized audio constraints
   * @returns {Object} - Audio constraints optimized for mobile
   */
  getMobileOptimizedAudioConstraints() {
    const isMobile = this.isMobileDevice();
    
    if (isMobile) {
      console.log('Mobile device detected - using optimized audio settings');
      return {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000, // Match Whisper's expected sample rate
        channelCount: 1, // Mono audio
        latency: 0.02, // Slightly higher latency for mobile stability
        // Mobile-specific constraints
        sampleSize: 16, // 16-bit samples for lower memory usage
        volume: 1.0 // Full volume
      };
    } else {
      return {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
        channelCount: 1,
        latency: 0.01 // Lower latency for desktop
      };
    }
  }

  /**
   * Initialize the voice activation service with aggressive mobile optimizations
   */
  async initialize() {
    try {
      // Get mobile-optimized audio constraints
      const audioConstraints = this.getMobileOptimizedAudioConstraints();
      
      // Request microphone access with optimized settings for speech
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints
      });

      // Create audio context with mobile-optimized settings
      const audioContextOptions = this.isMobileDevice() ? {
        sampleRate: 16000,
        latencyHint: 'interactive' // More stable for mobile
      } : {
        sampleRate: 16000,
        latencyHint: 'balanced'
      };
      
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)(audioContextOptions);
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Configure analyser with mobile-optimized settings
      if (this.isMobileDevice()) {
        this.analyser.fftSize = 512; // Smaller FFT for mobile
        this.analyser.smoothingTimeConstant = 0.9; // More smoothing for mobile
      } else {
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
      }
      
      this.microphone.connect(this.analyser);

      // Initialize Whisper service with aggressive mobile optimizations
      console.log('Initializing Whisper service with mobile optimizations...');
      const whisperInitialized = await whisperService.initialize();
      
      if (!whisperInitialized) {
        throw new Error('Whisper service initialization failed');
      }

      this.notifyStatusChange('ready');
      return true;
    } catch (error) {
      console.error('Voice activation initialization failed:', error);
      console.log('Error details:', {
        message: error.message,
        isMobile: this.isMobileDevice(),
        hasMemoryError: error.message.includes('Out of memory') || error.message.includes('RangeError'),
        errorType: error.constructor.name
      });
      
      // Check if this is a memory-related error on mobile and try Web Speech API fallback
      const isMemoryError = error.message.includes('Out of memory') || 
                           error.message.includes('RangeError') || 
                           error.isMemoryError;
      
      if (this.isMobileDevice() && isMemoryError) {
        console.log('Memory error detected on mobile device, attempting Web Speech API fallback...');
        const fallbackSuccess = await this.initializeWebSpeechFallback();
        if (fallbackSuccess) {
          console.log('Web Speech API fallback successful!');
          return true;
        } else {
          console.log('Web Speech API fallback failed, returning original error');
        }
      }
      
      this.notifyError(`Failed to initialize voice activation: ${error.message}`);
      return false;
    }
  }

  /**
   * Initialize Web Speech API fallback voice activation service
   * @returns {Promise<boolean>} - True if initialization successful
   */
  async initializeWebSpeechFallback() {
    try {
      console.log('Initializing Web Speech API fallback service...');
      
      // Check if Web Speech API is supported
      if (!webSpeechVoiceActivationService.isSupported) {
        throw new Error('Web Speech API not supported on this device');
      }
      
      const success = await webSpeechVoiceActivationService.initialize();
      
      if (success) {
        this.useWebSpeechFallback = true;
        
        // Set up callbacks for Web Speech service
        webSpeechVoiceActivationService.setWakeWordCallback(this.callbacks.onWakeWordDetected);
        webSpeechVoiceActivationService.setAudioLevelCallback(this.callbacks.onAudioLevelChange);
        webSpeechVoiceActivationService.setErrorCallback(this.callbacks.onError);
        webSpeechVoiceActivationService.setStatusCallback(this.callbacks.onStatusChange);
        
        this.notifyStatusChange('ready');
        console.log('Web Speech API fallback voice activation initialized successfully');
        return true;
      } else {
        throw new Error('Web Speech API fallback initialization failed');
      }
    } catch (error) {
      console.error('Web Speech API fallback initialization failed:', error);
      this.notifyError(`Web Speech API fallback initialization failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Start listening for wake words using Whisper or Web Speech API
   */
  async startListening() {
    if (this.isListening) return false;

    try {
      this.isListening = true;
      this.notifyStatusChange('listening');
      
      if (this.useWebSpeechFallback) {
        // Use Web Speech API fallback service
        return await webSpeechVoiceActivationService.startListening();
      } else {
        // Use primary Whisper-based service
        if (!this.audioContext) return false;
        
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        // Start audio level monitoring
        this.startAudioLevelMonitoring();
        
        // Start real-time wake word detection with Whisper
        await this.startRealTimeWakeWordDetection();
      }
      
      return true;
    } catch (error) {
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
    
    if (this.useWebSpeechFallback) {
      webSpeechVoiceActivationService.stopListening();
    } else {
      this.stopAudioLevelMonitoring();
      this.stopRealTimeWakeWordDetection();
    }
  }

  /**
   * Temporarily pause voice activation (for TTS playback)
   */
  pauseVoiceActivation() {
    if (this.isListening) {
      console.log('Pausing voice activation for TTS playback');
      
      if (this.useWebSpeechFallback) {
        webSpeechVoiceActivationService.pauseVoiceActivation();
      } else {
        this.stopRealTimeWakeWordDetection();
        this.stopAudioLevelMonitoring();
      }
    }
  }

  /**
   * Resume voice activation after TTS playback
   */
  resumeVoiceActivation() {
    if (this.isListening) {
      console.log('Resuming voice activation after TTS playback');
      
      if (this.useWebSpeechFallback) {
        webSpeechVoiceActivationService.resumeVoiceActivation();
      } else {
        this.startAudioLevelMonitoring();
        this.startRealTimeWakeWordDetection();
      }
    }
  }

  /**
   * Start monitoring audio levels with enhanced voice detection
   */
  startAudioLevelMonitoring() {
    if (!this.analyser) {
      console.warn('Analyser not available for audio level monitoring');
      return;
    }

    // Configure analyser for better voice detection
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const timeDataArray = new Float32Array(bufferLength);
    const frequencyDataArray = new Uint8Array(bufferLength);
    
    // Enhanced smoothing variables
    let smoothedLevel = 0.05;
    let peakLevel = 0.05;
    let voiceLevel = 0.05;
    let silenceThreshold = 0.01;
    let voiceThreshold = 0.05;
    
    // More reactive smoothing factors for frequent movement
    const attackFactor = 0.6;  // Very fast response to voice
    const decayFactor = 0.88;  // Faster decay for more movement
    const voiceSmoothing = 0.4; // Less smoothing for more reactive movement
    
    const monitor = () => {
      if (!this.isListening) {
        // Gradual fade to baseline when not listening
        smoothedLevel = smoothedLevel * 0.9 + 0.05 * 0.1;
        this.notifyAudioLevelChange(smoothedLevel);
        requestAnimationFrame(monitor);
        return;
      }
      
      try {
        // Get both time and frequency data for better voice detection
        this.analyser.getFloatTimeDomainData(timeDataArray);
        this.analyser.getByteFrequencyData(frequencyDataArray);
        
        // Calculate RMS from time domain (voice amplitude)
        let rmsSum = 0;
        for (let i = 0; i < timeDataArray.length; i++) {
          const sample = timeDataArray[i];
          rmsSum += sample * sample;
        }
        const rms = Math.sqrt(rmsSum / timeDataArray.length);
        
        // Calculate frequency-based voice level (human voice range: 85Hz - 255Hz)
        let voiceSum = 0;
        const voiceStart = Math.floor(85 * bufferLength / this.analyser.context.sampleRate);
        const voiceEnd = Math.floor(255 * bufferLength / this.analyser.context.sampleRate);
        
        for (let i = voiceStart; i < voiceEnd && i < frequencyDataArray.length; i++) {
          voiceSum += frequencyDataArray[i];
        }
        const voiceFreqLevel = voiceSum / (voiceEnd - voiceStart) / 255;
        
        // Combine RMS and frequency data for better voice detection
        const combinedLevel = (rms * 0.7 + voiceFreqLevel * 0.3);
        
        // Apply voice-specific thresholds with more reactive response
        if (combinedLevel > voiceThreshold) {
          // Voice detected - very fast attack for immediate response
          voiceLevel = voiceLevel * (1 - attackFactor) + combinedLevel * attackFactor;
        } else if (combinedLevel > silenceThreshold) {
          // Some audio but not clear voice - more responsive
          voiceLevel = voiceLevel * 0.7 + combinedLevel * 0.3;
        } else {
          // Silence - faster decay for more movement
          voiceLevel = voiceLevel * decayFactor;
        }
        
        // More reactive peak detection
        if (voiceLevel > peakLevel) {
          peakLevel = voiceLevel;
        } else {
          peakLevel = peakLevel * 0.92; // Faster peak decay for more movement
        }
        
        // Less smoothing for more frequent movement
        smoothedLevel = smoothedLevel * voiceSmoothing + peakLevel * (1 - voiceSmoothing);
        
        // Ensure minimum baseline and maximum level
        smoothedLevel = Math.max(0.05, Math.min(1.0, smoothedLevel));
        
        // Update the audio level
        this.notifyAudioLevelChange(smoothedLevel);
        
        requestAnimationFrame(monitor);
      } catch (error) {
        console.error('Error in audio level monitoring:', error);
        requestAnimationFrame(monitor);
      }
    };
    
    console.log('Starting enhanced voice level monitoring');
    monitor();
  }

  /**
   * Stop audio level monitoring
   */
  stopAudioLevelMonitoring() {
    // Audio level monitoring stops automatically when isListening becomes false
  }

  /**
   * Start real-time wake word detection using Whisper
   */
  async startRealTimeWakeWordDetection() {
    try {
      // Check if already listening
      if (this.isListening) {
        console.log('Already listening, stopping current session');
        this.stopListening();
      }

      // Ensure we have a media stream
      if (!this.mediaStream) {
        throw new Error('No media stream available. Call initialize() first.');
      }

      // Create MediaRecorder for continuous recording with ultra-conservative mobile settings
      const isMobile = this.isMobileDevice();
      const options = isMobile ? {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 32000 // Ultra-low bitrate for mobile to minimize memory usage
      } : {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000 // Higher quality for desktop
      };
      
      // Fallback to default if the preferred format isn't supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
      }
      
      // Additional mobile-specific optimizations
      if (isMobile) {
        options.videoBitsPerSecond = 0; // No video
        options.bitsPerSecond = options.audioBitsPerSecond;
        // Ultra-conservative mobile settings
        options.audioBitsPerSecond = Math.min(options.audioBitsPerSecond, 32000);
      }
      
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.processAudioChunk();
      };

      // Start recording in chunks
      this.mediaRecorder.start();
      this.isListening = true;
      
      // Start audio level monitoring for visual feedback
      this.startAudioLevelMonitoring();
      
      // Process audio with ultra-conservative mobile intervals
      const processingInterval = this.isMobileDevice() ? 3000 : 1000; // Much slower processing on mobile
      this.processingInterval = setInterval(() => {
        if (this.isListening && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
          this.mediaRecorder.start();
        }
      }, processingInterval);

      console.log('Real-time wake word detection started successfully');
      return true;

    } catch (error) {
      console.error('Failed to start real-time detection:', error);
      this.notifyError(`Failed to start real-time detection: ${error.message}`);
      return false;
    }
  }

  /**
   * Stop real-time wake word detection
   */
  stopRealTimeWakeWordDetection() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Process audio chunk for wake word detection using Whisper
   */
  async processAudioChunk() {
    if (!this.isListening || this.audioChunks.length === 0) return;

    try {
      this.isProcessing = true;
      this.notifyStatusChange('processing');

      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // Convert blob to audio buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Resample to 16kHz if needed (Whisper expects 16kHz)
      if (audioBuffer.sampleRate !== 16000) {
        const resampledBuffer = await this.resampleAudioBuffer(audioContext, audioBuffer, 16000);
        audioContext.close();
        return this.processAudioChunkWithBuffer(resampledBuffer);
      }
      
      // Process the audio buffer
      await this.processAudioChunkWithBuffer(audioBuffer);
      audioContext.close();
      
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      this.notifyError(`Audio processing error: ${error.message}`);
    } finally {
      this.isProcessing = false;
      this.notifyStatusChange('listening');
      this.audioChunks = []; // Clear chunks after processing
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
    console.log('🎤 VoiceActivationService: notifyWakeWordDetected called with:', wakeWord, transcription);
    console.log('🎤 VoiceActivationService: callback available:', !!this.callbacks.onWakeWordDetected);
    if (this.callbacks.onWakeWordDetected) {
      console.log('🎤 VoiceActivationService: Calling wake word callback...');
      this.callbacks.onWakeWordDetected(wakeWord, transcription);
    } else {
      console.error('🎤 VoiceActivationService: No wake word callback available!');
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
   * Process audio buffer for wake word detection
   */
  async processAudioChunkWithBuffer(audioBuffer) {
    // Check audio length - skip if too long
    const audioLengthSeconds = audioBuffer.length / audioBuffer.sampleRate;
    if (audioLengthSeconds > 25) {
      console.warn(`Audio chunk too long (${audioLengthSeconds.toFixed(1)}s), skipping transcription`);
      return;
    }
    
    // Check audio level - skip if too quiet (likely silence)
    const audioData = audioBuffer.getChannelData(0);
    const rms = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
    
    // Calculate peak without spreading large arrays (prevents stack overflow)
    let peak = 0;
    for (let i = 0; i < audioData.length; i++) {
      const abs = Math.abs(audioData[i]);
      if (abs > peak) peak = abs;
    }
    
    // Use both RMS and peak for better detection
    if (rms < 0.001 && peak < 0.01) { // Lower threshold for better sensitivity
      console.log(`Audio too quiet (RMS: ${rms.toFixed(6)}, Peak: ${peak.toFixed(6)}), skipping transcription`);
      return;
    }
    
    console.log(`Audio level - RMS: ${rms.toFixed(6)}, Peak: ${peak.toFixed(6)}`); // Debug audio level
    
      // Add timeout for transcription to prevent hanging
      const transcriptionPromise = whisperService.transcribeAudioBuffer(audioBuffer);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transcription timeout after 4 seconds')), 4000)
      );
    
    // Transcribe using Whisper with timeout
    const transcription = await Promise.race([transcriptionPromise, timeoutPromise]);
    
    console.log('Transcription result:', transcription); // Debug log
    
    // Filter out non-speech results
    const filteredTranscription = transcription
      .replace(/\[BLANK_AUDIO\]/gi, '')
      .replace(/\[MUSIC PLAYING\]/gi, '')
      .replace(/\[NOISE\]/gi, '')
      .replace(/\[SILENCE\]/gi, '')
      .replace(/\[SOUND\]/gi, '')
      .replace(/\[AUDIO\]/gi, '')
      .replace(/\[BACKGROUND NOISE\]/gi, '')
      .replace(/\(buzzing\)/gi, '') // Filter out buzzing sounds
      .replace(/\(static\)/gi, '') // Filter out static
      .replace(/\(noise\)/gi, '') // Filter out noise
      .replace(/\(growling\)/gi, '') // Filter out growling sounds
      .replace(/\(mumbling\)/gi, '') // Filter out mumbling
      .replace(/\(unclear\)/gi, '') // Filter out unclear speech
      .trim();
    
    // Only process if we have actual speech content
    if (filteredTranscription && filteredTranscription.length > 0) {
      console.log('Filtered transcription:', filteredTranscription);
      
      // Check for wake word variations
      const wakeWordVariations = [
        'hey buddy',
        'hey bud',
        'buddy',
        'hey',
        'buddy hey'
      ];
      
      const lowerTranscription = filteredTranscription.toLowerCase();
      const detectedVariation = wakeWordVariations.find(variation => 
        lowerTranscription.includes(variation)
      );
      
      if (detectedVariation) {
        console.log(`🎤 Wake word detected! Variation: "${detectedVariation}" in "${filteredTranscription}"`);
        this.notifyStatusChange('wake_word_detected');
        this.notifyWakeWordDetected('Hey Buddy', filteredTranscription);
      } else {
        console.log('🎤 No wake word variation found in:', filteredTranscription);
      }
    } else {
      console.log('No speech detected, skipping wake word check');
    }
  }

  /**
   * Resample audio buffer to target sample rate
   */
  async resampleAudioBuffer(audioContext, audioBuffer, targetSampleRate) {
    const sourceSampleRate = audioBuffer.sampleRate;
    const targetLength = Math.floor(audioBuffer.length * targetSampleRate / sourceSampleRate);
    
    const offlineContext = new OfflineAudioContext(1, targetLength, targetSampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    return await offlineContext.startRendering();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopListening();
    
    if (this.useWebSpeechFallback) {
      webSpeechVoiceActivationService.cleanup();
    } else {
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
      this.mediaRecorder = null;
      this.audioChunks = [];
    }
    
    this.useWebSpeechFallback = false;
  }

  /**
   * Get current status
   */
  getStatus() {
    if (this.useWebSpeechFallback) {
      const webSpeechStatus = webSpeechVoiceActivationService.getStatus();
      return {
        ...webSpeechStatus,
        useWebSpeechFallback: true
      };
    } else {
      return {
        isListening: this.isListening,
        isProcessing: this.isProcessing,
        isReady: !!this.audioContext,
        useWebSpeechFallback: false
      };
    }
  }
}

// Create singleton instance
const voiceActivationService = new VoiceActivationService();

export default voiceActivationService;
