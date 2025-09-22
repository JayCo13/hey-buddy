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
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    supportsWASM: true,
    memoryLimit: 'unknown',
    isMobile: false
  });

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

  // Trigger greeting speech
  const triggerGreetingSpeech = useCallback(async () => {
    try {
      console.log('🎤 Triggering greeting speech...');
      const greetingObj = await greetingService.generateGreeting();
      console.log('🎤 Greeting received:', greetingObj);
      
      // Extract the text from the greeting object
      const greetingText = greetingObj.text || greetingObj;
      console.log('🎤 Greeting text:', greetingText);
      
      setCurrentGreeting(greetingObj);
      setGreetingInitialized(true);
      
      // Use TTS to speak the greeting
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(greetingText);
        utterance.rate = 1.0; // Faster rate for smoother experience
        utterance.pitch = 1.0;
        utterance.volume = 0.9; // Higher volume for clarity
        
        // Pause voice activation during TTS
        if (useFallbackMode) {
          if (window.fallbackRecognition) {
            window.fallbackRecognition.stop();
            window.fallbackRecognition = null; // Clear reference to prevent restart
          }
        } else {
          voiceActivationService.pauseVoiceActivation();
        }
        
        utterance.onend = () => {
          console.log('🎤 Greeting speech completed');
          // Auto-start hands-free listening after greeting with shorter delay
          setTimeout(() => {
            console.log('🎤 Auto-starting hands-free listening...');
            if (useFallbackMode) {
              startFallbackListeningRef.current();
            } else {
              voiceActivationService.startListening();
            }
          }, 1000); // Reduced delay for smoother experience
        };
        
        utterance.onerror = (event) => {
          console.error('🎤 TTS Error:', event.error);
          // On mobile, TTS might fail due to user interaction requirement
          // Still start listening even if TTS fails
          setTimeout(() => {
            console.log('🎤 Starting listening after TTS error...');
            if (useFallbackMode) {
              startFallbackListeningRef.current();
            } else {
              voiceActivationService.startListening();
            }
          }, 500); // Faster recovery
        };
        
        // Try to speak, but don't fail if it doesn't work on mobile
        try {
          speechSynthesis.speak(utterance);
        } catch (ttsError) {
          console.warn('🎤 TTS failed (likely mobile restriction):', ttsError);
          // Still start listening even if TTS fails
          setTimeout(() => {
            console.log('🎤 Starting listening after TTS failure...');
            if (useFallbackMode) {
              startFallbackListeningRef.current();
            } else {
              voiceActivationService.startListening();
            }
          }, 500); // Faster recovery
        }
      } else {
        console.warn('🎤 Speech synthesis not available');
        // Start listening immediately if no TTS
        setTimeout(() => {
          console.log('🎤 Starting listening (no TTS)...');
          if (useFallbackMode) {
            startFallbackListeningRef.current();
          } else {
            voiceActivationService.startListening();
          }
        }, 500); // Faster start
      }
    } catch (err) {
      console.error('Failed to trigger greeting speech:', err);
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
      
      // Trigger greeting only after microphone permission is granted and listening starts
      if (!greetingInitialized) {
        console.log('🎤 Microphone permission granted, triggering greeting...');
        setTimeout(() => {
          triggerGreetingSpeech();
          setGreetingInitialized(true);
        }, 1000); // Small delay to ensure recognition is fully started
      }
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
      
      // Don't show "aborted" errors as they're normal during navigation
      if (event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
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
  }, [onNavigateToRecord, greetingInitialized, triggerGreetingSpeech]);

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

  // Start listening with fallback support
  const startListening = useCallback(async () => {
    try {
      if (useFallbackMode) {
        await startFallbackListeningRef.current();
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
  }, [useFallbackMode]);

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

  // Trigger immediate greeting when initialized (only once)
  useEffect(() => {
    if (isInitialized && !greetingInitialized) {
      console.log('🎤 Voice activation initialized, checking microphone permission...');
      
      // Check if microphone permission is granted before triggering greeting
      const checkMicrophonePermission = async () => {
        try {
          // Try to get microphone access to check permission
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('🎤 Microphone permission granted, triggering greeting...');
          
          // Stop the test stream immediately
          stream.getTracks().forEach(track => track.stop());
          
          // Now trigger the greeting
          if (useFallbackMode) {
            console.log('🎤 Mobile mode: Starting listening first, greeting will play after user interaction');
            // Start listening immediately on mobile
            setTimeout(() => {
              startFallbackListeningRef.current();
            }, 500);
          } else {
            // Desktop: play greeting first
            setTimeout(() => {
              triggerGreetingSpeech();
            }, 500);
          }
          
          setGreetingInitialized(true);
        } catch (error) {
          console.log('🎤 Microphone permission not granted yet, waiting for user interaction...');
          
          // On mobile, start listening anyway - greeting will play after permission is granted
          if (useFallbackMode) {
            console.log('🎤 Mobile mode: Starting listening, greeting will play after permission granted');
            setTimeout(() => {
              startFallbackListeningRef.current();
            }, 500);
          }
          
          // Don't mark as initialized yet - wait for permission
          // The greeting will be triggered when permission is granted
        }
      };
      
      checkMicrophonePermission();
    }
  }, [isInitialized, greetingInitialized, triggerGreetingSpeech, useFallbackMode]);

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