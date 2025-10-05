import React, { useState, useEffect, useCallback } from 'react';
import ProfileScreen from './ProfileScreen';
import { useVoiceActivation } from '../contexts/VoiceActivationContext';
import { Star, Bell, Mic, MessageCircle, User, ChevronRight, Play, Pause, Home, AlertCircle } from 'lucide-react';
import Lottie from 'lottie-react';
import logoData from '../logo.json';

const MainScreen = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [playingAudio, setPlayingAudio] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  
  // Voice activation context
  const {
    isListening,
    audioLevel,
    error,
    isInitialized,
    currentGreeting,
    greetingInitialized,
    triggerGreetingSpeech,
    useFallbackMode,
    // New state variables
    isSpeaking,
    voiceActivationReady,
    speechInProgress,
    voiceActivationState
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

  // Enable speech on first user interaction with smooth coordination
  const enableSpeech = useCallback(async () => {
    if (!speechEnabled) {
      console.log('Speech enabled by user interaction');
      
      // First set speech as enabled to prevent multiple triggers
      setSpeechEnabled(true);
      
      // Add a small delay before triggering greeting on mobile
      if (useFallbackMode && !greetingInitialized) {
        // Wait for any pending microphone initialization
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('🎤 Mobile: Triggering greeting after microphone setup');
        if (!greetingInitialized) {
          try {
            await triggerGreetingSpeech();
          } catch (error) {
            console.warn('Failed to trigger greeting:', error);
            // Continue anyway - the greeting will show when ready
          }
        }
      }
    }
  }, [speechEnabled, triggerGreetingSpeech, useFallbackMode, greetingInitialized, voiceActivationReady, voiceActivationState]);

  // Handle any user interaction to enable mobile TTS
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!speechEnabled) {
        enableSpeech();
      }
    };

    // Add event listeners for user interaction
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [speechEnabled, enableSpeech]);

  // Check microphone permission on load
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        // Check if we have stored permission
        const permissionGranted = localStorage.getItem('microphonePermissionGranted');
        const permissionTime = localStorage.getItem('microphonePermissionTime');
        
        // If permission is older than 24 hours, re-request
        if (permissionTime && Date.now() - parseInt(permissionTime) > 24 * 60 * 60 * 1000) {
          localStorage.removeItem('microphonePermissionGranted');
          localStorage.removeItem('microphonePermissionTime');
        }

        // If no permission or permission expired, show appropriate modal
        if (!permissionGranted) {
          // Small delay to let the app load first
          setTimeout(() => {
            // Hands-free mode - no need to show permission modal
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking microphone permission:', error);
      }
    };

    checkMicrophonePermission();
  }, []);

  // Auto-enable speech on first user interaction with smooth coordination
  useEffect(() => {
    let hasTriggered = false;
    let setupTimeout = null;
    
    const handleUserInteraction = async () => {
      if (!hasTriggered && !speechEnabled) {
        hasTriggered = true;
        console.log('User interaction detected, coordinating speech setup...');
        
        // Clear any pending auto-enable timer
        if (setupTimeout) {
          clearTimeout(setupTimeout);
        }
        
        // Wait for greeting to be ready if needed
        if (!currentGreeting) {
          console.log('Waiting for greeting to be ready...');
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        // Enable speech with smooth coordination
        if (!speechEnabled) {
          console.log('Enabling speech with coordination...');
          await enableSpeech();
        }
      }
    };

    // Use a single, more specific event listener with passive option for better performance
    const events = ['click', 'keydown', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true, passive: true });
    });

    // Smoother fallback timer with progressive checks
    setupTimeout = setTimeout(async () => {
      if (!hasTriggered && !speechEnabled) {
        console.log('Auto-setup: Checking conditions...');
        
        // Progressive enabling with proper coordination
        if (currentGreeting || greetingInitialized) {
          hasTriggered = true;
          console.log('Auto-setup: Conditions met, enabling speech...');
          await enableSpeech();
        } else {
          console.log('Auto-setup: Waiting for greeting initialization...');
          // Additional wait for greeting
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (!hasTriggered && !speechEnabled) {
            hasTriggered = true;
            await enableSpeech();
          }
        }
      }
    }, 2000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
      if (setupTimeout) {
        clearTimeout(setupTimeout);
      }
    };
  }, [speechEnabled, currentGreeting, greetingInitialized, enableSpeech]);


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
    return <ProfileScreen onBack={() => setShowProfile(false)} onNavigate={onNavigate} />;
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* App Header */}
      <div className="flex items-center justify-between px-6 py-4 main-content-safe">
        <div className="w-11 h-11 rounded-lg flex items-center justify-center">
          <div className="w-9 h-9">
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

      {/* Intelligent Greeting Section */}
      <div className="px-6 mb-6">
        {greetingInitialized && currentGreeting ? (
          <div className="space-y-4">
            {/* Main Greeting with smooth transition */}
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-3">
                {/* Modern Hand Wave Icon with dynamic greeting */}
                <h1 className="text-3xl font-light text-white/90 tracking-wide transition-opacity duration-500 ease-in-out">
                  {currentGreeting.text || "👋🏻 Hey Jayden"}
                </h1>
              </div>
              
              {/* Modern Speech Status Indicator */}
              <div className="flex justify-center">
                {voiceActivationState === 'initializing' && (
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-pulse mr-3"></div>
                    <span className="text-sm font-medium text-amber-300">AI preparing to speak</span>
                  </div>
                )}
                
                {voiceActivationState === 'speaking' && (
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse mr-3"></div>
                    <span className="text-sm font-medium text-blue-300">AI speaking</span>
                  </div>
                )}
                
                {voiceActivationState === 'listening' && (
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse mr-3"></div>
                    <span className="text-sm font-medium text-green-300">AI listening</span>
                  </div>
                )}
                
                {voiceActivationState === 'ready' && (
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-emerald-300">AI voice ready</span>
                  </div>
                )}
                
                {voiceActivationState === 'error' && (
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-gradient-to-r from-red-400 to-pink-400 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-red-300">AI voice error</span>
                  </div>
                )}
              </div>
            </div>
            
            
            {/* Modern Context Display */}
            <div className="flex justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span className="text-gray-400">Time:</span>
                <span className="text-white/80 font-medium capitalize">{currentGreeting.timeOfDay}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                <span className="text-gray-400">Mood:</span>
                <span className="text-white/80 font-medium capitalize">{currentGreeting.mood}</span>
              </div>
            </div>
            
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3">
              {/* Modern Hand Wave Icon - Loading State */}
              <div className="relative group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.5 12C19.43 12 21 10.43 21 8.5S19.43 5 17.5 5C16.74 5 16.06 5.33 15.58 5.85L14.5 7H13.5L12.5 5.5C12.22 5.19 11.85 5 11.5 5H10.5L9.5 6.5C9.22 6.81 8.85 7 8.5 7H7.5L6.42 5.85C5.94 5.33 5.26 5 4.5 5C2.57 5 1 6.57 1 8.5S2.57 12 4.5 12H17.5Z"/>
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse shadow-md"></div>
              </div>
              
              <h1 className="text-3xl font-light text-white/90 tracking-wide">
                Hello Jayden
              </h1>
            </div>
            
            {/* Modern Loading Indicator */}
            <div className="flex justify-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 backdrop-blur-sm">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse mr-3"></div>
                <span className="text-sm font-medium text-blue-300">Preparing your greeting</span>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Analyzing context</span>
              </div>
            </div>
          </div>
        )}
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
              
              {/* Error indicator - show mobile-friendly messages */}
              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-red-400 text-xs">
                      {error.includes('no available backend') || error.includes('Out of memory') ? (
                        <div>
                          <p className="font-medium mb-1">Mobile Voice Mode Active</p>
                          <p>Using simplified voice recognition for better mobile performance.</p>
                          <p className="mt-1 text-red-300">Hands-free listening will start automatically.</p>
                        </div>
                      ) : (
                        <p>{error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Mobile fallback mode indicator */}
              {useFallbackMode && !error && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <p className="text-blue-400 text-xs">
                      {voiceActivationState === 'speaking' 
                        ? 'Mobile-optimized voice mode • AI speaking'
                        : voiceActivationState === 'listening'
                        ? 'Mobile-optimized voice mode • Hands-free listening active'
                        : speechEnabled 
                        ? 'Mobile-optimized voice mode • Ready'
                        : 'Tap anywhere to enable voice features'
                      }
                    </p>
                  </div>
                </div>
              )}
              
              {/* Enhanced status indicator */}
              <div className="text-center">
                {voiceActivationState === 'initializing' && (
                  <div className="text-amber-400 text-sm">🔄 Initializing voice activation...</div>
                )}
                {voiceActivationState === 'speaking' && (
                  <div className="text-blue-400 text-sm">🔊 AI speaking...</div>
                )}
                {voiceActivationState === 'listening' && (
                  <div className="text-green-400 text-sm">🎤 Listening for wake word...</div>
                )}
                {voiceActivationState === 'ready' && (
                  <div className="text-emerald-400 text-sm">✅ Ready to listen</div>
                )}
                {voiceActivationState === 'error' && (
                  <div className="text-red-400 text-sm">❌ Voice activation error</div>
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
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/95 via-gray-800/90 to-gray-800/80 backdrop-blur-xl border-t border-gray-600/30 shadow-2xl nav-safe">
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
