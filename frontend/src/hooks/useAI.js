/**
 * AI Hooks - React hooks for AI model integration
 * Provides easy-to-use hooks for Whisper, Gemma, and Piper services
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import whisperService from '../services/whisperService';
import gemmaService from '../services/gemmaService';
import piperService from '../services/piperService';

/**
 * Hook for Whisper speech-to-text functionality
 */
export const useWhisper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // Initialize Whisper service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        await whisperService.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, []);

  // Transcribe audio file
  const transcribeFile = useCallback(async (audioFile, options = {}) => {
    if (!isInitialized) {
      throw new Error('Whisper service not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await whisperService.transcribeAudio(audioFile, options);
      setTranscription(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isInitialized) {
      throw new Error('Whisper service not initialized');
    }

    try {
      const stream = await whisperService.getMicrophoneStream();
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        try {
          const result = await whisperService.transcribeAudio(blob);
          setTranscription(result);
        } catch (err) {
          setError(err.message);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isInitialized]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isRecording]);

  // Clear transcription
  const clearTranscription = useCallback(() => {
    setTranscription('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      whisperService.cleanup();
    };
  }, [stopRecording]);

  return {
    isLoading,
    isInitialized,
    transcription,
    error,
    isRecording,
    recordingTime,
    transcribeFile,
    startRecording,
    stopRecording,
    clearTranscription,
    isReady: whisperService.isReady(),
    status: whisperService.getStatus()
  };
};

/**
 * Hook for Gemma text processing functionality
 */
export const useGemma = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize Gemma service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        await gemmaService.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, []);

  // Summarize text
  const summarizeText = useCallback(async (text, options = {}) => {
    if (!isInitialized) {
      throw new Error('Gemma service not initialized');
    }

    try {
      setIsGenerating(true);
      setError(null);
      const summary = await gemmaService.summarizeText(text, options);
      setResult(summary);
      return summary;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [isInitialized]);

  // Answer question
  const answerQuestion = useCallback(async (text, question, options = {}) => {
    if (!isInitialized) {
      throw new Error('Gemma service not initialized');
    }

    try {
      setIsGenerating(true);
      setError(null);
      const answer = await gemmaService.answerQuestion(text, question, options);
      setResult(answer);
      return answer;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [isInitialized]);

  // Generate text
  const generateText = useCallback(async (prompt, options = {}) => {
    if (!isInitialized) {
      throw new Error('Gemma service not initialized');
    }

    try {
      setIsGenerating(true);
      setError(null);
      const generatedText = await gemmaService.generateText(prompt, options);
      setResult(generatedText);
      return generatedText;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [isInitialized]);

  // Extract key points
  const extractKeyPoints = useCallback(async (text, options = {}) => {
    if (!isInitialized) {
      throw new Error('Gemma service not initialized');
    }

    try {
      setIsGenerating(true);
      setError(null);
      const keyPoints = await gemmaService.extractKeyPoints(text, options);
      setResult(keyPoints.join('\n'));
      return keyPoints;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [isInitialized]);

  // Classify sentiment
  const classifySentiment = useCallback(async (text) => {
    if (!isInitialized) {
      throw new Error('Gemma service not initialized');
    }

    try {
      setIsGenerating(true);
      setError(null);
      const sentiment = await gemmaService.classifySentiment(text);
      setResult(sentiment);
      return sentiment;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [isInitialized]);

  // Clear result
  const clearResult = useCallback(() => {
    setResult('');
    setError(null);
  }, []);

  // Update parameters
  const updateParameters = useCallback((params) => {
    gemmaService.updateParameters(params);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      gemmaService.cleanup();
    };
  }, []);

  return {
    isLoading,
    isInitialized,
    result,
    error,
    isGenerating,
    summarizeText,
    answerQuestion,
    generateText,
    extractKeyPoints,
    classifySentiment,
    clearResult,
    updateParameters,
    isReady: gemmaService.isReady(),
    status: gemmaService.getStatus()
  };
};

/**
 * Hook for Piper text-to-speech functionality
 */
export const usePiper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [availableSpeakers, setAvailableSpeakers] = useState([]);

  // Initialize Piper service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        await piperService.initialize();
        setIsInitialized(true);
        setAvailableSpeakers(piperService.getAvailableSpeakers());
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, []);

  // Synthesize text to speech
  const synthesizeText = useCallback(async (text, options = {}) => {
    if (!isInitialized) {
      throw new Error('Piper service not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      const audioBuffer = await piperService.synthesizeText(text, options);
      return audioBuffer;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Speak text immediately
  const speakText = useCallback(async (text, options = {}) => {
    if (!isInitialized) {
      throw new Error('Piper service not initialized');
    }

    try {
      setIsSpeaking(true);
      setError(null);
      await piperService.speakText(text, options);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsSpeaking(false);
    }
  }, [isInitialized]);

  // Synthesize to blob URL
  const synthesizeToBlob = useCallback(async (text, options = {}) => {
    if (!isInitialized) {
      throw new Error('Piper service not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      const blobUrl = await piperService.synthesizeToBlob(text, options);
      setAudioUrl(blobUrl);
      return blobUrl;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Set speaker
  const setSpeaker = useCallback((speakerId) => {
    piperService.setSpeaker(speakerId);
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (isSpeaking) {
      // Note: This is a simplified implementation
      // In production, you'd want to properly stop the audio source
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  // Clear audio URL
  const clearAudioUrl = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAudioUrl();
      piperService.cleanup();
    };
  }, [clearAudioUrl]);

  return {
    isLoading,
    isInitialized,
    isSpeaking,
    error,
    audioUrl,
    availableSpeakers,
    synthesizeText,
    speakText,
    synthesizeToBlob,
    setSpeaker,
    stopSpeaking,
    clearAudioUrl,
    isReady: piperService.isReady(),
    status: piperService.getStatus()
  };
};

/**
 * Combined hook for all AI services
 */
export const useAIServices = () => {
  const whisper = useWhisper();
  const gemma = useGemma();
  const piper = usePiper();

  const [overallStatus, setOverallStatus] = useState({
    isLoading: false,
    isReady: false,
    errors: []
  });

  // Update overall status
  useEffect(() => {
    const isLoading = whisper.isLoading || gemma.isLoading || piper.isLoading;
    const isReady = whisper.isReady && gemma.isReady && piper.isReady;
    const errors = [whisper.error, gemma.error, piper.error].filter(Boolean);

    setOverallStatus({
      isLoading,
      isReady,
      errors
    });
  }, [
    whisper.isLoading, whisper.isReady, whisper.error,
    gemma.isLoading, gemma.isReady, gemma.error,
    piper.isLoading, piper.isReady, piper.error
  ]);

  return {
    whisper,
    gemma,
    piper,
    overallStatus
  };
};

export default {
  useWhisper,
  useGemma,
  usePiper,
  useAIServices
};
