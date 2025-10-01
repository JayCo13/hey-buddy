import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Mic, Play, Pause, Home, User, Volume2, VolumeX, ArrowLeft, Settings, AudioWaveform, Heart } from 'lucide-react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { useAIChat } from '../hooks/useAIChat';
import useEmotionRecognition from '../hooks/useEmotionRecognition';
import EmotionDisplay from './EmotionDisplay';
import Threads from '../effects/Threads';
import ShinyText from '../effects/ShinyText';

const RecordScreen = ({ onNavigate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeTab, setActiveTab] = useState('record');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [showEmotionPanel, setShowEmotionPanel] = useState(false);
  
  const recordingIntervalRef = useRef(null);
  const lastSpokenIdRef = useRef(null);
  const transcriptTimeoutRef = useRef(null);

  // Initialize AI chat, speech recognition, and emotion recognition
  const { messages, isProcessing, sendMessage, clearMessages } = useAIChat();
  const { 
    currentEmotion, 
    emotionHistory, 
    isAnalyzing: isAnalyzingEmotion, 
    analyzeEmotion, 
    startEmotionMonitoring, 
    stopEmotionMonitoring,
    clearEmotionHistory 
  } = useEmotionRecognition();
  
  // Debounced transcript update to prevent rapid re-renders
  const debouncedSetTranscript = useCallback((text, isFinal) => {
    if (transcriptTimeoutRef.current) {
      clearTimeout(transcriptTimeoutRef.current);
    }
    
    if (isFinal) {
      setCurrentTranscript(text);
      if (text.trim()) {
        // Auto-send after a brief pause when speech is final
        setTimeout(() => {
          handleSendMessage(text);
        }, 500);
      }
    } else {
      // Debounce interim results to reduce flashing
      transcriptTimeoutRef.current = setTimeout(() => {
        setCurrentTranscript(text);
      }, 100);
    }
  }, []);

  const { 
    isListening, 
    transcript, 
    isSupported: speechSupported, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    lang: "en-US",
    onResult: debouncedSetTranscript,
    onError: (error) => {
      console.error("Speech recognition error:", error);
      alert(`Speech recognition error: ${error}`);
    },
    onEnd: () => {
      // If we have transcript but it wasn't sent yet, keep it for manual send
      if (currentTranscript.trim()) {
        setCurrentTranscript(currentTranscript);
      }
    },
  });

  // Update supported state
  useEffect(() => {
    setIsSupported(speechSupported);
  }, [speechSupported]);

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

  // Auto TTS for latest AI reply
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!messages || messages.length === 0) return;
    
    const last = [...messages].reverse().find((m) => m.type === "ai" && !m.error);
    if (!last) return;
    if (lastSpokenIdRef.current === last.id) return;

    const utter = new SpeechSynthesisUtterance(last.content);
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.volume = 1;
    
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    lastSpokenIdRef.current = last.id;
  }, [messages]);

  const handleStartRecording = useCallback(async () => {
    if (!isSupported) {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      // Stop recording
      stopListening();
      stopEmotionMonitoring();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      // Clear any pending transcript updates
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
        setCurrentTranscript("");
        
        // Start listening
        startListening({ continuousOverride: false });
        setIsRecording(true);
        
        // Start emotion monitoring
        await startEmotionMonitoring();
        
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
  }, [isSupported, isListening, stopListening, resetTranscript, startListening]);

  const handleSendMessage = (message) => {
    const textToSend = message || currentTranscript;
    if (textToSend.trim()) {
      sendMessage(textToSend.trim());
      setCurrentTranscript("");
      resetTranscript();
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speakMessage = (content) => {
    if ("speechSynthesis" in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(content);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onNavigate(tabId);
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
          className="w-10 h-10 rounded-full bg-gray-800/50 backdrop-blur-sm flex items-center justify-center hover:bg-gray-700/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        
        <ShinyText 
          text="The real Jarvis" 
          className="text-lg font-semibold text-white"
          speed={3}
        />
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowEmotionPanel(!showEmotionPanel)}
            className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
              showEmotionPanel 
                ? 'bg-red-500/50 hover:bg-red-600/50' 
                : 'bg-gray-800/50 hover:bg-gray-700/50'
            }`}
          >
            <Heart className="w-5 h-5 text-white" />
          </button>
          <button className="w-10 h-10 rounded-full bg-gray-800/50 backdrop-blur-sm flex items-center justify-center hover:bg-gray-700/50 transition-colors">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="relative z-10 text-center mt-8">
        <div className="text-4xl font-light text-white/90 tracking-wider">
          {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 mt-18">
        {/* Emotion Panel */}
        {showEmotionPanel && (
          <div className="w-full max-w-md mb-8">
            <EmotionDisplay 
              currentEmotion={currentEmotion}
              emotionHistory={emotionHistory}
              isAnalyzing={isAnalyzingEmotion}
              showHistory={true}
              showStats={true}
            />
          </div>
        )}
        {/* Greeting with Transcript */}
        <div className="text-center mb-16 w-full max-w-md">
          {/* Live Transcription in greeting area */}
          {currentTranscript && (
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 mt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Live Transcription</h4>
              <p className="text-white text-sm">{currentTranscript}</p>
            </div>
          )}
        </div>

        {/* Audio Visualization Icon */}
        <div className="mb-8 flex justify-center">
          <div className="bg-black/30 backdrop-blur-sm rounded-full p-6 border border-white/10">
            <AudioWaveform 
              size={32} 
              className={`text-blue-400 transition-all duration-300 ${isRecording ? 'animate-pulse' : ''}`} 
            />
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mb-8 w-full max-w-md">
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span className="text-blue-100">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Recording Control Button */}
        <div className="text-center relative">
          {/* Emotion Indicator */}
          {currentEmotion && isListening && (
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white/20"
                 style={{ backgroundColor: `${currentEmotion.emotionColor}40` }}>
              {currentEmotion.emotionEmoji}
            </div>
          )}
          
          <button
            onClick={handleStartRecording}
            disabled={!isSupported}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${
              isListening 
                ? 'bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm border border-white/20' 
                : isSupported
                ? 'bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm border border-white/20'
                : 'bg-gray-600/50 cursor-not-allowed border border-gray-500/20'
            } shadow-2xl`}
          >
            {isListening ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        {/* Conversation History */}
        {messages.length > 0 && (
          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white/90">Conversation</h3>
              <div className="flex items-center space-x-2">
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="w-8 h-8 bg-red-600/80 hover:bg-red-700/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
                  >
                    <VolumeX className="w-4 h-4 text-white" />
                  </button>
                )}
                <button
                  onClick={clearMessages}
                  className="px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 backdrop-blur-sm rounded-lg text-sm transition-colors border border-white/10"
                >
                  Clear
                </button>
                {emotionHistory.length > 0 && (
                  <button
                    onClick={clearEmotionHistory}
                    className="px-3 py-1 bg-red-700/50 hover:bg-red-600/50 backdrop-blur-sm rounded-lg text-sm transition-colors border border-red-500/20"
                  >
                    Clear Emotions
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id} className={`rounded-xl p-4 backdrop-blur-sm border ${
                  message.type === 'user' 
                    ? 'bg-blue-900/30 ml-8 border-blue-500/20' 
                    : 'bg-gray-800/30 mr-8 border-white/10'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white">{message.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.type === 'ai' && (
                      <button
                        onClick={() => speakMessage(message.content)}
                        className="w-8 h-8 bg-gray-700/50 hover:bg-gray-600/50 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors ml-2 border border-white/10"
                      >
                        <Volume2 className="w-4 h-4 text-gray-300" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/95 via-gray-800/90 to-gray-800/80 backdrop-blur-xl border-t border-gray-600/30 shadow-2xl z-20">
        <div className="flex items-center justify-around py-3">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'record', label: 'Record', icon: Mic },
            { id: 'profile', label: 'Profile', icon: User }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                activeTab === tab.id 
                  ? 'text-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20 border border-blue-500/20' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
              }`}
            >
              <tab.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecordScreen;
