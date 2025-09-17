import React, { useState, useEffect, useRef } from 'react';
import { Signal, Wifi, Mic, Play, Pause, Home, User, Volume2, VolumeX } from 'lucide-react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { useAIChat } from '../hooks/useAIChat';

const RecordScreen = ({ onNavigate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeTab, setActiveTab] = useState('record');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  
  const recordingIntervalRef = useRef(null);
  const lastSpokenIdRef = useRef(null);

  // Initialize AI chat and speech recognition
  const { messages, isProcessing, sendMessage, clearMessages } = useAIChat();
  
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
    onResult: (text, isFinal) => {
      setCurrentTranscript(text);
      if (isFinal && text.trim()) {
        // Auto-send after a brief pause when speech is final
        setTimeout(() => {
          handleSendMessage(text);
        }, 500);
      }
    },
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

  const handleStartRecording = async () => {
    if (!isSupported) {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      stopListening();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    } else {
      try {
        // Request microphone permission
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        }
        
        resetTranscript();
        setCurrentTranscript("");
        startListening({ continuousOverride: false });
        setIsRecording(true);
        
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
  };

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
    <div className="min-h-screen bg-black text-white">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-6 py-2 text-sm">
        <span className="font-medium">9:41</span>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <Signal className="w-3 h-3 text-gray-300" />
          </div>
          <Wifi className="w-4 h-4 text-gray-300" />
          <div className="w-6 h-3 border border-gray-300 rounded-sm">
            <div className="w-4 h-2 bg-gray-300 rounded-sm m-0.5"></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 py-4">
        <h1 className="text-2xl font-bold">Record Audio</h1>
        <p className="text-gray-300 mt-2">Capture your voice and convert it to text</p>
      </div>

      {/* Main Recording Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Recording Visualizer */}
        <div className="mb-8">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-colors ${
            isListening ? 'bg-red-600 animate-pulse' : 'bg-gray-800'
          }`}>
            <Mic className={`w-16 h-16 ${isListening ? 'text-white' : 'text-gray-300'}`} />
          </div>
          
          {/* Audio Waveform */}
          <div className="flex justify-center space-x-1">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className={`rounded-sm ${
                  isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-600'
                }`}
                style={{ 
                  width: '4px', 
                  height: `${Math.random() * 30 + 15}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Live Transcription */}
        {currentTranscript && (
          <div className="mb-6 w-full max-w-md">
            <div className="bg-gray-800 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Live Transcription</h4>
              <p className="text-white">{currentTranscript}</p>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mb-6 w-full max-w-md">
            <div className="bg-blue-800 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-white">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Recording Controls */}
        <div className="text-center">
          <button
            onClick={handleStartRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRecording ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white" />
            )}
          </button>
          
          <p className="text-gray-300 mt-4 text-lg">
            {isRecording ? 'Recording...' : 'Tap to start recording'}
          </p>
          
          {isRecording && (
            <p className="text-blue-400 mt-2 font-mono text-xl">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </p>
          )}
        </div>

        {/* Recording Controls */}
        <div className="text-center">
          <button
            onClick={handleStartRecording}
            disabled={!isSupported}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
              isListening 
                ? 'bg-red-600 hover:bg-red-700' 
                : isSupported
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            {isListening ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white" />
            )}
          </button>
          
          <p className="text-gray-300 mt-4 text-lg">
            {!isSupported 
              ? 'Speech recognition not supported' 
              : isListening 
              ? 'Recording...' 
              : 'Tap to start recording'}
          </p>
          
          {isListening && (
            <p className="text-red-400 mt-2 font-mono text-xl">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </p>
          )}
        </div>

        {/* Conversation History */}
        {messages.length > 0 && (
          <div className="mt-8 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Conversation</h3>
              <div className="flex items-center space-x-2">
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                  >
                    <VolumeX className="w-4 h-4 text-white" />
                  </button>
                )}
                <button
                  onClick={clearMessages}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id} className={`rounded-xl p-4 ${
                  message.type === 'user' 
                    ? 'bg-blue-800 ml-8' 
                    : 'bg-gray-800 mr-8'
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
                        className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors ml-2"
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
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/95 via-gray-800/90 to-gray-800/80 backdrop-blur-xl border-t border-gray-600/30 shadow-2xl">
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
