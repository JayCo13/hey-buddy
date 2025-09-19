import React from 'react';
import Lottie from 'lottie-react';
import logoData from '../logo.json';
import ShinyText from '../effects/ShinyText';
import Shuffle from '../effects/Shuffle';

const SplashScreen = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1A1A1A' }}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Lottie Logo Animation */}
        <div className="mb-5">
          <div className="w-32 h-33 flex items-center justify-center">
            <Lottie
              animationData={logoData}
              loop={true}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-xl font-bold text-white mb-2 tracking-wider">
          <Shuffle
            text="HEY-BUDDY"
            shuffleDirection="right"
            duration={0.7}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power3.out"
            stagger={0.03}
            threshold={0.1}
            triggerOnce={true}
            triggerOnHover={true}
            respectReducedMotion={true}
          />
        </h1>

        {/* Tagline */}
        <ShinyText
          text="Jarvis in the real life"
          disabled={false}
          speed={3}
          className='custom-class'
        />
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
