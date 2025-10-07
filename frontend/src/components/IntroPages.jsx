import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import screen1Animation from '../screen1.json';
import screen2Animation from '../screen2.json';
import screen3Animation from '../screen3.json';
import screen4Animation from '../screen4.json';
import { ArrowRight } from 'lucide-react';
import GradientText from '../effects/GradientText'

const IntroPages = ({ onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [elementsVisible, setElementsVisible] = useState(false);

  // Add CSS keyframes for attractive effects
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }
      
      @keyframes gentleGlow {
        0%, 100% {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        50% {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2), 0 0 8px rgba(255, 255, 255, 0.1);
        }
      }
      
      @keyframes subtleBounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-2px);
        }
      }
      
      @keyframes textReveal {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .fade-in-up {
        animation: fadeInUp 0.8s ease-out forwards;
      }
      
      .slide-in-left {
        animation: slideInLeft 0.8s ease-out forwards;
      }
      
      .slide-in-right {
        animation: slideInRight 0.8s ease-out forwards;
      }
      
      .scale-in {
        animation: scaleIn 0.8s ease-out forwards;
      }
      
      .shimmer {
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
      }
      
      .pulse {
        animation: pulse 2s infinite;
      }
      
      .gentle-glow {
        animation: gentleGlow 3s ease-in-out infinite;
      }
      
      .subtle-bounce {
        animation: subtleBounce 2s ease-in-out infinite;
      }
      
      .text-reveal {
        animation: textReveal 0.6s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);


  // Handle element visibility animations
  useEffect(() => {
    setElementsVisible(false);
    const timer = setTimeout(() => {
      setElementsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const pages = [
    {
      id: "phone-interaction",
      title: "Don't want to interact with the phone too much",
      subtitle: "Natural voice commands and hands-free operation",
      description: "Control your AI assistant through natural voice commands. No need to constantly look at your phone screen.",
      icon: "user-interface",
      animation: screen2Animation,
      isProblemPage: true
    },
    {
      id: "no-internet",
      title: "Internet Down? \nYour AI's Still Up.",
      subtitle: "Works completely offline with no data required",
      description: "Experience seamless AI assistance without relying on internet connectivity. Your AI companion works entirely on your device.",
      icon: "cloud-check",
      animation: screen1Animation,
      isProblemPage: true
    },
    {
      id: "low-energy",
      title: "Feeling boring no energy for a new day?",
      subtitle: "AI-powered motivation and energy boosting conversations",
      description: "Get personalized motivation and energy-boosting conversations from your AI companion to start your day right.",
      icon: "sunrise",
      animation: screen3Animation,
      isProblemPage: true
    },
    {
      id: "calendar-overwhelm",
      title: "Be overwhelm with a dense calendar?",
      subtitle: "Smart scheduling and calendar optimization",
      description: "Let AI help you manage your schedule intelligently, optimizing your time and reducing calendar overwhelm.",
      icon: "calendar-simple",
      animation: screen4Animation,
      isProblemPage: true
    }
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsTransitioning(false);
      }, 300);
    } else {
      onComplete();
    }
  };

  const skipIntro = () => {
    onComplete();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden relative" style={{ backgroundColor: '#1A1A1A' }}>
      {/* Dark AI Technology Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Neural Network Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-8 gap-4 h-full">
            {[...Array(32)].map((_, i) => (
              <div
                key={i}
                className="border border-gray-600 rounded-sm"
              ></div>
            ))}
          </div>
        </div>

        {/* Floating AI Elements */}
        <div className="absolute top-20 left-10 w-12 h-12 border border-gray-600 rounded-lg opacity-20 animate-pulse" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 right-20 w-8 h-8 border border-gray-500 rounded-full opacity-15 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-20 w-16 h-16 border border-gray-600 rounded-lg opacity-25 animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-10 w-10 h-10 border border-gray-500 rounded-full opacity-20 animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}></div>

        {/* Tech Flow Lines */}
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-600/30 to-transparent animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-500/20 to-transparent animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>

        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-gray-400 rounded-full animate-bounce opacity-30" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-gray-300 rounded-full animate-bounce opacity-25" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-gray-400 rounded-full animate-bounce opacity-30" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 py-4 relative z-10 overflow-y-auto main-content-safe">
        {/* Problem Screen Layout - Similar to provided image */}
        <div className={`w-full max-w-md mx-auto flex flex-col items-center justify-center h-full transition-all duration-300 ease-in-out ${isTransitioning
          ? 'transform translate-x-full opacity-0 scale-95'
          : 'transform translate-x-0 opacity-100 scale-100'
          }`}>
          {/* Attractive Decorative Elements */}
          {/* Animated geometric shapes */}
          <div className={`absolute top-20 left-8 w-12 h-12 border-2 border-blue-400/30 rounded-lg slide-in-left shimmer ${elementsVisible ? 'opacity-30' : 'opacity-0'
            }`} style={{ transitionDelay: '0.1s' }}>
            <div className="absolute inset-1 border border-blue-300/20 rounded-lg pulse"></div>
          </div>

          <div className={`absolute top-16 right-12 w-8 h-8 border-2 border-purple-400/25 rounded-full slide-in-right pulse ${elementsVisible ? 'opacity-25' : 'opacity-0'
            }`} style={{ transitionDelay: '0.3s' }}>
            <div className="absolute inset-1 border border-purple-300/15 rounded-full shimmer"></div>
          </div>

          <div className={`absolute top-24 right-8 w-6 h-6 border-2 border-cyan-400/30 rounded-lg scale-in shimmer ${elementsVisible ? 'opacity-20' : 'opacity-0'
            }`} style={{ transitionDelay: '0.5s' }}>
            <div className="absolute inset-0.5 border border-cyan-300/20 rounded-lg pulse"></div>
          </div>

          {/* Floating accent dots */}
          <div className={`absolute top-32 left-1/4 w-2 h-2 bg-blue-400/40 rounded-full fade-in-up pulse ${elementsVisible ? 'opacity-40' : 'opacity-0'
            }`} style={{ transitionDelay: '0.7s' }}></div>

          <div className={`absolute top-28 right-1/3 w-1.5 h-1.5 bg-purple-400/50 rounded-full fade-in-up pulse ${elementsVisible ? 'opacity-50' : 'opacity-0'
            }`} style={{ transitionDelay: '0.9s' }}></div>

          <div className={`absolute top-36 left-1/3 w-1 h-1 bg-cyan-400/60 rounded-full fade-in-up pulse ${elementsVisible ? 'opacity-60' : 'opacity-0'
            }`} style={{ transitionDelay: '1.1s' }}></div>

          {/* Title Section - Top */}
          <div className="w-full text-center mb-6">
            {/* Main Title */}
            <h1 className="text-3xl sm:text-3xl whitespace-pre-line">
              <GradientText
                colors={["#ffff", "#4079ff", "#ffff", "#4079ff", "#ffff"]}
                animationSpeed={3}
                showBorder={false}
                className="custom-class"
              >
                {pages[currentPage].title}
              </GradientText>
            </h1>
          </div>

          {/* Central Illustration Section */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* AI Character Container */}
            <div className={`relative mb-3 scale-in ${elementsVisible ? 'opacity-100' : 'opacity-0'
              }`} style={{ transitionDelay: '0.2s' }}>
              {/* AI Character - Enhanced Lottie Display */}
              <div className="relative w-80 h-80 flex items-center justify-center">
                {/* Glowing background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-3xl blur-xl pulse"></div>

                <Lottie
                  animationData={pages[currentPage].animation}
                  loop={true}
                  className={`w-full h-full fade-in-up shimmer rounded-3xl ${elementsVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                  style={{ transitionDelay: '0.4s' }}
                />

                {/* Floating accent rings */}
                <div className="absolute inset-0 border border-blue-400/20 rounded-3xl pulse"></div>
                <div className="absolute inset-2 border border-purple-400/15 rounded-3xl pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute inset-4 border border-cyan-400/10 rounded-3xl pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>

          {/* Text and Navigation Section */}
          <div className="w-full text-center">
            {/* Pagination Indicators */}
            <div className={`flex justify-center space-x-2 mb-6 fade-in-up ${elementsVisible ? 'opacity-100' : 'opacity-0'
              }`} style={{ transitionDelay: '0.6s' }}>
              {pages.map((_, index) => (
                <div
                  key={index}
                  className={`rounded-full transition-all duration-500 ease-out ${index === currentPage
                    ? 'bg-gradient-to-r from-blue-400 to-purple-400 w-8 h-2 shimmer'
                    : 'bg-gray-600 w-2 h-2 pulse'
                    } ${elementsVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                  style={{ transitionDelay: `${0.7 + index * 0.1}s` }}
                ></div>
              ))}
            </div>

            {/* Subtitle */}
            <p className={`text-md sm:text-xl md:text-2xl text-white mb-4 leading-relaxed text-reveal gentle-glow ${elementsVisible ? 'opacity-100' : 'opacity-0'
              }`} style={{
                fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                transitionDelay: '1.0s',
                fontWeight: '600',
                letterSpacing: '0.025em'
              }}>
              {pages[currentPage].subtitle}
            </p>

            {/* Description */}
            <p className={`text-xs sm:text-lg md:text-xl text-white mb-8 leading-relaxed text-reveal subtle-bounce ${elementsVisible ? 'opacity-100' : 'opacity-0'
              }`} style={{
                fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                transitionDelay: '1.2s',
                fontWeight: '400',
                lineHeight: '1.6',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}>
              {pages[currentPage].description}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation */}
      <div className={`px-4 py-4 relative z-10 fade-in-up nav-safe ${elementsVisible ? 'opacity-100' : 'opacity-0'
        }`} style={{
          transitionDelay: '1.4s',
          backgroundColor: '#1A1A1A',
          borderTop: '1px solid #374151'
        }}>
        {/* Navigation Buttons */}
        <div className={`flex items-center ${currentPage === pages.length - 1 ? 'justify-center' : 'justify-between'}`}>
          {currentPage !== pages.length - 1 && (
            <button
              onClick={skipIntro}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-500 text-sm slide-in-left pulse ${elementsVisible ? 'opacity-100' : 'opacity-0'
                }`}
              style={{
                fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                transitionDelay: '1.5s',
                backgroundColor: '#4079ff',
                border: '1px solid #4079ff',
                color: '#ffffff',
                fontWeight: '600'
              }}
            >
              Skip
            </button>
          )}

          <button
            onClick={nextPage}
            className={`${currentPage === pages.length - 1 ? 'w-full px-6 py-3' : 'px-6 py-2'} rounded-lg font-semibold transition-all duration-500 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 slide-in-right pulse ${elementsVisible ? 'opacity-100' : 'opacity-0'
              }`}
            style={{
              fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              transitionDelay: currentPage === pages.length - 1 ? '1.5s' : '1.6s',
              backgroundColor: '#4079ff',
              border: '1px solid #4079ff',
              color: '#ffffff',
              fontWeight: '600'
            }}
          >
            {currentPage === pages.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="w-3 h-3 text-current" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntroPages;