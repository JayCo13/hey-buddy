import React from 'react';

const LoadingScreen = ({ message = "Initializing AI Protocol..." }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{
      background: `
        radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 70%),
        linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)
      `,
      backgroundImage: `
        linear-gradient(rgba(147, 51, 234, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(34, 211, 238, 0.05) 1px, transparent 1px)
      `,
      backgroundSize: '24px 24px'
    }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center relative">
          {/* Holographic Orb Container */}
          <div className="relative w-32 h-32 mx-auto mb-12">
            {/* Outer Ripple Effects */}
             <div className="absolute inset-0 rounded-full border border-purple-500 opacity-25 animate-ping" style={{animationDuration: '3s'}}></div>
             <div className="absolute -inset-4 rounded-full border border-cyan-400 opacity-15 animate-ping" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
             <div className="absolute -inset-8 rounded-full border border-blue-500 opacity-8 animate-ping" style={{animationDuration: '5s', animationDelay: '2s'}}></div>
            
            {/* Main Holographic Orb */}
             <div className="absolute inset-2 rounded-full" style={{
               background: `
                 radial-gradient(circle at 30% 30%, rgba(147, 51, 234, 0.9) 0%, rgba(147, 51, 234, 0.5) 25%, rgba(59, 130, 246, 0.7) 50%, rgba(34, 211, 238, 0.4) 75%, rgba(34, 211, 238, 0.1) 100%)
               `,
               boxShadow: `
                 0 0 40px rgba(147, 51, 234, 0.6),
                 0 0 80px rgba(59, 130, 246, 0.4),
                 0 0 120px rgba(34, 211, 238, 0.3),
                 inset 0 0 40px rgba(255, 255, 255, 0.15)
               `,
               animation: 'orbPulse 2.5s ease-in-out infinite, orbRotate 10s linear infinite'
             }}>
              {/* Inner Core */}
               <div className="absolute inset-4 rounded-full" style={{
                 background: `radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(147, 51, 234, 0.8) 30%, rgba(34, 211, 238, 0.6) 70%, transparent 100%)`,
                 animation: 'corePulse 2s ease-in-out infinite alternate'
               }}></div>
            </div>
            

          </div>
          
          {/* AI Protocol Text */}
           <p className="text-lg font-light tracking-wider text-gray-200" style={{
             fontFamily: 'system-ui, -apple-system, sans-serif',
             textShadow: '0 0 15px rgba(147, 51, 234, 0.4), 0 0 30px rgba(34, 211, 238, 0.2)',
             animation: 'textFade 4s ease-in-out infinite'
           }}>
            {message}
          </p>
          
          {/* Progress Dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {[...Array(3)].map((_, i) => (
               <div key={i} className="w-2 h-2 rounded-full" style={{
                 background: i === 0 ? '#9333EA' : i === 1 ? '#3B82F6' : '#22D3EE',
                 boxShadow: `0 0 10px ${i === 0 ? 'rgba(147, 51, 234, 0.6)' : i === 1 ? 'rgba(59, 130, 246, 0.6)' : 'rgba(34, 211, 238, 0.6)'}`,
                 animation: `dotPulse 2s ease-in-out infinite`,
                 animationDelay: `${i * 0.6}s`
               }}></div>
             ))}
          </div>
        </div>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        
        @keyframes orbRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes corePulse {
          0% { opacity: 0.6; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.1); }
        }
        

        @keyframes textFade {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;