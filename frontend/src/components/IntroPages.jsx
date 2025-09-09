import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import animationData from '../lottie.json';
import { Signal, Wifi, Battery } from 'lucide-react';

const IntroPages = ({ onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeString = `${hours}:${minutes.toString().padStart(2, '0')}`;
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const pages = [
    {
      title: "Personal AI Buddy",
      subtitle: "Meet Buddy",
      description: "Your Own AI Assistant",
      tagline: "Ask Your Questions & Receive Articles Using Artificial Intelligence Assistant",
      isFirstPage: true
    },
    {
      title: "Hand-free",
      subtitle: "Your hands-free companion for a seamless, natural conversation.",
      isSecondPage: true,
      problems: [
        {
          id: "no-internet",
          title: "No internet connection?",
          description: "Works completely offline with no data required",
          icon: "📱",
          illustration: "phone-wifi"
        },
        {
          id: "phone-interaction", 
          title: "Don't want to interact with the phone too much",
          description: "Natural voice commands and hands-free operation",
          icon: "👤",
          illustration: "person-phone"
        },
        {
          id: "low-energy",
          title: "Feeling boring no energy for a new day?",
          description: "AI-powered motivation and energy boosting conversations",
          icon: "😴",
          illustration: "tired-person"
        },
        {
          id: "calendar-overwhelm",
          title: "Be overwhelm with a dense calendar?",
          description: "Smart scheduling and calendar optimization",
          icon: "📅",
          illustration: "calendar"
        }
      ]
    }
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onComplete();
    }
  };

  const skipIntro = () => {
    onComplete();
  };

  const getVisualElement = (visual) => {
    switch (visual) {
      case 'offline':
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-full"></div>
          </div>
        );
      case 'voice':
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
        );
      case 'energy':
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
          </div>
        );
      case 'schedule':
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden relative">
      {/* Technical Background Animations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-20 gap-2 h-full">
            {[...Array(200)].map((_, i) => (
              <div 
                key={i} 
                className="border border-blue-400/20 rounded-sm animate-pulse"
                style={{ 
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              ></div>
            ))}
          </div>
        </div>
        
        {/* Floating Tech Elements */}
        <div className="absolute top-20 left-10 w-16 h-16 border border-blue-400/30 rounded-lg rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
        <div className="absolute top-40 right-20 w-12 h-12 border border-cyan-400/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-20 w-20 h-20 border border-purple-400/30 rounded-lg rotate-12 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3s' }}></div>
        <div className="absolute bottom-20 right-10 w-14 h-14 border border-pink-400/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Moving Lines */}
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent animate-pulse"></div>
        <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-2 text-white text-sm relative z-10">
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
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">
        {pages[currentPage].isFirstPage ? (
          // First page layout matching the image
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            {/* Title at top */}
            <div className="mb-2">
              <p className="text-white/80 text-sm font-medium mb-1">
                {pages[currentPage].title}
              </p>
            </div>

            {/* Robot Animation */}
            <div className="w-64 h-64 mb-6 flex items-center justify-center">
              <Lottie 
                animationData={animationData} 
                loop={true}
                className="w-full h-full"
              />
            </div>

            {/* Main title and subtitle */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                {pages[currentPage].subtitle}
              </h1>
              <p className="text-xl text-white/90 mb-4">
                {pages[currentPage].description}
              </p>
              <p className="text-white/70 text-sm leading-relaxed">
                {pages[currentPage].tagline}
              </p>
            </div>
          </div>
        ) : pages[currentPage].isSecondPage ? (
          // Second page - Phone frame layout with problem cards
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            {/* iPhone Frame */}
            <div className="relative">
              {/* Modern Phone outer frame */}
              <div className="w-64 h-[500px] bg-gradient-to-b from-gray-700 to-gray-900 rounded-[2.5rem] p-1.5 shadow-2xl border border-gray-500/30">
                {/* Camera notch */}
                <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-20 h-5 bg-black rounded-b-2xl z-10"></div>
                
                {/* Phone screen */}
                <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black rounded-[2.3rem] overflow-hidden relative">
                  {/* Modern Status bar */}
                  <div className="flex justify-between items-center px-6 py-3 text-white text-sm font-medium relative z-20">
                    <span className="font-semibold">9:41</span>
                    <div className="flex items-center space-x-1.5">
                      {/* Signal bars */}
                      <div className="flex space-x-0.5">
                        <div className="w-1 h-3 bg-white rounded-sm"></div>
                        <div className="w-1 h-3 bg-white rounded-sm"></div>
                        <div className="w-1 h-3 bg-white rounded-sm"></div>
                        <div className="w-1 h-3 bg-white/70 rounded-sm"></div>
                      </div>
                      {/* WiFi icon */}
                      <svg width="16" height="12" viewBox="0 0 24 24" className="fill-white">
                        <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                      </svg>
                      {/* Battery icon */}
                      <div className="relative">
                        <div className="w-6 h-3 border border-white rounded-sm">
                          <div className="w-4 h-1.5 bg-green-400 rounded-sm m-0.5"></div>
                        </div>
                        <div className="absolute -right-0.5 top-0.5 w-0.5 h-2 bg-white rounded-r-sm"></div>
                      </div>
                    </div>
                  </div>

                  {/* Phone content */}
                  <div className="px-4 py-2 h-full flex flex-col">
                    {/* Simplified Header */}
                    <div className="text-center mb-2 mt-1">
                      {/* Timer with modern styling */}
                      <div className="text-gray-400 text-xs mb-1 font-medium">0:03</div>
                      
                      {/* Greeting */}
                      <div className="text-white text-sm mb-1">
                        <span className="text-gray-400">Hello, </span>
                        <span className="text-white font-semibold">Morning AI</span>
                      </div>
                    </div>

                    {/* Compact decorative wave */}
                    <div className="flex justify-center mb-2">
                      <svg width="80" height="20" viewBox="0 0 80 20" className="drop-shadow-sm">
                        <defs>
                          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8"/>
                            <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.6"/>
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.4"/>
                          </linearGradient>
                        </defs>
                        <path d="M0 10 Q20 3, 40 10 T80 10 L80 20 L0 20 Z" fill="url(#waveGradient)"/>
                        <path d="M0 12 Q25 5, 50 12 T80 12 L80 20 L0 20 Z" fill="url(#waveGradient)" opacity="0.7"/>
                      </svg>
                    </div>

                    {/* Modern problem cards in 2x2 grid */}
                    <div className="grid grid-cols-2 gap-2 flex-1 pb-3">
                      {pages[currentPage].problems.map((problem, index) => {
                        const getModernIcon = (id) => {
                          switch(id) {
                            case 'no-internet':
                              return (
                                <svg width="12" height="12" viewBox="0 0 24 24" className="fill-white">
                                  <path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zM7 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
                                  <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              );
                            case 'phone-interaction':
                              return (
                                <svg width="12" height="12" viewBox="0 0 24 24" className="fill-white">
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                              );
                            case 'low-energy':
                              return (
                                <svg width="12" height="12" viewBox="0 0 24 24" className="fill-white">
                                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
                                </svg>
                              );
                            case 'calendar-overwhelm':
                              return (
                                <svg width="12" height="12" viewBox="0 0 24 24" className="fill-white">
                                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                                  <rect x="7" y="10" width="5" height="5" fill="currentColor"/>
                                </svg>
                              );
                            default:
                              return <span className="text-white text-sm">{problem.icon}</span>;
                          }
                        };

                        return (
                          <div
                            key={problem.id}
                            className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-sm rounded-xl p-2 flex flex-col items-center justify-center text-center border border-gray-600/30 shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            {/* Smaller modern icon with gradient background */}
                            <div className="w-6 h-6 mb-1 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                              {getModernIcon(problem.id)}
                            </div>
                            <h4 className="text-white text-[12px] font-medium leading-tight text-center px-0.5">
                              {problem.title}
                            </h4>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modern phone home indicator */}
              <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-white/30 rounded-full"></div>
            </div>

            {/* Bottom content with modern styling */}
            <div className="mt-4 text-center">
              <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                {pages[currentPage].title}
              </h1>
              <p className="text-white/80 text-sm leading-relaxed max-w-xs px-2">
                {pages[currentPage].subtitle}
              </p>
            </div>
          </div>
        ) : (
          // Original layout for other pages
          <div className="flex flex-col md:flex-row items-center justify-center w-full">
            {/* Enhanced Header Section for non-first pages */}
            <div className="w-full text-center mb-8">
        <div className="relative">
          {/* Glowing background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl transform scale-110"></div>
          
          {/* Main content */}
          <div className="relative bg-gray-800/30 backdrop-blur-sm rounded-3xl p-8 border border-blue-400/20">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 mb-4 animate-pulse">
              {pages[currentPage].title}
            </h1>
            <p className="text-lg md:text-xl text-white mb-3 font-light">
              {pages[currentPage].subtitle}
            </p>
                  {pages[currentPage].highlight && (
            <div className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full border border-blue-400/30">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
              <p className="text-blue-300 text-sm font-medium">
                {pages[currentPage].highlight}
              </p>
            </div>
                  )}
          </div>
        </div>
      </div>

            {/* Three column layout for non-first pages */}
            <div className="flex flex-col md:flex-row items-center justify-center w-full">
        {/* Left Section - Problems */}
              {pages[currentPage].problems && (
        <div className="w-full md:w-1/3 mb-4 md:mb-0 md:pr-4">
          <div className="space-y-3">
            {pages[currentPage].problems.map((problem, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-800/60 backdrop-blur-sm rounded-lg border border-blue-400/10 hover:border-blue-400/20 transition-all duration-300">
                {getVisualElement(problem.visual)}
                <div>
                  <h3 className="text-white font-medium text-sm mb-1">{problem.text}</h3>
                  <p className="text-gray-400 text-xs">{problem.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
              )}

        {/* Center Section - Solution */}
              {pages[currentPage].solution && (
        <div className="w-full md:w-1/3 flex flex-col items-center justify-center mb-4 md:mb-0 relative z-10">
          <div className="relative">
            {/* Glowing background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 rounded-2xl blur-lg transform scale-105"></div>
            
            {/* Main content */}
            <div className="relative bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/20">
              {/* Modern AI Icon */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center transform rotate-12 animate-pulse">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-sm"></div>
                    </div>
                  </div>
                  {/* Orbiting elements */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 mb-3 text-center">
                {pages[currentPage].solution}
              </h2>
              
              {/* Modern directional indicators */}
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              </div>
            </div>
          </div>
        </div>
              )}

        {/* Right Section - Features */}
              {pages[currentPage].features && (
        <div className="w-full md:w-1/3 md:pl-4">
          <div className="space-y-2">
            {pages[currentPage].features.map((feature, index) => (
              <div key={index} className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 border border-blue-400/10 hover:border-blue-400/20 transition-all duration-300">
                <div className={`w-full h-1 bg-gradient-to-r ${feature.color} rounded-full mb-2 animate-pulse`}></div>
                <h3 className="text-white font-medium text-sm mb-1">{feature.title}</h3>
                <p className="text-gray-400 text-xs">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center space-x-2 mb-4 relative z-10">
        {pages.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentPage 
                ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-500/50' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
          ></div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center px-4 pb-4 relative z-10">
        <button
          onClick={skipIntro}
          className="px-4 py-2 bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300 text-sm border border-gray-600/50 hover:border-gray-500/50"
        >
          Skip
        </button>
        <button
          onClick={nextPage}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
        >
          {currentPage === 0 ? 'Get started' : currentPage === pages.length - 1 ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default IntroPages;