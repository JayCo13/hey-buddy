import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import voiceActivationService from '../services/voiceActivationService';
import whisperService from '../services/whisperService';
import greetingService from '../services/greetingService';

const VoiceActivationContext = createContext();

export const useVoiceActivation = () => {
  const context = useContext(VoiceActivationContext);
  if (!context) {
    throw new Error('useVoiceActivation must be used within a VoiceActivationProvider');
  }
  return context;
};

export const VoiceActivationProvider = ({ children, onNavigateToRecord }) => {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0.05);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [currentGreeting, setCurrentGreeting] = useState('');
  const [greetingInitialized, setGreetingInitialized] = useState(false);
  const [useFallbackMode, setUseFallbackMode] = useState(false);
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    supportsWASM: true,
    memoryLimit: 'unknown',
    isMobile: false
  });

  // Detect device capabilities
  const detectDeviceCapabilities = useCallback(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const memoryInfo = navigator.deviceMemory || 4; // Default to 4GB if not available
    const supportsWASM = typeof WebAssembly !== 'undefined';
    
    // Check for memory constraints that might cause WASM issues
    const hasLowMemory = memoryInfo < 4 || isMobile;
    
    setDeviceCapabilities({
      supportsWASM,
      memoryLimit: memoryInfo,
      isMobile,
      hasLowMemory
    });

    // Use fallback mode on mobile or low-memory devices
    if (hasLowMemory || isMobile) {
      console.log('🔄 Using fallback voice activation mode for mobile/low-memory device');
      setUseFallbackMode(true);
    }

    return { isMobile, hasLowMemory, supportsWASM };
  }, []);

  // Trigger greeting speech
  const triggerGreetingSpeech = useCallback(async () => {
    try {
      console.log('🎤 Triggering greeting speech...');
      const greeting = await greetingService.generateGreeting();
      console.log('🎤 Greeting received:', greeting);
      setCurrentGreeting(greeting);
      setGreetingInitialized(true);
      
      // Use TTS to speak the greeting
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(greeting);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        // Pause voice activation during TTS
        if (useFallbackMode) {
          if (window.fallbackRecognition) {
            window.fallbackRecognition.stop();
          }
        } else {
          voiceActivationService.pauseVoiceActivation();
        }
        
        utterance.onend = () => {
          console.log('🎤 Greeting speech completed');
          // Resume voice activation after TTS
          if (useFallbackMode) {
            setTimeout(() => {
              // Restart fallback listening
              if (window.fallbackRecognition) {
                window.fallbackRecognition.start();
              }
            }, 1000);
          } else {
            voiceActivationService.resumeVoiceActivation();
          }
        };
        
        speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('Failed to trigger greeting speech:', err);
    }
  }, [useFallbackMode]);

  // Handle wake word detection
  const handleWakeWordDetected = useCallback(async (wakeWord, transcription) => {
    console.log('🎤 Wake word detected:', wakeWord, transcription);
    setIsListening(false);
    
    // Navigate to record room
    if (onNavigateToRecord) {
      console.log('🎤 Navigating to record room...');
      onNavigateToRecord();
    }
    
    // Trigger greeting speech
    await triggerGreetingSpeech();
  }, [triggerGreetingSpeech, onNavigateToRecord]);

  // Start audio level monitoring for fallback mode
  const startFallbackAudioLevelMonitoring = useCallback((analyser) => {
    const bufferLength = analyser.frequencyBinCount;
    const timeDataArray = new Float32Array(bufferLength);
    
    let smoothedLevel = 0.05;
    const monitor = () => {
      try {
        analyser.getFloatTimeDomainData(timeDataArray);
        
        let rmsSum = 0;
        for (let i = 0; i < timeDataArray.length; i++) {
          const sample = timeDataArray[i];
          rmsSum += sample * sample;
        }
        const rms = Math.sqrt(rmsSum / timeDataArray.length);
        
        // Smooth the audio level
        smoothedLevel = smoothedLevel * 0.8 + rms * 0.2;
        smoothedLevel = Math.max(0.05, Math.min(1.0, smoothedLevel));
        
        setAudioLevel(smoothedLevel);
        requestAnimationFrame(monitor);
      } catch (error) {
        console.error('Error in fallback audio monitoring:', error);
        requestAnimationFrame(monitor);
      }
    };
    
    monitor();
  }, []);

  // Start fallback listening using Web Speech API
  const startFallbackListening = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 Fallback speech recognition started');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      console.log('🎤 Fallback recognition result:', transcript);
      
      // Check for wake word
      if (transcript.includes('hey buddy') || transcript.includes('hey bud')) {
        console.log('🎤 Wake word detected via fallback!');
        recognition.stop();
        handleWakeWordDetected('Hey Buddy', transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('🎤 Fallback speech recognition ended');
      setIsListening(false);
      
      // Restart if we're still supposed to be listening
      if (isListening) {
        setTimeout(() => {
          recognition.start();
        }, 100);
      }
    };

    recognition.start();
    
    // Store for cleanup
    window.fallbackRecognition = recognition;
  }, [isListening, handleWakeWordDetected]);

  // Initialize fallback mode using Web Speech API
  const initializeFallbackMode = useCallback(async () => {
    // Check if Web Speech API is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported on this device');
    }

    // Initialize basic microphone access for audio level monitoring
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      // Create audio context for level monitoring
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);

      // Store for cleanup
      window.fallbackAudioContext = audioContext;
      window.fallbackStream = stream;
      window.fallbackAnalyser = analyser;

      // Start audio level monitoring
      startFallbackAudioLevelMonitoring(analyser);

      console.log('✅ Fallback voice activation initialized');
    } catch (err) {
      throw new Error(`Failed to initialize fallback mode: ${err.message}`);
    }
  }, [startFallbackAudioLevelMonitoring]);

  // Initialize WASM mode (original implementation)
  const initializeWASMMode = useCallback(async () => {
    // Initialize Whisper service with progress tracking
    await whisperService.initialize((progress) => {
      console.log(`Whisper loading: ${progress.stage} - ${progress.message}`);
    });

    // Initialize voice activation service
    const success = await voiceActivationService.initialize();
    if (!success) {
      throw new Error('Failed to initialize voice activation service');
    }

    // Set up callbacks
    voiceActivationService.setWakeWordCallback((wakeWord, transcription) => {
      console.log('🎤 Wake word detected:', wakeWord, transcription);
      handleWakeWordDetected(wakeWord, transcription);
    });

    voiceActivationService.setAudioLevelCallback((level) => {
      setAudioLevel(level);
    });

    voiceActivationService.setErrorCallback((error) => {
      console.error('Voice activation error:', error);
      setError(error);
    });

    voiceActivationService.setStatusCallback((status) => {
      console.log('Voice activation status:', status);
      if (status === 'listening') {
        setIsListening(true);
      } else if (status === 'ready') {
        setIsListening(false);
      }
    });
  }, [handleWakeWordDetected]);

  // Initialize voice activation with fallback support
  const initializeVoiceActivation = useCallback(async () => {
    try {
      setShowLoading(true);
      setError(null);

      // Initialize greeting service first
      console.log('🎤 Initializing greeting service...');
      await greetingService.initialize();

      const capabilities = detectDeviceCapabilities();
      
      if (useFallbackMode || capabilities.hasLowMemory) {
        console.log('🔄 Initializing fallback voice activation mode');
        await initializeFallbackMode();
      } else {
        console.log('🚀 Initializing full WASM voice activation mode');
        await initializeWASMMode();
      }

      setIsInitialized(true);
      console.log('✅ Voice activation initialized successfully');
      
    } catch (err) {
      console.error('❌ Voice activation initialization failed:', err);
      
      // Try fallback mode if WASM fails
      if (!useFallbackMode) {
        console.log('🔄 WASM failed, trying fallback mode...');
        setUseFallbackMode(true);
        try {
          await initializeFallbackMode();
          setIsInitialized(true);
          console.log('✅ Fallback voice activation initialized successfully');
        } catch (fallbackErr) {
          console.error('❌ Fallback initialization also failed:', fallbackErr);
          setError(`Voice activation initialization error: ${fallbackErr.message}`);
        }
      } else {
        setError(`Voice activation initialization error: ${err.message}`);
      }
    } finally {
      setShowLoading(false);
    }
  }, [useFallbackMode, detectDeviceCapabilities, initializeFallbackMode, initializeWASMMode]);

  // Start listening with fallback support
  const startListening = useCallback(async () => {
    try {
      if (useFallbackMode) {
        await startFallbackListening();
      } else {
        const success = await voiceActivationService.startListening();
        if (!success) {
          throw new Error('Failed to start voice activation service');
        }
      }
    } catch (err) {
      console.error('Failed to start listening:', err);
      setError(`Failed to start listening: ${err.message}`);
    }
  }, [useFallbackMode, startFallbackListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (useFallbackMode) {
      if (window.fallbackRecognition) {
        window.fallbackRecognition.stop();
        window.fallbackRecognition = null;
      }
    } else {
      voiceActivationService.stopListening();
    }
    setIsListening(false);
  }, [useFallbackMode]);

  // Initialize on mount
  useEffect(() => {
    initializeVoiceActivation();
    
    return () => {
      // Cleanup
      if (useFallbackMode) {
        if (window.fallbackRecognition) {
          window.fallbackRecognition.stop();
        }
        if (window.fallbackStream) {
          window.fallbackStream.getTracks().forEach(track => track.stop());
        }
        if (window.fallbackAudioContext) {
          window.fallbackAudioContext.close();
        }
      } else {
        voiceActivationService.cleanup();
      }
      whisperService.cleanup();
    };
  }, [initializeVoiceActivation, useFallbackMode]);

  const value = {
    isListening,
    audioLevel,
    error,
    isInitialized,
    showLoading,
    currentGreeting,
    greetingInitialized,
    useFallbackMode,
    deviceCapabilities,
    startListening,
    stopListening,
    triggerGreetingSpeech,
    initializeVoiceActivation
  };

  return (
    <VoiceActivationContext.Provider value={value}>
      {children}
    </VoiceActivationContext.Provider>
  );
};

export default VoiceActivationContext;