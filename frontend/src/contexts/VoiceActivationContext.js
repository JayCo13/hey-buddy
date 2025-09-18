import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import voiceActivationService from '../services/voiceActivationService';
import whisperService from '../services/whisperService';
import greetingService from '../services/greetingService';
import piperService from '../services/piperService';
import mobileVoiceService from '../services/mobileVoiceService';
import mobileGreetingService from '../services/mobileGreetingService';
import deviceDetection from '../utils/deviceDetection';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  
  // Device detection and service selection
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [voiceService, setVoiceService] = useState(null);
  const [isMobileMode, setIsMobileMode] = useState(false);
  
  // Greeting system state
  const [currentGreeting, setCurrentGreeting] = useState(null);
  const [greetingInitialized, setGreetingInitialized] = useState(false);
  
  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const isRecordingRef = useRef(false);

  // Initialize device detection and voice service
  const initializeVoiceService = async () => {
    try {
      console.log('🔍 Detecting device capabilities...');
      
      // Get device information
      const deviceInfo = deviceDetection.getOptimizedSettings();
      setDeviceInfo(deviceInfo);
      
      console.log('📱 Device info:', deviceInfo);
      
      // Determine which voice service to use (more permissive)
      let service;
      if (deviceInfo.fallbackMode || !deviceInfo.useAIModels) {
        console.log('📱 Using mobile voice service (fallback mode)');
        service = mobileVoiceService;
        setIsMobileMode(true);
      } else {
        console.log('🖥️ Using full voice activation service (will try Whisper)');
        service = voiceActivationService;
        setIsMobileMode(false);
      }
      
      setVoiceService(service);
      
      // Initialize the selected service
      console.log('🚀 Initializing voice service...');
      const success = await service.initialize();
      
      if (success) {
        console.log('✅ Voice service initialized successfully');
        setIsInitialized(true);
        setStatus('ready');
      } else {
        throw new Error('Voice service initialization failed');
      }
      
    } catch (error) {
      console.error('❌ Voice service initialization failed:', error);
      
      // Fallback to mobile service if full service fails
      if (!isMobileMode) {
        console.log('🔄 Falling back to mobile voice service...');
        try {
          const mobileService = mobileVoiceService;
          const mobileSuccess = await mobileService.initialize();
          
          if (mobileSuccess) {
            setVoiceService(mobileService);
            setIsMobileMode(true);
            setIsInitialized(true);
            setStatus('ready');
            console.log('✅ Mobile voice service fallback successful');
          } else {
            throw new Error('Mobile service also failed');
          }
        } catch (mobileError) {
          console.error('❌ Mobile service fallback also failed:', mobileError);
          setError(`Voice activation unavailable: ${mobileError.message}`);
          setStatus('error');
        }
      } else {
        setError(`Voice activation unavailable: ${error.message}`);
        setStatus('error');
      }
    }
  };

  // Initialize greeting system (non-blocking)
  const initializeGreetingSystem = async () => {
    try {
      console.log('Initializing greeting system...');
      
      // Determine which greeting service to use based on device capabilities
      const deviceInfo = deviceDetection.getOptimizedSettings();
      let greetingServiceToUse;
      
      if (deviceInfo.fallbackMode || !deviceInfo.useAIModels || !deviceDetection.canHandleAIModels()) {
        console.log('Using mobile greeting service (device cannot handle AI models)');
        greetingServiceToUse = mobileGreetingService;
      } else {
        console.log('Using full greeting service');
        greetingServiceToUse = greetingService;
      }
      
      // Initialize the selected greeting service
      const greetingServiceReady = await greetingServiceToUse.initialize();
      console.log('Greeting service initialized:', greetingServiceReady);
      
      // Generate greeting immediately
      console.log('Generating initial greeting...');
      const greeting = await greetingServiceToUse.generateGreeting();
      console.log('Generated greeting:', greeting);
      
      setCurrentGreeting(greeting);
      setGreetingInitialized(true);
      console.log('Greeting system initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize greeting system:', error);
      
      // Set a fallback greeting immediately
      const fallbackGreeting = {
        text: `Hello! What can I help you with?`,
        emoji: '👋',
        mood: 'neutral',
        timeOfDay: 'unknown',
        context: {
          suggestions: ['Say "Hey Buddy" to start recording', 'Check your notes', 'Review your tasks'],
          activities: ['Voice recording', 'Note taking', 'Task management']
        },
        timestamp: new Date().toISOString(),
        type: 'fallback_greeting'
      };
      
      console.log('Setting fallback greeting:', fallbackGreeting);
      setCurrentGreeting(fallbackGreeting);
      setGreetingInitialized(true);
    }
  };

  // Track if greeting has been spoken to prevent duplicates
  const greetingSpokenRef = useRef(false);

  // Ultra-fast greeting speech
  const speakInitialGreeting = async () => {
    if (greetingSpokenRef.current || !currentGreeting) return;
    
    try {
      greetingSpokenRef.current = true;
      console.log('Speaking greeting now:', currentGreeting.text);
      await speakGreeting(currentGreeting);
      console.log('Greeting spoken successfully!');
    } catch (error) {
      console.error('Greeting speech failed:', error);
      greetingSpokenRef.current = false;
    }
  };

  // Test speech function for debugging
  const testSpeech = async () => {
    try {
      console.log('Testing speech with simple text...');
      await piperService.speakText('Hey! This is a test of the speech system.');
      console.log('Speech test completed successfully');
    } catch (error) {
      console.error('Speech test failed:', error);
    }
  };

  // Force speak greeting function
  const forceSpeakGreeting = async () => {
    try {
      console.log('Force speaking greeting...');
      greetingSpokenRef.current = false; // Reset flag
      await speakInitialGreeting();
    } catch (error) {
      console.error('Force speak greeting failed:', error);
    }
  };

  // Debug function to check current state
  const debugState = () => {
    console.log('=== DEBUG STATE ===');
    console.log('Current greeting:', currentGreeting);
    console.log('Greeting initialized:', greetingInitialized);
    console.log('Piper service ready:', piperService.isReady());
    console.log('Piper service status:', piperService.getStatus());
    console.log('Greeting service status:', greetingService.getServiceStatus());
    console.log('==================');
  };

  // Ultra-fast greeting speech
  const speakGreeting = async (greeting) => {
    try {
      await piperService.speakText(greeting.text);
    } catch (error) {
      console.error('Greeting speech failed:', error);
    }
  };

  // Generate new greeting
  const generateNewGreeting = async () => {
    try {
      const newGreeting = await greetingService.generateGreeting();
      setCurrentGreeting(newGreeting);
      
      if (piperService.isReady()) {
        await speakGreeting(newGreeting);
      }
    } catch (error) {
      console.error('Failed to generate new greeting:', error);
    }
  };

  // Trigger greeting speech on user interaction
  const triggerGreetingSpeech = async () => {
    if (!greetingSpokenRef.current && currentGreeting && greetingInitialized) {
      await speakInitialGreeting();
    }
  };

  // Track initialization state to prevent multiple initializations
  const initializationStartedRef = useRef(false);


  // Initialize voice activation service
  useEffect(() => {
    const initializeVoiceActivation = async () => {
      // Prevent multiple initializations
      if (initializationStartedRef.current) {
        console.log('Initialization already started, skipping...');
        return;
      }
      initializationStartedRef.current = true;

      try {
        console.log('Starting voice activation initialization...');
        
        // Initialize greeting system first (non-blocking)
        console.log('Initializing greeting system...');
        await initializeGreetingSystem();
        console.log('Greeting system initialization completed');
        debugState(); // Debug state after greeting initialization
        
        // Initialize voice service with device detection
        console.log('Initializing voice service with device detection...');
        await initializeVoiceService();
        
        // Set up callbacks for voice activation
        if (voiceService) {
          voiceService.setCallbacks({
            onWakeWordDetected: handleWakeWordDetected,
            onAudioLevelChange: handleAudioLevelChange,
            onError: handleError,
            onStatusChange: handleStatusChange
          });
          
          // Set transcription service for voice activation service (only for full voice service)
          if (!isMobileMode && voiceService === voiceActivationService && voiceService.setTranscriptionService) {
            // Only set Whisper service if it's actually initialized
            if (whisperService.isInitialized) {
              voiceService.setTranscriptionService(whisperService);
              console.log('Whisper service set as transcription service');
            } else {
              console.warn('Whisper service not initialized, cannot set as transcription service');
            }
          }
        }
        
        console.log('Voice service initialized');
        
        // Always try to initialize whisper service first (more permissive device detection)
        console.log('Attempting to initialize whisper service...');
        console.log('Device info:', deviceDetection.getOptimizedSettings());
        console.log('Can handle AI models:', deviceDetection.canHandleAIModels());
        
        try {
          await whisperService.initialize();
          console.log('✅ Whisper service initialized successfully');
          
          // If Whisper succeeds, ensure we're using the full voice service
          if (voiceService !== voiceActivationService) {
            console.log('Switching to full voice activation service');
            setVoiceService(voiceActivationService);
            setIsMobileMode(false);
          }
        } catch (error) {
          console.warn('❌ Whisper service failed, switching to mobile mode:', error);
          
          // If Whisper fails, switch to mobile mode
          console.log('Switching to mobile mode due to Whisper failure');
          setIsMobileMode(true);
          setVoiceService(mobileVoiceService);
          
          // Re-initialize the mobile service
          try {
            await mobileVoiceService.initialize();
            console.log('✅ Mobile voice service initialized after fallback');
          } catch (mobileError) {
            console.error('❌ Mobile service fallback also failed:', mobileError);
            setError(`Voice activation unavailable: ${mobileError.message}`);
            setStatus('error');
          }
        }
        
        // ULTRA-FAST INITIALIZATION
        console.log('Initializing TTS...');
        
        try {
          await piperService.initialize();
          setIsInitialized(true);
          setStatus('ready');
          console.log('TTS ready!');
          
          // Speak greeting immediately when ready
          setTimeout(async () => {
            if (currentGreeting && greetingInitialized) {
              console.log('Speaking greeting immediately...');
              await speakInitialGreeting();
            }
          }, 500); // Small delay to ensure everything is ready
          
        } catch (error) {
          console.error('TTS initialization failed:', error);
          setError('TTS failed');
        }
      } catch (err) {
        console.error('Voice activation initialization error:', err);
        setError(`Voice activation initialization error: ${err.message}`);
        initializationStartedRef.current = false; // Reset on error
      }
    };

    // Add test event listener
    const handleTestWakeWord = (event) => {
      handleWakeWordDetected(event.detail.wakeWord, event.detail.transcription);
    };
    
    window.addEventListener('wakeWordDetected', handleTestWakeWord);


    initializeVoiceActivation();

    return () => {
      voiceActivationService.cleanup();
      window.removeEventListener('wakeWordDetected', handleTestWakeWord);
    };
  }, []);

  // Auto-speak greeting when everything is ready
  useEffect(() => {
    if (isInitialized && currentGreeting && greetingInitialized && !greetingSpokenRef.current) {
      console.log('Everything ready, speaking greeting automatically...');
      speakInitialGreeting();
    }
  }, [isInitialized, currentGreeting, greetingInitialized]);

  // Auto-start voice activation when everything is ready
  useEffect(() => {
    if (isInitialized && !isListening) {
      console.log('Starting voice activation automatically...');
      startRealTimeDetection();
    }
  }, [isInitialized]);

  // Handle wake word detection
  const handleWakeWordDetected = async (wakeWord, transcription) => {
    console.log('🎤 Wake word detected:', wakeWord, transcription);
    console.log('🎤 onNavigateToRecord callback:', onNavigateToRecord);
    setWakeWordDetected(true);
    setIsProcessing(true);
    setShowLoading(true);
    
    // Navigate to record screen
    if (onNavigateToRecord) {
      console.log('🎤 Navigating to record screen...');
      onNavigateToRecord();
    } else {
      console.error('🎤 onNavigateToRecord callback is not available!');
    }
    
    // Hide loading after 2 seconds and reset states
    setTimeout(() => {
      setShowLoading(false);
      setWakeWordDetected(false);
      setIsProcessing(false);
    }, 2000);
  };

  // Handle audio level changes
  const handleAudioLevelChange = (level) => {
    setAudioLevel(level);
  };

  // Handle errors
  const handleError = (errorMessage) => {
    setError(errorMessage);
    console.error('Voice activation error:', errorMessage);
  };

  // Handle status changes
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setIsListening(newStatus === 'listening');
    setIsProcessing(newStatus === 'wake_word_detected' || newStatus === 'processing');
  };

  // Start listening for wake words
  const startListening = async () => {
    if (!isInitialized) return false;
    
    try {
      const success = await voiceActivationService.startListening();
      if (success) {
        setIsListening(true);
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      setError(`Failed to start listening: ${err.message}`);
      return false;
    }
  };

  // Stop listening
  const stopListening = () => {
    voiceActivationService.stopListening();
    setIsListening(false);
    setIsProcessing(false);
  };

  // Real-time wake word detection using Whisper
  const startRealTimeDetection = async () => {
    if (!isInitialized || !voiceService) {
      setError('Voice activation not initialized. Please wait for initialization to complete.');
      return false;
    }

    try {
      console.log('Starting real-time detection...');
      
      // Ensure transcription service is set for voice activation service
      if (!isMobileMode && voiceService === voiceActivationService) {
        if (!voiceService.hasTranscriptionService()) {
          if (whisperService.isInitialized) {
            console.log('Setting transcription service...');
            voiceService.setTranscriptionService(whisperService);
          } else {
            console.warn('Whisper service not initialized, cannot set as transcription service');
            setError('Speech recognition not available - Whisper service failed to initialize');
            return false;
          }
        }
      }
      
      // Use the selected voice service for real-time detection
      let success;
      if (isMobileMode) {
        // Mobile service uses startListening method
        success = await voiceService.startListening();
      } else {
        // Full service uses startRealTimeWakeWordDetection method
        success = await voiceService.startRealTimeWakeWordDetection();
      }
      
      if (success) {
        setIsListening(true);
        setStatus('listening');
        console.log('Real-time detection started successfully');
        return true;
      } else {
        setError('Failed to start real-time detection - service returned false');
        return false;
      }
    } catch (error) {
      console.error('Real-time detection failed:', error);
      setError(`Real-time detection failed: ${error.message}`);
      return false;
    }
  };


  // Stop real-time detection
  const stopRealTimeDetection = () => {
    // Use the selected voice service to stop real-time detection
    if (voiceService) {
      if (isMobileMode) {
        voiceService.stopListening();
      } else {
        voiceService.stopRealTimeWakeWordDetection();
      }
    }
    setIsListening(false);
    setIsProcessing(false);
  };

  const value = {
    // State
    isListening,
    isProcessing,
    audioLevel,
    status,
    error,
    isInitialized,
    wakeWordDetected,
    showLoading,
    
    // Device detection state
    deviceInfo,
    isMobileMode,
    
    // Greeting system state
    currentGreeting,
    greetingInitialized,
    
    // Actions
    startListening,
    stopListening,
    startRealTimeDetection,
    stopRealTimeDetection,
    triggerGreetingSpeech,
    forceSpeakGreeting,
    
      // Debug functions
      testSpeech,
      debugState,
    
    
    // Status helpers
    isReady: isInitialized && status === 'ready',
    isActive: isListening || isProcessing
  };

  return (
    <VoiceActivationContext.Provider value={value}>
      {children}
    </VoiceActivationContext.Provider>
  );
};

export default VoiceActivationContext;
