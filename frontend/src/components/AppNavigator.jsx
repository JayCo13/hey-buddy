import React, { useState } from 'react';
import MainScreen from './MainScreen';
import RecordScreen from './RecordScreen';
import ProfileScreen from './ProfileScreen';
import { VoiceActivationProvider } from '../contexts/VoiceActivationContext';

const AppNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState('home');

  const handleNavigation = (screen) => {
    setCurrentScreen(screen);
  };

  const handleNavigateToRecord = () => {
    setCurrentScreen('record');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <MainScreen onNavigate={handleNavigation} />;
      case 'record':
        return <RecordScreen onNavigate={handleNavigation} />;
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigation} />;
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
