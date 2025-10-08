import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Mic, Play, Pause, Image as ImageIcon, Sparkles, ArrowLeft, RefreshCw, Heart, AudioWaveform } from 'lucide-react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useEmotionRecognition from '../hooks/useEmotionRecognition';
import { usePiper } from '../hooks/useAI';
import imageService from '../services/imageService';
import EmotionDisplay from './EmotionDisplay';
import Threads from '../effects/Threads';
import ShinyText from '../effects/ShinyText';

const CreativityScreen = ({ onNavigate }) => {
  const [textPrompt, setTextPrompt] = useState('');
  const [emotion, setEmotion] = useState('happy');
  const [style, setStyle] = useState('photorealistic');
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmotionPanel, setShowEmotionPanel] = useState(false);
  const [emotionMonitoringActive, setEmotionMonitoringActive] = useState(false);
  const [autoDetectMode, setAutoDetectMode] = useState(true);
  
  const recordingIntervalRef = useRef(null);
  const transcriptTimeoutRef = useRef(null);

  const emotions = useMemo(() => [
    'happy','calm','excited','sad','stressed','loved','motivated','relaxed','energetic','thoughtful','neutral'
  ], []);

  const styles = useMemo(() => [
    'photorealistic','anime','abstract','artistic'
  ], []);

  // Emotion Recognition
  const { 
    currentEmotion, 
    emotionHistory, 
    isAnalyzing: isAnalyzingEmotion, 
    startEmotionMonitoring, 
    stopEmotionMonitoring,
    clearEmotionHistory 
  } = useEmotionRecognition();

  // Speech Recognition
  const { 
    isListening, 
    isSupported, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    onResult: (txt, isFinal) => {
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }
      
      if (isFinal) {
        setTextPrompt(txt);
        
        // Stop listening and emotion monitoring after utterance
        try {
          stopListening();
        } catch (e) {
          console.warn("Failed to stop listening:", e);
        }

        if (emotionMonitoringActive) {
          try {
            stopEmotionMonitoring();
          } catch (e) {
            console.warn("Failed to stop emotion monitoring:", e);
          } finally {
            setEmotionMonitoringActive(false);
          }
        }

        setIsRecording(false);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }

        if (transcriptTimeoutRef.current) {
          clearTimeout(transcriptTimeoutRef.current);
          transcriptTimeoutRef.current = null;
        }
      } else {
        transcriptTimeoutRef.current = setTimeout(() => {
          setTextPrompt(txt);
        }, 100);
      }
    },
    onError: (e) => setError(String(e))
  });

  const { isInitialized, speakText } = (() => {
    try {
      // Optional TTS; falls back silently if Piper not ready
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { isInitialized, speakText } = usePiper();
      return { isInitialized, speakText };
    } catch {
      return { isInitialized: false, speakText: async () => {} };
    }
  })();

  // Auto-set emotion from detected emotion
  useEffect(() => {
    if (autoDetectMode && currentEmotion && currentEmotion.dominantEmotion) {
      setEmotion(currentEmotion.dominantEmotion.toLowerCase());
    }
  }, [currentEmotion, autoDetectMode]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (!isSupported) {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      // Stop recording
      stopListening();

      if (emotionMonitoringActive) {
        try {
          stopEmotionMonitoring();
        } catch (e) {
          console.warn("Failed to stop emotion monitoring:", e);
        } finally {
          setEmotionMonitoringActive(false);
        }
      }

      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
        transcriptTimeoutRef.current = null;
      }
    } else {
      try {
        // Request microphone permission
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        }
        
        // Clear previous state
        resetTranscript();
        setTextPrompt("");
        
        // Start listening for a single utterance
        startListening({ continuousOverride: false });
        setIsRecording(true);
        
        // Try to start emotion monitoring
        try {
          await startEmotionMonitoring();
          setEmotionMonitoringActive(true);
        } catch (err) {
          console.warn("Emotion monitoring disabled (likely Whisper not initialized):", err);
          setEmotionMonitoringActive(false);
        }
        
        // Start recording timer
        setRecordingTime(0);
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } catch (error) {
        console.error("Microphone permission denied:", error);
        alert("Cannot access microphone. Please allow microphone permission in your browser.");
      }
    }
  }, [
    isSupported,
    isListening,
    stopListening,
    stopEmotionMonitoring,
    resetTranscript,
    startListening,
    startEmotionMonitoring,
    emotionMonitoringActive
  ]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isInitialized) {
        await speakText('Generating your creative image.');
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance('Generating your creative image.');
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }

      const result = await imageService.generateEmotionImage(emotion, textPrompt || null, style);
      if (result && result.image_url) {
        setImageUrl(result.image_url);
        if (isInitialized) {
          await speakText('Your image is ready.');
        } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance('Your image is ready.');
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        }
      } else {
        setError('Failed to generate image');
      }
    } catch (e) {
      setError(e?.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Threads Background */}
      <div className="absolute inset-0">
        {useMemo(() => (
          <Threads 
            amplitude={2.5} 
            distance={0.1} 
            enableMouseInteraction={true} 
          />
        ), [])}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 pt-12 main-content-safe">
        <button 
          onClick={() => onNavigate('home')}
          aria-label="Go back"
          className="w-10 h-10 rounded-full bg-gray-800/50 backdrop-blur-sm flex items-center justify-center hover:bg-gray-700/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        
        <ShinyText 
          text="Unleash your creativity" 
          className="text-lg font-semibold text-white"
          speed={3}
        />
        
        <button 
          onClick={() => setShowEmotionPanel(!showEmotionPanel)}
          aria-pressed={showEmotionPanel}
          aria-label="Toggle emotion panel"
          className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
            showEmotionPanel 
              ? 'bg-purple-500/50 hover:bg-purple-600/50' 
              : 'bg-gray-800/50 hover:bg-gray-700/50'
          }`}
        >
          <Heart className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Status Row */}
      <div className="relative z-10 px-6 mt-2" role="status" aria-live="polite">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-300">
          <div className="flex items-center space-x-2">
            <span className={`inline-block w-2 h-2 rounded-full ${isListening ? 'bg-blue-400' : 'bg-gray-500'}`}></span>
            <span>{isListening ? 'Listening' : 'Idle'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-block w-2 h-2 rounded-full ${isAnalyzingEmotion ? 'bg-amber-400' : 'bg-gray-500'}`}></span>
            <span>Emotion {isAnalyzingEmotion ? 'Analyzing' : 'Ready'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-block w-2 h-2 rounded-full ${loading ? 'bg-green-400' : 'bg-gray-500'}`}></span>
            <span>{loading ? 'Generating' : 'Ready'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 mt-8 pb-24 space-y-6">
        {/* Emotion Panel */}
        {showEmotionPanel && currentEmotion && (
          <div className="w-full max-w-2xl mx-auto">
            <EmotionDisplay 
              currentEmotion={currentEmotion}
              emotionHistory={emotionHistory}
              isAnalyzing={isAnalyzingEmotion}
              showHistory={true}
              showStats={true}
            />
          </div>
        )}

        {/* Recording Section */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {/* Timer Display */}
            {isRecording && (
              <div className="text-center mb-4">
                <div className="text-2xl font-light text-white/90 tracking-wider">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
              </div>
            )}

            {/* Audio Visualization & Emotion Chip */}
            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="bg-black/30 backdrop-blur-sm rounded-full p-6 border border-white/10">
                <AudioWaveform 
                  size={32} 
                  className={`text-purple-400 transition-all duration-300 ${isRecording ? 'animate-pulse' : ''}`} 
                />
              </div>

              {currentEmotion && (
                <div 
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border backdrop-blur-sm ${isAnalyzingEmotion ? 'animate-pulse' : ''}`}
                  style={{ borderColor: '#ffffff22', backgroundColor: `${currentEmotion.emotionColor}22` }}
                >
                  <span className="text-xl">{currentEmotion.emotionEmoji}</span>
                  <span 
                    className="text-sm font-medium capitalize"
                    style={{ color: currentEmotion.emotionColor }}
                  >
                    {currentEmotion.dominantEmotion}
                  </span>
                  <span className="text-xs text-gray-200/80">{Math.round(currentEmotion.confidence * 100)}%</span>
                </div>
              )}
            </div>

            {/* Recording Control */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleStartRecording}
                disabled={!isSupported}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${
                  isListening 
                    ? 'bg-purple-600/80 hover:bg-purple-700/80 backdrop-blur-sm border border-purple-400/20' 
                    : isSupported
                    ? 'bg-purple-600/80 hover:bg-purple-700/80 backdrop-blur-sm border border-purple-400/20'
                    : 'bg-gray-600/50 cursor-not-allowed border border-gray-500/20'
                } shadow-2xl`}
              >
                {isListening ? (
                  <Pause className="w-7 h-7 text-white" />
                ) : (
                  <Play className="w-7 h-7 text-white" />
                )}
              </button>
            </div>

            <p className="text-center text-sm text-gray-300 mb-4">
              {isRecording ? 'Speak your idea...' : 'Tap to describe your vision with voice'}
            </p>

            {/* Text Prompt Display/Edit */}
            <div className="space-y-3">
              <label className="text-sm text-gray-300 font-medium">Your Idea</label>
              <textarea
                className="w-full bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 outline-none border border-gray-700/50 focus:border-purple-500/50 transition-colors text-white placeholder-gray-500"
                rows={3}
                placeholder="Describe your creative vision..."
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-4">
            {/* Auto-detect toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300 font-medium">Auto-detect emotion</label>
              <button
                onClick={() => setAutoDetectMode(!autoDetectMode)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  autoDetectMode ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  autoDetectMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 font-medium block mb-2">Emotion</label>
                <select
                  className="w-full bg-gray-900/50 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50 focus:border-purple-500/50 outline-none transition-colors text-white"
                  value={emotion}
                  onChange={(e) => {
                    setEmotion(e.target.value);
                    setAutoDetectMode(false);
                  }}
                  disabled={autoDetectMode}
                >
                  {emotions.map((e) => (
                    <option key={e} value={e} className="capitalize">{e}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300 font-medium block mb-2">Style</label>
                <select
                  className="w-full bg-gray-900/50 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50 focus:border-purple-500/50 outline-none transition-colors text-white"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  {styles.map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !textPrompt.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Creating magic...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Image</span>
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-900/40 border border-red-500/40 text-red-100 rounded-xl px-4 py-3 backdrop-blur-sm">
                <div className="text-sm">{error}</div>
              </div>
            )}
          </div>
        </div>

        {/* Generated Image Display */}
        {imageUrl && (
          <div className="w-full max-w-2xl mx-auto">
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="relative w-full h-96 bg-gray-900 rounded-xl overflow-hidden">
                <img src={imageUrl} alt="generated" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium capitalize text-white">{emotion}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm font-medium capitalize text-gray-300">{style}</span>
                      </div>
                      {textPrompt && (
                        <p className="text-xs text-gray-400 line-clamp-2">{textPrompt}</p>
                      )}
                    </div>
                    <button
                      onClick={handleGenerate}
                      className="p-3 bg-purple-600/80 hover:bg-purple-700/80 backdrop-blur-sm rounded-xl transition-colors shadow-lg"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativityScreen;


