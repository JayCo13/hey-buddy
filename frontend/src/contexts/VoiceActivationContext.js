import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [currentGreeting, setCurrentGreeting] = useState('');
  const [greetingInitialized, setGreetingInitialized] = useState(false);
  const [useFallbackMode, setUseFallbackMode] = useState(false);
  const [microphonePermissionGranted, setMicrophonePermissionGranted] = useState(false);
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    supportsWASM: true,
    memoryLimit: 'unknown',
    isMobile: false
  });

  // Simplified state management
  const [voiceActivationReady, setVoiceActivationReady] = useState(false);
  const [voiceActivationState, setVoiceActivationState] = useState('initializing'); // 'initializing', 'audio_loading', 'ready', 'speaking', 'listening', 'error'
  const [audioSystemReady, setAudioSystemReady] = useState(false);

  // Ref to avoid circular dependency
  const startFallbackListeningRef = useRef();

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

  // Simple start listening function
  const startListening = useCallback(async () => {
    try {
      console.log('🎤 Starting listening...');
      setVoiceActivationState('listening');
      
      if (useFallbackMode) {
        await startFallbackListeningRef.current();
      } else {
        const success = await voiceActivationService.startListening();
        if (!success) {
          throw new Error('Failed to start voice activation service');
        }
      }
      
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start listening:', err);
      setVoiceActivationState('error');
      setError(`Failed to start listening: ${err.message}`);
    }
  }, [useFallbackMode]);

  // NEW SIMPLE GREETING FUNCTION - Fast and smooth
  const triggerGreetingSpeech = useCallback(async () => {
    try {
      console.log('🎤 Starting simple greeting...');
      setVoiceActivationState('speaking');
      setGreetingInitialized(true);
      
      // Get simple greeting text (no complex AI generation)
      const greetingText = "Hey Jayden! I'm ready to help you.";
      setCurrentGreeting({ text: greetingText, emoji: '👋' });
      
      // Simple TTS without complex state management
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(greetingText);
        utterance.rate = 1.2; // Slightly faster for better UX
        utterance.volume = 0.8;
        
        utterance.onend = () => {
          console.log('🎤 Greeting completed - starting listening');
          setVoiceActivationState('ready');
          
          // Start listening immediately after greeting
          setTimeout(() => {
            startListening();
          }, 100); // Very short delay
        };
        
        utterance.onerror = () => {
          console.log('🎤 TTS failed - starting listening anyway');
          setVoiceActivationState('ready');
          setTimeout(() => {
            startListening();
          }, 100);
        };
        
        // Speak immediately
        speechSynthesis.speak(utterance);
      } else {
        // No TTS available - just start listening
        console.log('🎤 No TTS - starting listening immediately');
        setVoiceActivationState('ready');
        setTimeout(() => {
          startListening();
        }, 100);
      }
    } catch (err) {
      console.error('Greeting error:', err);
      setVoiceActivationState('ready');
      setTimeout(() => {
        startListening();
      }, 100);
    }
  }, [startListening]);

  // Start fallback listening using Web Speech API
  const startFallbackListening = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('🎤 Speech recognition not supported');
      setError('Speech recognition not supported on this device');
      return;
    }
    
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
      
      // Filter out common TTS artifacts
      if (transcript.includes('object') || transcript.includes('undefined') || transcript.length < 3) {
        console.log('🎤 Filtered out TTS artifact:', transcript);
        return;
      }
      
      // Check for wake word variations (matching the main service)
      const wakeWordVariations = [
        // Original "hey buddy" variations
        'hey buddy',
        'hey bud',
        'buddy',
        'hey',
        'buddy hey',
        // New "Hi there!" variations
        'hi there',
        'hi there!',
        'hi',
        'there',
        'hello there',
        'hey there',
        // New "What's up?" variations
        "what's up",
        "what's up?",
        "whats up",
        "whats up?",
        "what up",
        "what up?",
        "sup",
        "wassup",
        "what is up"
      ];
      
      const detectedVariation = wakeWordVariations.find(variation => 
        transcript.includes(variation)
      );
      
      if (detectedVariation) {
        console.log(`🎤 Wake word detected via fallback! Variation: "${detectedVariation}" in "${transcript}"`);
        recognition.stop();
        
        // Determine which wake word category was detected
        let wakeWordCategory = 'Voice Assistant';
        if (detectedVariation.includes('buddy') || detectedVariation.includes('hey')) {
          wakeWordCategory = 'Hey Buddy';
        } else if (detectedVariation.includes('hi') || detectedVariation.includes('there') || detectedVariation.includes('hello')) {
          wakeWordCategory = 'Hi There';
        } else if (detectedVariation.includes('up') || detectedVariation.includes('sup') || detectedVariation.includes('what')) {
          wakeWordCategory = "What's Up";
        }
        
        console.log('🎤 Wake word detected:', wakeWordCategory, transcript);
        setIsListening(false);
        
        // Navigate to record room
        if (onNavigateToRecord) {
          console.log('🎤 Navigating to record room...');
          onNavigateToRecord();
        } else {
          console.error('🎤 onNavigateToRecord not available!');
        }
        
        // Don't trigger greeting speech again - it was already played on page load
        console.log('🎤 Wake word detected, navigation triggered');
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Only show critical errors, ignore common non-critical ones
      const nonCriticalErrors = ['aborted', 'network', 'audio-capture'];
      
      if (!nonCriticalErrors.includes(event.error)) {
        setError(`Speech recognition error: ${event.error}`);
      } else {
        console.warn('Non-critical speech recognition error (not shown to user):', event.error);
      }
      
      setIsListening(false);
      
      // Try to restart after error (except for certain fatal errors)
      if (event.error !== 'not-allowed' && event.error !== 'service-not-allowed') {
        setTimeout(() => {
          console.log('🎤 Restarting recognition after error...');
          recognition.start();
        }, 1000); // Reduced delay for faster recovery
      }
    };

    recognition.onend = () => {
      console.log('🎤 Fallback speech recognition ended');
      setIsListening(false);
      
      // Always restart recognition after a delay (except for fatal errors)
      setTimeout(() => {
        console.log('🎤 Restarting recognition...');
        try {
          recognition.start();
        } catch (restartError) {
          console.error('🎤 Failed to restart recognition:', restartError);
        }
      }, 1000); // Reduced delay for faster restart
    };

    try {
      recognition.start();
      console.log('🎤 Started fallback recognition');
    } catch (startError) {
      console.error('🎤 Failed to start recognition:', startError);
      setError(`Failed to start speech recognition: ${startError.message}`);
    }
    
    // Store for cleanup
    window.fallbackRecognition = recognition;
  }, [onNavigateToRecord]);

  // Assign function to ref
  startFallbackListeningRef.current = startFallbackListening;

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

  // Initialize fallback mode using Web Speech API
  const initializeFallbackMode = useCallback(async () => {
    // Check if Web Speech API is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported on this device');
    }

    // Set state to audio loading
    setVoiceActivationState('audio_loading');
    console.log('🎤 Starting audio system initialization...');

    // Initialize basic microphone access for audio level monitoring
    try {
      console.log('🎤 Step 1: Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      console.log('✅ Step 1: Microphone permission granted');
      setMicrophonePermissionGranted(true);
      
      // Store permission in localStorage for persistence
      localStorage.setItem('microphonePermissionGranted', 'true');
      localStorage.setItem('microphonePermissionTime', Date.now().toString());

      console.log('🎤 Step 2: Creating audio context...');
      // Create audio context for level monitoring
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Ensure audio context is running (required for mobile browsers)
      if (audioContext.state === 'suspended') {
        console.log('🎤 Step 3: Resuming suspended audio context...');
        await audioContext.resume();
      }
      
      console.log('🎤 Step 4: Setting up audio pipeline...');
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);

      // Store for cleanup
      window.fallbackAudioContext = audioContext;
      window.fallbackStream = stream;
      window.fallbackAnalyser = analyser;

      console.log('🎤 Step 5: Quick audio context check...');
      // Simple check - if not running, try to resume once
      if (audioContext.state !== 'running') {
        console.log(`🎤 Audio context state: ${audioContext.state}, resuming...`);
        await audioContext.resume();
        await new Promise(resolve => setTimeout(resolve, 200)); // Quick wait
      }
      
      console.log('🎤 Step 6: Starting audio monitoring...');
      // Start audio level monitoring
      startFallbackAudioLevelMonitoring(analyser);
      
      console.log('🎤 Step 7: Quick stabilization...');
      // Short stabilization
      await new Promise(resolve => setTimeout(resolve, 300)); // Much shorter
      
      console.log('✅ Audio system ready!');
      setAudioSystemReady(true);
      setVoiceActivationState('ready');

      console.log('✅ Fallback voice activation initialized');
    } catch (err) {
      console.error('❌ Microphone permission denied or failed:', err);
      setMicrophonePermissionGranted(false);
      setVoiceActivationState('error');
      throw new Error(`Failed to initialize fallback mode: ${err.message}`);
    }
  }, [startFallbackAudioLevelMonitoring]);

  // Initialize WASM mode (original implementation)
  const initializeWASMMode = useCallback(async () => {
    // Set state to audio loading
    setVoiceActivationState('audio_loading');
    console.log('🎤 Starting WASM audio system initialization...');

    console.log('🎤 Step 1: Initializing Whisper service...');
    // Initialize Whisper service with progress tracking
    await whisperService.initialize((progress) => {
      console.log(`Whisper loading: ${progress.stage} - ${progress.message}`);
    });

    console.log('🎤 Step 2: Initializing voice activation service...');
    // Initialize voice activation service
    const success = await voiceActivationService.initialize();
    if (!success) {
      throw new Error('Failed to initialize voice activation service');
    }

    console.log('🎤 Step 3: Quick WASM stabilization...');
    // Quick stabilization
    await new Promise(resolve => setTimeout(resolve, 200)); // Much faster
    
    console.log('✅ WASM audio system ready!');
    setAudioSystemReady(true);
    setVoiceActivationState('ready');

    // Set up callbacks
    voiceActivationService.setWakeWordCallback((wakeWord, transcription) => {
      console.log('🎤 Wake word detected:', wakeWord, transcription);
      setIsListening(false);
      
      // Navigate to record room
      if (onNavigateToRecord) {
        console.log('🎤 Navigating to record room...');
        onNavigateToRecord();
      }
      
      // Don't trigger greeting speech again - it was already played on page load
      console.log('🎤 Wake word detected, navigation triggered');
    });

    voiceActivationService.setAudioLevelCallback((level) => {
      setAudioLevel(level);
    });

    voiceActivationService.setErrorCallback((error) => {
      console.error('Voice activation error:', error);
      
      // Only show critical errors, ignore non-critical ones
      const criticalErrors = [
        'not-allowed',
        'service-not-allowed', 
        'no available backend',
        'Out of memory',
        'Failed to initialize',
        'Failed to start'
      ];
      
      const isCriticalError = criticalErrors.some(criticalError => 
        error.toLowerCase().includes(criticalError.toLowerCase())
      );
      
      if (isCriticalError) {
        setError(error);
      } else {
        // Log non-critical errors but don't show them to user
        console.warn('Non-critical voice activation error (not shown to user):', error);
      }
    });

    voiceActivationService.setStatusCallback((status) => {
      console.log('Voice activation status:', status);
      if (status === 'listening') {
        setIsListening(true);
      } else if (status === 'ready') {
        setIsListening(false);
      }
    });

    // WASM mode doesn't require explicit microphone permission dialog
    setMicrophonePermissionGranted(true);
    
    // Store permission in localStorage for persistence
    localStorage.setItem('microphonePermissionGranted', 'true');
    localStorage.setItem('microphonePermissionTime', Date.now().toString());
    
    console.log('✅ WASM voice activation initialized');
  }, [onNavigateToRecord]);

  // Initialize voice activation with fallback support
  const initializeVoiceActivation = useCallback(async () => {
    try {
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
      
      // Set ready state after a brief delay to ensure everything is properly initialized
      setTimeout(() => {
        setVoiceActivationReady(true);
        setVoiceActivationState('ready');
        console.log('🎤 Voice activation is now ready');
      }, 1000);
      
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
    }
  }, [useFallbackMode, detectDeviceCapabilities, initializeFallbackMode, initializeWASMMode]);


  // Stop listening with proper state management
  const stopListening = useCallback(() => {
    console.log('🎤 Stopping listening...');
    
    if (useFallbackMode) {
      if (window.fallbackRecognition) {
        window.fallbackRecognition.stop();
        window.fallbackRecognition = null;
      }
    } else {
      voiceActivationService.stopListening();
    }
    
    setIsListening(false);
    setVoiceActivationState('ready');
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

  // NEW SIMPLE GREETING SYSTEM - No complex logic, just smooth operation
  useEffect(() => {
    // Simple rule: Only greet when everything is ready and user hasn't been greeted yet
    if (voiceActivationReady && audioSystemReady && !greetingInitialized) {
      console.log('🎤 Systems ready - starting simple greeting...');
      
      // Immediate greeting - no delays, no complex logic
      triggerGreetingSpeech();
    }
  }, [voiceActivationReady, audioSystemReady, greetingInitialized, triggerGreetingSpeech]);

  // Restart listening when user returns to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized && useFallbackMode) {
        console.log('🎤 Page became visible, restarting voice recognition...');
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
          if (!window.fallbackRecognition || window.fallbackRecognition.state === 'ended') {
            console.log('🎤 Restarting fallback recognition...');
            startFallbackListeningRef.current();
          }
        }, 500); // Reduced delay for faster restart
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInitialized, useFallbackMode]);

  const value = {
    isListening,
    audioLevel,
    error,
    isInitialized,
    currentGreeting,
    greetingInitialized,
    useFallbackMode,
    microphonePermissionGranted,
    deviceCapabilities,
    // Simplified state variables
    voiceActivationReady,
    voiceActivationState,
    audioSystemReady,
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
