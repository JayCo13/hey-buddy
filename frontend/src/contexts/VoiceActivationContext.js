import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import voiceActivationService from '../services/voiceActivationService';
import whisperService from '../services/whisperService';

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
  
  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const isRecordingRef = useRef(false);

  // Initialize voice activation service
  useEffect(() => {
    const initializeVoiceActivation = async () => {
      try {
        console.log('Starting voice activation initialization...');
        
        // Initialize Whisper service first
        console.log('Initializing Whisper service...');
        const whisperInitialized = await whisperService.initialize();
        if (!whisperInitialized) {
          setError('Failed to initialize Whisper service');
          return;
        }
        console.log('Whisper service initialized successfully');

        // Initialize voice activation service
        console.log('Initializing voice activation service...');
        const success = await voiceActivationService.initialize();
        if (success) {
          console.log('Voice activation service initialized successfully');
          setIsInitialized(true);
          setStatus('ready');
          
          // Set up callbacks
          voiceActivationService.setWakeWordCallback(handleWakeWordDetected);
          voiceActivationService.setAudioLevelCallback(handleAudioLevelChange);
          voiceActivationService.setErrorCallback(handleError);
          voiceActivationService.setStatusCallback(handleStatusChange);
          
          // Start listening automatically for seamless experience
          console.log('Starting real-time detection...');
          const listeningStarted = await voiceActivationService.startRealTimeWakeWordDetection();
          if (listeningStarted) {
            console.log('Real-time detection started successfully');
            setIsListening(true);
            setStatus('listening');
          } else {
            console.error('Failed to start real-time detection');
            setError('Failed to start voice detection');
          }
        } else {
          setError('Failed to initialize voice activation');
        }
      } catch (err) {
        console.error('Voice activation initialization error:', err);
        setError(`Voice activation initialization error: ${err.message}`);
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
    
    // Actions
    startListening,
    stopListening,
    startRealTimeDetection,
    stopRealTimeDetection,
    
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
