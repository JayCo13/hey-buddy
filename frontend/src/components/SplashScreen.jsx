import React, { useState, useEffect } from 'react';
import { Signal, Wifi, Battery } from 'lucide-react';
import Lottie from 'lottie-react';
import logoData from '../logo.json';

const SplashScreen = () => {
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeString = `${hours}:${minutes.toString().padStart(2, '0')}`;
      setCurrentTime(timeString);
    };

    // Update time immediately
    updateTime();
    
    // Update time every minute
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-6 py-2 text-white text-sm">
        <span className="font-medium">{currentTime}</span>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Lottie Logo Animation */}
        <div className="mb-8">
          <div className="w-32 h-32 flex items-center justify-center">
            <Lottie
              animationData={logoData}
              loop={true}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-bold text-white mb-2 tracking-wider">
          HEY-BUDDY
        </h1>

        {/* Tagline */}
        <p className="text-gray-300 text-lg font-light">
          your AI soulmate
        </p>
      </div>

      {/* Bottom Credit */}
      <div className="pb-8 flex justify-center">
        <p className="text-white text-sm font-medium tracking-wider">
          POWERED BY VIETNAM TEAM
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
