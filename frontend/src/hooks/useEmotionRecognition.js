import { useState, useRef, useCallback, useEffect } from 'react';
import emotionService from '../services/emotionService';

const useEmotionRecognition = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const analysisIntervalRef = useRef(null);

  // Initialize the emotion service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await emotionService.initialize();
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize emotion service:', err);
        setError('Failed to initialize emotion recognition');
      }
    };

    initializeService();

    return () => {
      // Cleanup
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Analyze emotion from audio blob
  const analyzeEmotion = useCallback(async (audioBlob) => {
    if (!isInitialized) {
      setError('Emotion service not initialized');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await emotionService.analyzeEmotion(audioBlob);
      
      if (result.error) {
        setError(result.error);
        return null;
      }

      setCurrentEmotion(result);
      
      // Add to history
      setEmotionHistory(prev => [
        ...prev.slice(-9), // Keep last 10 emotions
        {
          ...result,
          timestamp: new Date(),
          id: Date.now()
        }
      ]);

      return result;
    } catch (err) {
      console.error('Error analyzing emotion:', err);
      setError('Failed to analyze emotion');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [isInitialized]);

  // Start real-time emotion monitoring
  const startEmotionMonitoring = useCallback(async () => {
    if (!isInitialized) {
      setError('Emotion service not initialized');
      return false;
    }

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Set up MediaRecorder with WAV support
      let mimeType = 'audio/wav';
      if (!MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/webm;codecs=opus';
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          await analyzeEmotion(audioBlob);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second

      // Set up periodic analysis
      analysisIntervalRef.current = setInterval(async () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start(1000);
        }
      }, 2000); // Analyze every 2 seconds

      return true;
    } catch (err) {
      console.error('Error starting emotion monitoring:', err);
      setError('Failed to start emotion monitoring');
      return false;
    }
  }, [isInitialized, analyzeEmotion]);

  // Stop real-time emotion monitoring
  const stopEmotionMonitoring = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
  }, []);

  // Analyze emotion from existing audio data
  const analyzeAudioData = useCallback(async (audioData, sampleRate = 16000) => {
    if (!isInitialized) {
      setError('Emotion service not initialized');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await emotionService.analyzeEmotionFromAudioData(audioData, sampleRate);
      
      if (result.error) {
        setError(result.error);
        return null;
      }

      setCurrentEmotion(result);
      
      // Add to history
      setEmotionHistory(prev => [
        ...prev.slice(-9), // Keep last 10 emotions
        {
          ...result,
          timestamp: new Date(),
          id: Date.now()
        }
      ]);

      return result;
    } catch (err) {
      console.error('Error analyzing audio data:', err);
      setError('Failed to analyze audio data');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [isInitialized]);

  // Clear emotion history
  const clearEmotionHistory = useCallback(() => {
    setEmotionHistory([]);
    setCurrentEmotion(null);
  }, []);

  // Get emotion statistics
  const getEmotionStats = useCallback(() => {
    if (emotionHistory.length === 0) {
      return {
        totalAnalyses: 0,
        dominantEmotion: 'neutral',
        emotionCounts: {},
        averageConfidence: 0
      };
    }

    const emotionCounts = {};
    let totalConfidence = 0;

    emotionHistory.forEach(emotion => {
      emotionCounts[emotion.dominantEmotion] = (emotionCounts[emotion.dominantEmotion] || 0) + 1;
      totalConfidence += emotion.confidence;
    });

    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    return {
      totalAnalyses: emotionHistory.length,
      dominantEmotion,
      emotionCounts,
      averageConfidence: totalConfidence / emotionHistory.length
    };
  }, [emotionHistory]);

  return {
    // State
    isAnalyzing,
    currentEmotion,
    emotionHistory,
    isInitialized,
    error,
    
    // Actions
    analyzeEmotion,
    analyzeAudioData,
    startEmotionMonitoring,
    stopEmotionMonitoring,
    clearEmotionHistory,
    
    // Utilities
    getEmotionStats,
    getAllEmotions: emotionService.getAllEmotions.bind(emotionService)
  };
};

export default useEmotionRecognition;

