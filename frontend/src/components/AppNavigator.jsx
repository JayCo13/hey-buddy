import React, { useState } from 'react';
import MainScreen from './MainScreen';
import RecordScreen from './RecordScreen';
import ProfileScreen from './ProfileScreen';
import CreativityScreen from './CreativityScreen';
import LoadingScreen from './LoadingScreen';
import { VoiceActivationProvider } from '../contexts/VoiceActivationContext';

const AppNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetScreen, setTargetScreen] = useState(null);

  const handleNavigation = (screen) => {
    if (screen === 'record' && currentScreen !== 'record') {
      // Show loading screen immediately when navigating to record
      setIsNavigating(true);
      setTargetScreen(screen);
      
      // Delay the actual navigation to show smooth loading
      setTimeout(() => {
        setCurrentScreen(screen);
        setIsNavigating(false);
        setTargetScreen(null);
      }, 2000);
    } else {
      setCurrentScreen(screen);
    }
  };

  const handleNavigateToRecord = () => {
    // Show loading screen when navigating via voice command
    setIsNavigating(true);
    setTargetScreen('record');
    
    // Delay the actual navigation to show smooth loading
    setTimeout(() => {
      setCurrentScreen('record');
      setIsNavigating(false);
      setTargetScreen(null);
    }, 2000);
  };

  const renderScreen = () => {
    // Show loading screen when navigating to record
    if (isNavigating && targetScreen === 'record') {
      return <LoadingScreen message="Loading Record Room..." />;
    }

    switch (currentScreen) {
      case 'home':
        return <MainScreen onNavigate={handleNavigation} />;
      case 'record':
        return <RecordScreen onNavigate={handleNavigation} />;
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigation} />;
      case 'creativity':
        return <CreativityScreen onNavigate={handleNavigation} />;
      default:
        return <MainScreen onNavigate={handleNavigation} />;
    }
  };

  return (
    <VoiceActivationProvider onNavigateToRecord={handleNavigateToRecord}>
      <div className="min-h-screen bg-black">
        {renderScreen()}
      </div>
    </VoiceActivationProvider>
  );
};

export default AppNavigator;
