import React, { useState } from 'react';
import ProfileScreen from './ProfileScreen';
import { useVoiceActivation } from '../contexts/VoiceActivationContext';
import { Signal, Wifi, Battery, Star, Bell, Mic, MessageCircle, User, ChevronRight, Play, Pause, Home, History } from 'lucide-react';
import Lottie from 'lottie-react';
import logoData from '../logo.json';

const MainScreen = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [playingAudio, setPlayingAudio] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  
  // Voice activation context
  const {
    isListening,
    audioLevel,
    error,
    isInitialized
  } = useVoiceActivation();

  const trendingVoices = [
    { id: 1, avatar: '👩‍🦳', duration: '0:08', isPlaying: false },
    { id: 2, avatar: '👩‍🦰', duration: '0:12', isPlaying: false },
    { id: 3, avatar: '👨‍🦲', duration: '0:15', isPlaying: false }
  ];


  const handlePlayAudio = (id) => {
    setPlayingAudio(playingAudio === id ? null : id);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'profile') {
      setShowProfile(true);
    } else if (tabId === 'record') {
      onNavigate('record');
    }
  };

  const generateWaveform = () => {
    return Array.from({ length: 8 }, (_, i) => (
      <div
        key={i}
        className="bg-white rounded-sm"
        style={{
          width: '3px',
          height: `${Math.random() * 20 + 8}px`
        }}
      ></div>
    ));
  };

  if (showProfile) {
    return <ProfileScreen onBack={() => setShowProfile(false)} />;
  }

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

      {/* App Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center">
          <div className="w-8 h-8">
            <Lottie
              animationData={logoData}
              loop={true}
              className="w-full h-full"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="bg-gray-800 px-3 py-1 rounded-lg flex items-center space-x-1">
            <Star className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">Premium</span>
          </button>
          
          <button className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Greeting Section */}
      <div className="px-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Good Morning! Jayden 👋
        </h1>
        <p className="text-xl font-bold text-gray-300">
          Let's see what can I do for you?
        </p>
      </div>

      {/* Feature Cards */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          {/* AI Voice Generator - Large Card */}
          <div className="col-span-2 bg-gray-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500 opacity-10 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-500 opacity-10 rounded-full -ml-8 -mb-8"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center mr-3">
                  <Mic className="w-6 h-6 text-gray-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">AI Voice Generator</h3>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6 text-sm">
                Say "Hey Buddy" to start recording
              </p>
              
              {/* Ultra-smooth audio level indicator */}
              {isInitialized && (
                <div className="mb-4">
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-100 ease-out"
                      style={{ 
                        width: `${Math.min(Math.max(audioLevel * 100, 5), 100)}%`,
                        transform: 'translateZ(0)', // Hardware acceleration
                        willChange: 'width' // Optimize for smooth animations
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Error indicator - only show if there's an error */}
              {error && (
                <div className="mb-4 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}
              
              {/* Simple status indicator */}
              <div className="text-center">
                {!isInitialized ? (
                  <div className="text-gray-400 text-sm">Initializing voice activation...</div>
                ) : isListening ? (
                  <div className="text-blue-400 text-sm">🎤 Listening...</div>
                ) : (
                  <div className="text-gray-400 text-sm">Ready to listen</div>
                )}
              </div>
            </div>
          </div>

          {/* Text-to-speech Card */}
          <div className="bg-gray-800 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500 opacity-10 rounded-full -mr-6 -mt-6"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center mr-2">
                  <MessageCircle className="w-4 h-4 text-gray-300" />
                </div>
                <h4 className="text-sm font-semibold">Text-to-speech</h4>
              </div>
              
              <button className="w-full bg-gray-700 hover:bg-gray-600 py-2 px-3 rounded-lg flex items-center justify-between text-sm transition-colors">
                <span>Create new</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            </div>
          </div>

          {/* AI Voice Changer Card */}
          <div className="bg-gray-800 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500 opacity-10 rounded-full -mr-6 -mt-6"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center mr-2">
                  <User className="w-4 h-4 text-gray-300" />
                </div>
                <h4 className="text-sm font-semibold">AI Voice Changer</h4>
              </div>
              
              <button className="w-full bg-gray-700 hover:bg-gray-600 py-2 px-3 rounded-lg flex items-center justify-between text-sm transition-colors">
                <span>Create new</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Voice Section */}
      <div className="px-6 mb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center">
            Trending Voice 🔥
          </h2>
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            See all
          </button>
        </div>

        <div className="space-y-3">
          {trendingVoices.map((voice) => (
            <div key={voice.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-lg">
                  {voice.avatar}
                </div>
                <div className="flex items-center space-x-2">
                  {generateWaveform()}
                </div>
                <span className="text-sm text-gray-400">{voice.duration}</span>
              </div>
              
              <button
                onClick={() => handlePlayAudio(voice.id)}
                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
              >
                {playingAudio === voice.id ? (
                  <Pause className="w-4 h-4 text-gray-300" />
                ) : (
                  <Play className="w-4 h-4 text-gray-300" />
                )}
              </button>
            </div>
          ))}
        </div>
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

export default MainScreen;
