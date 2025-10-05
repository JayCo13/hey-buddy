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

  // New state variables for proper state management
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceActivationReady, setVoiceActivationReady] = useState(false);
  const [speechInProgress, setSpeechInProgress] = useState(false);
  const [voiceActivationState, setVoiceActivationState] = useState('initializing'); // 'initializing', 'ready', 'speaking', 'listening', 'error'

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

  // Trigger greeting speech with proper state management
  const triggerGreetingSpeech = useCallback(async () => {
    try {
      // Check if we're in a valid state to start greeting (less restrictive)
      if (speechInProgress) {
        console.log('🎤 Cannot start greeting - speech already in progress');
        return;
      }

      console.log('🎤 Triggering greeting speech...');
      setVoiceActivationState('speaking');
      setIsSpeaking(true);
      setSpeechInProgress(true);
      
      const greetingObj = await greetingService.generateGreeting();
      console.log('🎤 Greeting received:', greetingObj);
      
      // Extract the text from the greeting object
      const greetingText = greetingObj.text || greetingObj;
      console.log('🎤 Greeting text:', greetingText);
      
      setCurrentGreeting(greetingObj);
      setGreetingInitialized(true);
      
      // Completely pause voice activation during TTS
      await pauseVoiceActivationCompletely();
      
      // Use TTS to speak the greeting
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(greetingText);
        utterance.rate = 1.0; // Faster rate for smoother experience
        utterance.pitch = 1.0;
        utterance.volume = 0.9; // Higher volume for clarity
        
        utterance.onstart = () => {
          console.log('🎤 TTS started');
        };
        
        utterance.onend = () => {
          console.log('🎤 Greeting speech completed');
          setIsSpeaking(false);
          setSpeechInProgress(false);
          
          // Wait a bit before resuming voice activation
          setTimeout(async () => {
            console.log('🎤 Resuming voice activation after greeting...');
            await resumeVoiceActivation();
            setVoiceActivationState('ready');
            
            // Auto-start hands-free listening after greeting
            setTimeout(() => {
              console.log('🎤 Auto-starting hands-free listening...');
              startListening();
            }, 500); // Shorter delay for smoother experience
          }, 300); // Brief pause to ensure TTS is completely finished
        };
        
        utterance.onerror = (event) => {
          console.error('🎤 TTS Error:', event.error);
          setIsSpeaking(false);
          setSpeechInProgress(false);
          
          // Resume voice activation even if TTS fails
          setTimeout(async () => {
            console.log('🎤 Resuming voice activation after TTS error...');
            await resumeVoiceActivation();
            setVoiceActivationState('ready');
            
            // Start listening after error recovery
            setTimeout(() => {
              console.log('🎤 Starting listening after TTS error recovery...');
              startListening();
            }, 500);
          }, 300);
        };
        
        // Try to speak, but don't fail if it doesn't work on mobile
        try {
          speechSynthesis.speak(utterance);
        } catch (ttsError) {
          console.warn('🎤 TTS failed (likely mobile restriction):', ttsError);
          setIsSpeaking(false);
          setSpeechInProgress(false);
          
          // Resume voice activation even if TTS fails
          setTimeout(async () => {
            console.log('🎤 Resuming voice activation after TTS failure...');
            await resumeVoiceActivation();
            setVoiceActivationState('ready');
            
            // Start listening after failure recovery
            setTimeout(() => {
              console.log('🎤 Starting listening after TTS failure recovery...');
              startListening();
            }, 500);
          }, 300);
        }
      } else {
        console.warn('🎤 Speech synthesis not available');
        setIsSpeaking(false);
        setSpeechInProgress(false);
        setVoiceActivationState('ready');
        
        // Start listening immediately if no TTS
        setTimeout(() => {
          console.log('🎤 Starting listening (no TTS)...');
          startListening();
        }, 500);
      }
    } catch (err) {
      console.error('Failed to trigger greeting speech:', err);
      setIsSpeaking(false);
      setSpeechInProgress(false);
      setVoiceActivationState('error');
      setError(`Greeting failed: ${err.message}`);
    }
  }, [useFallbackMode, voiceActivationState, speechInProgress, pauseVoiceActivationCompletely, resumeVoiceActivation, startListening]);

  // Completely pause voice activation during TTS
  const pauseVoiceActivationCompletely = useCallback(async () => {
    console.log('🎤 Pausing voice activation completely...');
    
    if (useFallbackMode) {
      // Stop fallback recognition
      if (window.fallbackRecognition) {
        window.fallbackRecognition.stop();
        window.fallbackRecognition = null;
      }
      
      // Stop audio level monitoring
      if (window.fallbackAnalyser) {
        // Clear any ongoing monitoring
        window.fallbackAnalyser = null;
      }
    } else {
      // Pause WASM voice activation
      voiceActivationService.pauseVoiceActivation();
    }
    
    setIsListening(false);
    setAudioLevel(0.05); // Reset audio level
  }, [useFallbackMode]);

  // Resume voice activation after TTS
  const resumeVoiceActivation = useCallback(async () => {
    console.log('🎤 Resuming voice activation...');
    
    if (useFallbackMode) {
      // Restart fallback recognition if needed
      if (!window.fallbackRecognition) {
        // Will be restarted by startListening if needed
        console.log('🎤 Fallback recognition will be restarted when needed');
      }
    } else {
      // Resume WASM voice activation
      voiceActivationService.resumeVoiceActivation();
    }
  }, [useFallbackMode]);

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

    // Initialize basic microphone access for audio level monitoring
    try {
      console.log('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      console.log('✅ Microphone permission granted');
      setMicrophonePermissionGranted(true);
      
      // Store permission in localStorage for persistence
      localStorage.setItem('microphonePermissionGranted', 'true');
      localStorage.setItem('microphonePermissionTime', Date.now().toString());

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
      console.error('❌ Microphone permission denied or failed:', err);
      setMicrophonePermissionGranted(false);
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

  // Start listening with fallback support and proper state management
  const startListening = useCallback(async () => {
    try {
      // Check if we're in a valid state to start listening (less restrictive)
      if (speechInProgress) {
        console.log('🎤 Cannot start listening - speech in progress');
        return;
      }

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
  }, [useFallbackMode, voiceActivationState, speechInProgress]);

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

  // Trigger immediate greeting when voice activation is ready (only once)
  useEffect(() => {
    if (voiceActivationReady && !greetingInitialized) {
      console.log('🎤 Voice activation ready, checking conditions for greeting...');
      
      // On mobile, we need user interaction for TTS AND microphone permission for listening
      if (useFallbackMode) {
        if (microphonePermissionGranted) {
          console.log('🎤 Mobile mode: Microphone permission granted, starting greeting...');
          // Start greeting first, then listening will start after greeting completes
          setTimeout(() => {
            triggerGreetingSpeech();
          }, 500);
        } else {
          console.log('🎤 Mobile mode: Waiting for microphone permission before greeting...');
        }
      } else {
        // Desktop: play greeting first (no microphone permission needed for TTS)
        console.log('🎤 Desktop mode: Starting greeting immediately...');
        setTimeout(() => {
          triggerGreetingSpeech();
        }, 500); // Reduced delay for faster greeting
      }
    }
  }, [voiceActivationReady, greetingInitialized, triggerGreetingSpeech, useFallbackMode, microphonePermissionGranted]);

  // Fallback greeting trigger - if greeting hasn't been triggered after 3 seconds, try anyway
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (isInitialized && !greetingInitialized && !speechInProgress) {
        console.log('🎤 Fallback: Triggering greeting after timeout...');
        triggerGreetingSpeech();
      }
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, [isInitialized, greetingInitialized, speechInProgress, triggerGreetingSpeech]);

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
    // New state variables
    isSpeaking,
    voiceActivationReady,
    speechInProgress,
    voiceActivationState,
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
