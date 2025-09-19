import React, { useEffect, useState } from 'react';
import './App.css';
import { initializeDatabase } from './db/database';
import SplashScreen from './components/SplashScreen';
import IntroPages from './components/IntroPages';
import AppNavigator from './components/AppNavigator';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import offlineSyncManager from './utils/offlineSync';
import { VoiceActivationProvider } from './contexts/VoiceActivationContext';

function App() {
  const [dbReady, setDbReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [userId] = useState('1'); // Mock user ID for demo

  useEffect(() => {
    // Initialize database
    const initDB = async () => {
      const success = await initializeDatabase();
      setDbReady(success);
    };
    
    // Initialize service worker
    const initSW = async () => {
      // Service worker is now handled in index.js
      console.log('Service worker registration handled in index.js');
    };
    
    // Initialize offline sync
    const initOfflineSync = () => {
      offlineSyncManager.init();
    };
    
    initDB();
    initSW();
    initOfflineSync();

    // Show splash screen for 5 seconds, then intro
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      setShowIntro(true);
    }, 7000);

    return () => clearTimeout(splashTimer);
  }, []);

  // Show splash screen
  if (showSplash) {
    return <SplashScreen />;
  }

  // Show intro pages
  if (showIntro) {
    return <IntroPages onComplete={() => setShowIntro(false)} />;
  }

  if (!dbReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Initializing database...</p>
        </div>
      </div>
    );
  }

  return (
    <VoiceActivationProvider>
      <AppNavigator />
      <PWAInstallPrompt />
    </VoiceActivationProvider>
  );
}

export default App;
