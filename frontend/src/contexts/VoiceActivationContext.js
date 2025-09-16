import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import voiceActivationService from '../services/voiceActivationService';
import whisperService from '../services/whisperService';
import greetingService from '../services/greetingService';
import piperService from '../services/piperService';
import serviceWorkerManager from '../services/serviceWorkerManager';

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
  
  // Greeting system state
  const [currentGreeting, setCurrentGreeting] = useState(null);
  const [greetingInitialized, setGreetingInitialized] = useState(false);
  
  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const isRecordingRef = useRef(false);

  // Initialize greeting system (non-blocking)
  const initializeGreetingSystem = async () => {
    try {
      console.log('Initializing greeting system...');
      
      // Initialize greeting service (non-blocking, AI loads in background)
      const greetingServiceReady = await greetingService.initialize();
      console.log('Greeting service initialized:', greetingServiceReady);
      
      // Generate greeting immediately (uses fallback if AI not ready)
      console.log('Generating initial greeting...');
      const greeting = await greetingService.generateGreeting();
      console.log('Generated greeting:', greeting);
      
      setCurrentGreeting(greeting);
      setGreetingInitialized(true);
      console.log('Greeting system initialized successfully');
      
      // AI will continue loading in background and update greetings when ready
      
    } catch (error) {
      console.error('Failed to initialize greeting system:', error);
      
      // Set a fallback greeting immediately
      const fallbackGreeting = {
        text: `Hello ${greetingService.userName}! What can I help you with?`,
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
    console.log('Service worker status:', serviceWorkerManager.getStatus());
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
        
        // Register service worker for background AI initialization
        console.log('Registering service worker...');
        await serviceWorkerManager.register();
        
        // Initialize greeting system first (non-blocking)
        console.log('Initializing greeting system...');
        await initializeGreetingSystem();
        console.log('Greeting system initialization completed');
        debugState(); // Debug state after greeting initialization
        
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

  // Handle wake word detection
  const handleWakeWordDetected = async (wakeWord, transcription) => {
    console.log('Wake word detected:', wakeWord, transcription);
    setWakeWordDetected(true);
    setIsProcessing(true);
    setShowLoading(true);
    
    // Navigate to record screen
    if (onNavigateToRecord) {
      onNavigateToRecord();
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
    if (!isInitialized) {
      setError('Voice activation not initialized. Please wait for initialization to complete.');
      return false;
    }

    try {
      console.log('Starting real-time detection...');
      // Use the improved voice activation service for real-time detection
      const success = await voiceActivationService.startRealTimeWakeWordDetection();
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
    // Use the voice activation service to stop real-time detection
    voiceActivationService.stopListening();
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
